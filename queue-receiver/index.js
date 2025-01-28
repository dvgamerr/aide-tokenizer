import { Elysia } from 'elysia'
import { getChatId, getType, userProfile } from '../provider/line'
import { pgClient, queueSend } from '../provider/db'
import { flowisePrediction } from '../provider/proxy/flowise'
import { logger } from '../provider/logger'
import { randomUUIDv7 } from 'bun'
import crypto from 'crypto'
import handlerHealth from './handler/health'
import handlerChannelBotName from './handler/channel-botname'

const clientConn = await pgClient()
const app = new Elysia()

const valid_channels = ['line', 'discord']
const valid_bots = ['popcorn', 'aide']
// const waitAnimation = 60

const isCommandIncluded = (event, cmd) => {
  return event?.message?.type === 'text' && event.message.text.trim().match(new RegExp(`^/${cmd}`, 'ig'))
}

app.onError(({ code, error }) => {
  if (code === 'NOT_FOUND') return new Response(code)
  return { status: code, error: error.toString().replace('Error: ', '') }
})

app.onAfterResponse(({ code, path, response, error }) => {
  if (['/_healthz'].includes(path)) return
  const errorMessage = error && code ? ` |${error.toString().replace('Error: ', '')}| ` : ' '

  logger[error && code ? 'warn' : 'info'](`[${code || response.status}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`)
})

app.get('/_healthz', handlerHealth)
app.put('/:channel/:botName', handlerChannelBotName)

const cacheToken = {}

app.post('/:channel/:botName', async ({ headers, body, params }) => {
  if (
    !headers['x-line-signature'] ||
    !valid_channels.includes(params.channel.toLowerCase()) ||
    !valid_bots.includes(params.botName.toLowerCase())
  )
    return new Response(null, { status: 404 })
  if (!body.events[0]?.type || body.events[0]?.type == 'postback') {
    return new Response(null, { status: 201 })
  }

  const chatId = getChatId(body.events[0])
  const chatType = getType(body.events[0])
  const cacheKey = `${params.botName}_${chatId}`
  if (!cacheToken[cacheKey]) {
    const notice = await clientConn.query(
      `
        SELECT
          n.access_token, n.client_secret, u.api_key, u.admin, u.active, s.session_id,
          n.proxy, coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
        FROM notice n
        LEFT JOIN users u ON n.name = u.notice_name AND u.chat_id = $1
        LEFT JOIN sessions s ON n.name = s.notice_name AND u.chat_id = s.chat_id
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
      sessionId: notice.rows[0]?.session_id,
    }

    if (!cacheToken[cacheKey].apiKey) {
      await clientConn.query('INSERT INTO users (chat_id, notice_name) VALUES ($1, $2)', [chatId, params.botName])
    }
  }
  const { accessToken, clientSecret, apiKey, isAdmin, isActive } = cacheToken[cacheKey]
  let { sessionId } = cacheToken[cacheKey]
  const lineSignature = headers['x-line-signature']

  if (lineSignature !== crypto.createHmac('SHA256', clientSecret).update(JSON.stringify(body)).digest('base64')) {
    return new Response(null, { status: 401 })
  }

  if (!sessionId) {
    sessionId = randomUUIDv7()
    await clientConn.query(
      `
        INSERT INTO sessions (chat_id, notice_name, session_id) VALUES ($1, $2, $3)
        ON CONFLICT (chat_id, notice_name) DO NOTHING
        `,
      [chatId, params.botName, sessionId],
    )
  }

  let timestamp = 0,
    messages = []

  const optionQueue = { ...cacheToken[cacheKey], botName: params.botName, chatId, sessionId, chatType }
  for await (const event of body.events) {
    if (isAdmin) {
      if (isCommandIncluded(event, 'raw')) {
        delete optionQueue.sessionId
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
})

// const chatFlowIntentionId = '73796bfb-d561-4708-8857-cd88d5eff91c'
// const chatFlowAgentId = 'e7c7021f-ff6d-4f91-a96f-d28ba47c2ae6'

const WAIT_QUOTA = 800

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const ANSWER = {
  SERVER_DOWN: {
    EN: "I'm sorry, I can't help you right now.",
    TH: 'ขอโทษค่ะ ไม่สามารถให้บริการในขณะนี้',
  },
}

const AIDE_API_KEY = Bun.env.AIDE_API_KEY
app.post(
  '/flowise/LINE-popcorn',
  async ({ headers, body }) => {
    let quotaRetry = 3
    const { chatId, question, chatType } = body
    const users = await clientConn.query(
      `
        SELECT 
        u.language, u.notice_name, u.chat_id
        FROM users u
        INNER JOIN sessions s ON s.chat_id = u.chat_id AND s.notice_name = u.notice_name
        WHERE api_key = $1
      `,
      [headers['x-api-key']],
    )
    if (!users.rows.length) return new Response(null, { status: 401 })
    const language = users.rows[0].language === 'NA' ? 'EN' : users.rows[0].language
    const { notice_name, chat_id } = users.rows[0]

    let result = { answer: ANSWER.SERVER_DOWN[language], language }
    while (quotaRetry > 0) {
      const completion = await flowisePrediction(chatId, JSON.stringify({ type: chatType, question }))
      if (!completion.error) {
        try {
          result = JSON.parse(completion.text)
        } catch {
          result = { answer: completion.text }
        }
        break
      }
      quotaRetry--
      await sleep(WAIT_QUOTA)
    }
    if (users.rows[0].language === 'NA') {
      await clientConn.query(`UPDATE users SET language = $2 WHERE api_key = $1`, [headers['x-api-key'], result.language.toUpperCase()])
    }

    if (result.intent === 'END') {
      delete cacheToken[`${notice_name}_${chat_id}`]

      await clientConn.query(
        `
          UPDATE sessions s SET session_id = uuid_generate_v4()
          FROM users u WHERE s.chat_id = u.chat_id 
          AND s.notice_name = u.notice_name AND u.api_key = $1
        `,
        [headers['x-api-key']],
      )
    }

    return result
  },
  {
    beforeHandle({ headers, set }) {
      if (!headers['x-api-key'] || headers['x-secret-key'] != AIDE_API_KEY) {
        set.status = 400
        set.headers['WWW-Authenticate'] = `Bearer realm='sign', error="invalid_request"`

        return 'Unauthorized'
      }
    },
  },
)

app.listen({ port: process.env.PORT || 3000, hostname: '0.0.0.0' })
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
