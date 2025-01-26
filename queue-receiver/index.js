import { Elysia, t } from 'elysia'
import { getChatId, userProfile } from '../provider/line'
import { pgClient, pgQueue, queueName } from '../provider/db'
import { flowisePrediction } from '../provider/proxy/flowise'
import { logger } from '../provider/logger'
import { randomUUIDv7 } from 'bun'
const crypto = require('crypto')

const clientConn = await pgClient()
const clientQueue = await pgQueue()

const app = new Elysia()

const valid_channels = ['line', 'discord']
const valid_bots = ['popcorn', 'aide']
// const waitAnimation = 60

app.post('/_healthz', async () => {
  return new Response('☕')
})

const isCommandIncluded = (event, cmd) => {
  return event?.message?.type === 'text' && event.message.text.trim().match(new RegExp(`^/${cmd}`, 'ig'))
}

const queueSend = async (options, messages = []) => {
  const queueId = await clientQueue.msg.send(queueName, { ...options, messages })
  logger.info(`[queue:${queueId}] ${options.botName}:${options.displayName}`)
}

app.put('/:channel/:botName', async ({ headers, body, params, query }) => {
  try {
    let apiKey = query.apiKey
    let text = query?.text

    const credentials = (headers['authorization'] || '').split(' ')
    if (credentials.length === 2) apiKey = Buffer.from(credentials[1], 'base64').toString('ascii')
    if (!apiKey) return new Response(null, { status: 401 })
    if (!text && !body?.text && !body?.messages?.length) return new Response(null, { status: 400 })
    if (!body.type) body.type = 'text'

    const notice = await clientConn.query(
      `
      SELECT 
        n.access_token, u.chat_id, n.proxy, 
        coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
      FROM users u
      INNER JOIN notice n ON n.name = u.notice_name
      WHERE u.active = 't' AND u.api_key = $1 AND u.notice_name = $2 AND provider = $3
    `,
      [apiKey, params.botName, params.channel.toUpperCase()],
    )

    if (!notice.rows.length) return new Response(null, { status: 401 })

    const { chat_id: chatId, proxy: proxyConfig, access_token: accessToken, display_name: displayName } = notice.rows[0]

    await queueSend(
      {
        sessionId: null,
        botName: params.botName,
        chatId,
        displayName,
        accessToken,
        proxyConfig,
      },
      body?.messages ? body.messages : [text ? { type: 'text', text } : body],
    )

    return new Response(null, { status: 201 })
  } catch (ex) {
    logger.error(ex)
    return new Response(null, { status: 401 })
  }
})

const cacheToken = {}

app.post('/:channel/:botName', async ({ headers, body, params }) => {
  if (
    !headers['x-line-signature'] ||
    !valid_channels.includes(params.channel.toLowerCase()) ||
    !valid_bots.includes(params.botName.toLowerCase()) ||
    !body?.events.length
  )
    return new Response(null, { status: 404 })
  if (body.events[0].type == 'postback') {
    return new Response(null, { status: 201 })
  }

  const chatId = getChatId(body.events[0])
  try {
    const cacheKey = `${params.botName}_${chatId}`
    if (!cacheToken[cacheKey]) {
      const notice = await clientConn.query(
        `
        SELECT
          n.access_token, n.client_secret, u.api_key, u.admin, u.active,
          n.proxy, coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
        FROM notice n
        LEFT JOIN users u ON n.name = u.notice_name AND u.chat_id = $1
        WHERE n.name = $2 AND provider = $3
      `,
        [chatId, params.botName, params.channel.toUpperCase()],
      )
      if (!notice.rows.length) {
        return new Response(null, { status: 401 })
      }
      cacheToken[cacheKey] = {
        accessToken: notice.rows[0]?.access_token,
        clientSecret: notice.rows[0]?.client_secret,
        apiKey: notice.rows[0]?.api_key,
        isAdmin: notice.rows[0]?.admin,
        isActive: notice.rows[0]?.active,
        proxyConfig: notice.rows[0]?.proxy,
        displayName: notice.rows[0]?.display_name,
      }

      if (!cacheToken[cacheKey].apiKey) {
        await clientConn.query('INSERT INTO users (chat_id, notice_name) VALUES ($1, $2)', [chatId, params.botName])
      }
    }
    const { accessToken, clientSecret, apiKey, isAdmin, isActive } = cacheToken[cacheKey]
    const lineSignature = headers['x-line-signature']

    if (lineSignature !== crypto.createHmac('SHA256', clientSecret).update(JSON.stringify(body)).digest('base64')) {
      return new Response(null, { status: 401 })
    }

    const sessionId = randomUUIDv7()
    await clientConn.query(
      `
      INSERT INTO sessions (chat_id, notice_name, session_id) VALUES ($1, $2, $3)
      ON CONFLICT (chat_id, notice_name) DO NOTHING
      `,
      [chatId, params.botName, sessionId],
    )

    let timestamp = 0,
      messages = []

    const optionQueue = { ...cacheToken[cacheKey], botName: params.botName, chatId, sessionId }
    for await (const event of body.events) {
      if (isAdmin) {
        delete optionQueue.sessionId
        if (isCommandIncluded(event, 'raw')) {
          await queueSend(optionQueue, [{ type: 'text', text: JSON.stringify(event, null, 2), sender: { name: 'admin' } }])
          continue
        }
      }
      if (isCommandIncluded(event, 'id')) {
        delete optionQueue.sessionId
        await queueSend(optionQueue, [{ type: 'template', name: 'get-id', chatId, sender: { name: 'admin' } }])
        continue
      } else if (isCommandIncluded(event, 'im')) {
        delete optionQueue.sessionId
        const profile = await userProfile(accessToken, chatId)
        delete cacheToken[cacheKey]
        if (event.message.text.trim().includes(apiKey)) {
          await clientConn.query("UPDATE users SET active = 't', profile = $3::json WHERE chat_id = $1 AND notice_name = $2", [
            chatId,
            params.botName,
            JSON.stringify(profile),
          ])
          await queueSend(optionQueue, [{ type: 'text', text: `Hi, ${profile.displayName}`, sender: { name: 'admin' } }])
        } else {
          await queueSend(optionQueue, [{ type: 'text', text: `${profile.displayName}, Nope! 😅 `, sender: { name: 'admin' } }])
        }
        continue
      }
      timestamp = event.timestamp

      messages.push(Object.assign(event.message, { replyToken: event.replyToken }))
    }

    if (isActive && messages.length) await queueSend({ ...optionQueue, timestamp }, messages)

    return new Response(null, { status: 201 })
  } catch (error) {
    logger.error(error)
    return new Response(null, { status: 500 })
  }
})

// const chatFlowIntentionId = '73796bfb-d561-4708-8857-cd88d5eff91c'
// const chatFlowAgentId = 'e7c7021f-ff6d-4f91-a96f-d28ba47c2ae6'
app.post(
  '/flowise/LINE-popcorn',
  async ({ body }) => {
    const { chatId, question } = body
    const result = await flowisePrediction(chatId, question, 'th', {
      baseUrl: Bun.env.FLOWISE_API,
      chatflowId: Bun.env.FLOWISE_ID,
      apiKey: Bun.env.FLOWISE_KEY,
    })
    return result
  },
  {
    body: t.Object({
      question: t.String(),
      chatId: t.String(),
    }),
  },
)

app.listen(process.env.PORT || 3000)
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
