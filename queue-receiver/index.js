import { Elysia } from 'elysia'
import { getChatId, preloadAnimation, userProfile } from '../provider/line'
import { pgClient, pgQueue, queueName } from '../provider/db'
import { logger } from '../provider/logger'
import { v4 as uuidv4 } from 'uuid'
const crypto = require('crypto')

const clientConn = await pgClient()
const clientQueue = await pgQueue()

await clientConn.query(`
  CREATE TABLE IF NOT EXISTS "public"."users" (
    "chat_id" varchar(36) NOT NULL,
    "notice_name" varchar(20) NOT NULL,
    "api_key" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "active" bool NOT NULL DEFAULT false,
    "admin" bool NOT NULL DEFAULT false,
    CONSTRAINT "users_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."notice"("name"),
    PRIMARY KEY ("chat_id","notice_name")
  );

  CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "chat_id" varchar(36) NOT NULL,
    "notice_name" varchar(20) NOT NULL,
    "session_id" uuid DEFAULT gen_random_uuid(),
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "sessions_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."notice"("name"),
    PRIMARY KEY ("chat_id","notice_name")
  );
    
  CREATE TABLE IF NOT EXISTS "public"."users" (
    "chat_id" varchar(36) NOT NULL,
    "notice_name" varchar(20) NOT NULL,
    "api_key" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "active" bool NOT NULL DEFAULT false,
    "admin" bool NOT NULL DEFAULT false,
    "profile" json DEFAULT '{}'::json,
    CONSTRAINT "users_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."notice"("name"),
    PRIMARY KEY ("chat_id","notice_name")
  );
`)

const app = new Elysia()

const valid_channels = ['line', 'discord']
const valid_bots = ['popcorn', 'aide']
const waitAnimation = 60

app.post('/_healthz', async () => {
  return new Response('☕')
})

const isCommandIncluded = (event, cmd) => {
  if (event?.message?.type === 'text' && event.message.text.trim().match(new RegExp(`^/${cmd}`, 'ig'))) return true
  return false
}

const queueSend = async (sessionId, chatId, botName, messages = [], timestamp) => {
  const queueId = await clientQueue.msg.send(queueName, { chatId, messages, botName, timestamp: timestamp || +new Date(), sessionId })
  logger.info(`[queue:${queueId}] ${botName}:${chatId}`)
  return queueId
}

app.put('/:channel/:botName', async ({ headers, body, params, query }) => {
  try {
    let apiKey = query.apiKey
    let text = query?.text

    const credentials = (headers['authorization'] || '').split(' ')
    if (credentials && credentials.length == 2) apiKey = Buffer.from(credentials[1], 'base64').toString('ascii')
    if (!apiKey) return new Response(null, { status: 401 })
    if (!text && !body?.text && !body?.messages && !body?.messages?.length) return new Response(null, { status: 400 })
    if (!body.type) body.type = 'text'
    const notice = await clientConn.query(
      `
      SELECT u.chat_id
      FROM users u
      INNER JOIN notice n ON n.name = u.notice_name
      WHERE u.active = 't' AND u.api_key = $1 AND u.notice_name = $2 AND provider = $3
    `,
      [apiKey, params.botName, params.channel.toUpperCase()],
    )

    if (!notice.rows.length) return new Response(null, { status: 401 })

    const chatId = notice.rows[0]?.chat_id

    await queueSend(null, chatId, params.botName, body?.messages ? body.messages : [text ? { type: 'text', text } : body])

    return new Response(null, { status: 201 })
  } catch (ex) {
    logger.error(ex)
    return new Response(null, { status: 500 })
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
          access_token, client_secret, api_key, admin
        FROM notice n
        LEFT JOIN users u ON n.name = u.notice_name AND u.chat_id = $1
        WHERE name = $2 AND provider = $3
      `,
        [chatId, params.botName, params.channel.toUpperCase()],
      )
      if (!notice.rows.length) throw new Error("Bot doesn't have token")
      cacheToken[cacheKey] = {
        accessToken: notice.rows[0]?.access_token,
        clientSecret: notice.rows[0]?.client_secret,
        apiKey: notice.rows[0]?.api_key,
        isAdmin: notice.rows[0]?.admin,
      }

      if (!cacheToken[cacheKey].apiKey) {
        await clientConn.query('INSERT INTO users (chat_id, notice_name) VALUES ($1, $2)', [chatId, params.botName])
      }
    }
    const { accessToken, clientSecret, apiKey, isAdmin } = cacheToken[cacheKey]

    await preloadAnimation(accessToken, chatId, waitAnimation)

    const lineSignature = headers['x-line-signature']
    if (lineSignature !== crypto.createHmac('SHA256', clientSecret).update(JSON.stringify(body)).digest('base64')) {
      return new Response(null, { status: 401 })
    }

    // Query session_id by chatId
    let res = await clientConn.query('SELECT session_id FROM sessions WHERE chat_id = $1 AND notice_name = $2', [chatId, params.botName])
    let sessionId = res.rows[0]?.session_id
    if (!res.rows.length) {
      // If not exists, generate random session_id and save to database
      sessionId = uuidv4()
      await clientConn.query('INSERT INTO sessions (chat_id, notice_name, session_id) VALUES ($1, $2, $3)', [
        chatId,
        params.botName,
        sessionId,
      ])
    }

    let timestamp = 0,
      messages = []

    for await (const event of body.events) {
      if (isAdmin) {
        if (isCommandIncluded(event, 'raw')) {
          await queueSend(sessionId, chatId, params.botName, [
            { type: 'text', text: JSON.stringify(event, null, 2), sender: { name: 'admin' } },
          ])
          continue
        }
      }
      if (isCommandIncluded(event, 'id')) {
        await queueSend(sessionId, chatId, params.botName, [{ type: 'template', name: 'get-id', chatId, sender: { name: 'admin' } }])
        continue
      } else if (isCommandIncluded(event, 'im')) {
        const profile = await userProfile(accessToken, chatId)
        delete cacheToken[cacheKey]
        if (event.message.text.trim().includes(apiKey)) {
          await clientConn.query("UPDATE users SET active = 't', profile = $3::json WHERE chat_id = $1 AND notice_name = $2", [
            chatId,
            params.botName,
            JSON.stringify(profile),
          ])
          await queueSend(sessionId, chatId, params.botName, [
            { type: 'text', text: `Hi, ${profile.displayName}`, sender: { name: 'admin' } },
          ])
        } else {
          await queueSend(sessionId, chatId, params.botName, [
            { type: 'text', text: `${profile.displayName}, Nope! 😅 `, sender: { name: 'admin' } },
          ])
        }
        continue
      }
      timestamp = event.timestamp

      messages.push(Object.assign(event.message, { replyToken: event.replyToken }))
    }

    if (messages.length) await queueSend(sessionId, chatId, params.botName, messages, timestamp)

    return new Response(null, { status: 201 })
  } catch (error) {
    logger.error(error)
    return new Response(null, { status: 500 })
  }
})

app.listen(process.env.PORT || 3000)
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
