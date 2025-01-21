import { Elysia } from 'elysia'
import { getChatId } from '../provider/line'
import { pgClient, pgQueue, queueName } from '../provider/db'
import pino from 'pino'
import { v4 as uuidv4 } from 'uuid'

const clientConn = await pgClient()
const clientQueue = await pgQueue()

await clientConn.query(`
  DROP TABLE IF EXISTS bot_sessions;
  CREATE TABLE IF NOT EXISTS bot_sessions (
    chat_id VARCHAR(255) PRIMARY KEY,
    session_id UUID NOT NULL
  )
`)

const logger = pino()
const app = new Elysia()

const valid_channels = ['line', 'discord']
const valid_bots = ['popcorn', 'aide']
// const waitAnimation = 60

app.post('/_healthz', async () => {
  return new Response('☕')
})

const shortcut = (body, cmd) => {
  for (const e of body.events) {
    if (e.message.type !== 'text') continue
    if (!e.message.text.trim().toLowerCase().includes(cmd)) continue
    console.log(e)
  }
  return true
}

app.post('/:channel/:bot_name', async ({ body, params }) => {
  if (
    !valid_channels.includes(params.channel.toLowerCase()) ||
    !valid_bots.includes(params.bot_name.toLowerCase()) ||
    !body?.events.length
  )
    return new Response(null, { status: 404 })

  const msgId = body.events[0].message.id
  let queueId = 0
  try {
    const chatId = getChatId(body.events[0])

    if (shortcut(body, '/id')) {
      return new Response(null, { status: 200 })
    }

    // Query session_id by chatId
    let res = await clientConn.query(
      'SELECT session_id FROM sessions WHERE chat_id = $1',
      [chatId],
    )
    let sessionId
    if (res.rows.length === 0) {
      // If not exists, generate random session_id and save to database
      sessionId = uuidv4()
      await clientConn.query(
        'INSERT INTO sessions (chat_id, session_id) VALUES ($1, $2)',
        [chatId, sessionId],
      )
    } else {
      sessionId = res.rows[0].session_id
    }

    // await preloadAnimation(chatId, waitAnimation)
    queueId = await clientQueue.msg.send(queueName, {
      ...body,
      bot_id: params.bot_id,
      session_id: sessionId,
    })

    return new Response(null, { status: 201 })
  } catch (error) {
    logger.error(`[${msgId}] ${error}`)
    return new Response(null, { status: 500 })
  } finally {
    logger.info(`id:${msgId} queue:${queueId}`)
  }
})

app.listen(process.env.PORT || 3000)
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
