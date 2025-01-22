import { Elysia } from 'elysia'
import { getChatId, pushMessage, preloadAnimation } from '../provider/line'
import { pgClient, pgQueue, queueName } from '../provider/db'
import pino from 'pino'
import { v4 as uuidv4 } from 'uuid'
const crypto = require('crypto')

const clientConn = await pgClient()
const clientQueue = await pgQueue()

await clientConn.query(`
  CREATE TABLE IF NOT EXISTS users (
    chat_id VARCHAR(36),
    notice_name VARCHAR(20) NOT NULL,
    api_key UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (chat_id, notice_name),
    FOREIGN KEY (notice_name) REFERENCES notice(name)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    chat_id VARCHAR(36),
    notice_name VARCHAR(20) NOT NULL,
    session_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chat_id, notice_name),
    FOREIGN KEY (notice_name) REFERENCES notice(name)
  );
  
  CREATE TABLE IF NOT EXISTS notice (
    name VARCHAR(20) PRIMARY KEY,
    provider VARCHAR(10) NOT NULL,
    access_token VARCHAR(200) NOT NULL,
    client_secret VARCHAR(50) NOT NULL
  );
`)

const logger = pino()
const app = new Elysia()

const valid_channels = ['line', 'discord']
const valid_bots = ['popcorn', 'aide']
const waitAnimation = 60

app.post('/_healthz', async () => {
  return new Response('☕')
})

const isCommandIncluded = (event, cmd) => {
  if (event.message.type === 'text' && event.message.text.trim().toLowerCase() === `/${cmd}`) return true
  return false
}

app.put('/:channel/:bot_name', async ({ body, params }) => {
  try {
    const notice = await clientConn.query('SELECT COUNT(*) FROM notice WHERE name = $1 AND provider = $2', [
      params.bot_name,
      params.channel.toUpperCase(),
    ])

    console.log({ body, notice })

    return new Response(null, { status: 201 })
  } catch (ex) {
    logger.error(ex)
    return new Response(null, { status: 500 })
  }
})

const cacheToken = {}

app.post('/:channel/:bot_name', async ({ headers, body, params }) => {
  if (
    !headers['x-line-signature'] ||
    !valid_channels.includes(params.channel.toLowerCase()) ||
    !valid_bots.includes(params.bot_name.toLowerCase()) ||
    !body?.events.length
  )
    return new Response(null, { status: 404 })

  let queueId = 0
  const chatId = getChatId(body.events[0])
  const msgId = body.events[0].message.id
  try {
    const cacheKey = `${params.bot_name}_${chatId}`
    let accessToken, clientSecret, apiKey
    if (!cacheToken[cacheKey]) {
      const notice = await clientConn.query(
        `
        SELECT
          access_token, client_secret, api_key
        FROM notice n
        LEFT JOIN users u ON n.name = u.notice_name AND u.chat_id = $1
        WHERE name = $2 AND provider = $3
      `,
        [chatId, params.bot_name, params.channel.toUpperCase()],
      )
      if (!notice.rows.length) throw new Error("Bot doesn't have token")
      accessToken = notice.rows[0]?.access_token
      clientSecret = notice.rows[0]?.client_secret
      apiKey = notice.rows[0]?.api_key

      if (!apiKey) {
        await clientConn.query('INSERT INTO users (chat_id, notice_name) VALUES ($1, $2)', [chatId, params.bot_name])
      }

      cacheToken[cacheKey] = { accessToken, clientSecret }
    }
    accessToken = cacheToken[cacheKey].accessToken
    clientSecret = cacheToken[cacheKey].clientSecret

    await preloadAnimation(accessToken, chatId, waitAnimation)

    const lineSignature = headers['x-line-signature']
    if (lineSignature !== crypto.createHmac('SHA256', clientSecret).update(JSON.stringify(body)).digest('base64')) {
      return new Response(null, { status: 401 })
    }

    // Query session_id by chatId
    let res = await clientConn.query('SELECT session_id FROM sessions WHERE chat_id = $1 AND notice_name = $2', [chatId, params.bot_name])
    let sessionId = res.rows[0]?.session_id
    if (!res.rows.length) {
      // If not exists, generate random session_id and save to database
      sessionId = uuidv4()
      await clientConn.query('INSERT INTO sessions (chat_id, notice_name, session_id) VALUES ($1, $2, $3)', [
        chatId,
        params.bot_name,
        sessionId,
      ])
    }

    for await (const event of body.events) {
      if (isCommandIncluded(event, 'id')) {
        await pushMessage(accessToken, chatId, `ID: ${chatId}`)
        continue
      } else if (isCommandIncluded(event, 'raw')) {
        await pushMessage(accessToken, chatId, '```\n' + JSON.stringify(event) + '\n```')
        continue
      } else if (isCommandIncluded(event, 'im')) {
        continue
      }

      queueId = await clientQueue.msg.send(queueName, {
        timestamp: event.timestamp,
        message: Object.assign(event.message, { replyToken: event.replyToken }),
        bot_name: params.bot_name,
        session_id: sessionId,
      })
    }

    logger.info(`id:${msgId}${queueId ? ` queue:${queueId}` : ', ok'}`)

    return new Response(null, { status: 201 })
  } catch (error) {
    logger.error(error)
    return new Response(null, { status: 500 })
  }
})

app.listen(process.env.PORT || 3000)
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
