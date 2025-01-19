import { Elysia } from 'elysia'
import { Pgmq } from 'pgmq-js'
import { getChatId, preloadAnimation } from '../provider/line'
const logger = require('pino')()

const PG_HOST = Bun.env.PG_HOST || 'localhost'
const PG_USER = Bun.env.PG_USER || 'postgres'
const PG_PASS = Bun.env.PG_PASS || ''
const PG_DB = Bun.env.PG_DB || 'postgres'

const qName = Bun.env.PG_QUEUE || 'notice_line'
logger.info(`Connecting to queue '${qName}'...`)
const pgmq = await Pgmq.new({
  host: PG_HOST,
  database: PG_DB,
  password: PG_PASS,
  port: 5432,
  user: PG_USER,
  ssl: false,
})

await pgmq.queue.create(qName)

const receivedMsg = await pgmq.msg.read(qName, 30).catch((err) => {
  logger.error('No messages in the queue', err)
})
console.log(receivedMsg)

const app = new Elysia()

const valid_channels = ['line', 'discord']
const waitAnimation = 60
app.post('/:channel/:bot_name', async ({ body, params }) => {
  if (
    !valid_channels.includes(params.channel.toLowerCase()) ||
    !body?.events.length
  )
    return new Response(null, { status: 404 })

  const msgId = body.events[0].message.id
  let queueId = 0
  try {
    const chatId = getChatId(body.events[0])
    20
    await preloadAnimation(chatId, waitAnimation)
    queueId = await pgmq.msg.send(qName, { ...body, bot_id: params.bot_id })

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
