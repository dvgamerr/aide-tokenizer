import { Elysia } from 'elysia'
import { getChatId, pushMessage } from '../provider/line'
import { pgClient, pgQueue, queueName } from '../provider/db'
import pino from 'pino'
import { v4 as uuidv4 } from 'uuid'

const clientConn = await pgClient()
const clientQueue = await pgQueue()

await clientConn.query(`
  CREATE TABLE IF NOT EXISTS sessions (
    chat_id VARCHAR(36),
    notice_name VARCHAR(20) NOT NULL,
    session_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chat_id, notice_name)
  );
  
  CREATE TABLE IF NOT EXISTS notice (
    name VARCHAR(20) PRIMARY KEY,
    provider VARCHAR(10) NOT NULL,
    token VARCHAR(255) NOT NULL
  );
`)

const logger = pino()
const app = new Elysia()

const valid_channels = ['line', 'discord']
const valid_bots = ['popcorn', 'aide']
// const waitAnimation = 60

app.post('/_healthz', async () => {
  return new Response('☕')
})

const isCommandIncluded = (body, cmd) => {
  for (const e of body.events) {
    if (e.message.type === 'text' && e.message.text.trim().toLowerCase() === `/${cmd}`) return true
    return false
  }
}

app.post('/:channel/:bot_name', async ({ body, params }) => {
  if (!valid_channels.includes(params.channel.toLowerCase()) || !valid_bots.includes(params.bot_name.toLowerCase()) || !body?.events.length) return new Response(null, { status: 404 })

  const msgId = body.events[0].message.id
  let queueId = 0
  try {
    const chatId = getChatId(body.events[0])
    const notice = await clientConn.query('SELECT token FROM notice WHERE name = $1 AND provider = $2', [params.bot_name, params.channel.toUpperCase()])
    const accessToken = notice.rows[0]?.token
    if (!accessToken) throw new Error("Bot doesn't have token")

    // Query session_id by chatId
    let res = await clientConn.query('SELECT session_id FROM sessions WHERE chat_id = $1 AND notice_name = $2', [chatId, params.bot_name])
    let sessionId = res.rows[0]?.session_id
    if (!res.rows.length) {
      // If not exists, generate random session_id and save to database
      sessionId = uuidv4()
      await clientConn.query('INSERT INTO sessions (chat_id, notice_name, session_id) VALUES ($1, $2, $3)', [chatId, params.bot_name, sessionId])
    }

    // await preloadAnimation(chatId, waitAnimation)
    for await (const event of body.events) {
      if (isCommandIncluded(body, 'id')) {
        await pushMessage(accessToken, chatId, `ID: ${chatId}`)
        continue
      }

      if (isCommandIncluded(body, 'raw')) {
        await pushMessage(accessToken, chatId, '```\n' + JSON.stringify(event) + '\n```')
        continue
      }

      queueId = await clientQueue.msg.send(queueName, {
        timestamp: event.timestamp,
        message: Object.assign(event.message, { replyToken: event.replyToken }),
        bot_name: params.bot_name,
        session_id: sessionId,
      })
    }

    logger.info(`id:${msgId} queue:${queueId}`)

    return new Response(null, { status: 201 })
  } catch (error) {
    logger.error(`[${msgId}] ${error}`)
    return new Response(null, { status: 500 })
  }
})

app.listen(process.env.PORT || 3000)
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
