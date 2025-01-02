import { Elysia } from 'elysia'
import { Pgmq } from 'pgmq-js'
import { getChatId, preloadAnimation, pushMessage } from './provider/line' 
const logger = require('pino')()

logger.info('Connecting to Postgres...')
const qName = 'notice_line'
const pgmq = await Pgmq.new({
  host: 'localhost',
  database: 'postgres',
  password: 'pgmq',
  port: 5432,
  user: 'postgres',
  ssl: false,
})

await pgmq.queue.create(qName)

const app = new Elysia()
  .post('/:channel/:bot_name', async ({ body, params }) => {
    if (!body?.events.length) return new Response(null, { status: 404 })

    const msgId = body.events[0].message.id
    try {
      logger.info(`[${msgId}] preloading...`)
      const chatId = getChatId(body.events[0])
      preloadAnimation(chatId)

      const queueId = await pgmq.msg.send(qName, { ...body, bot_id: params.bot_id }).catch((err) => {
        logger.error(`Failed to send message`, err)
      })
      logger.info(`[${msgId}] queue: ${queueId}`)

      await Promise.all(body.events.map(e => 
        new Promise(resolve => setTimeout(() => {
          logger.info(`[${msgId}] push message...`)
          pushMessage(chatId, `${e.message.text}`)
          resolve()
        }, 5000))
      ))

      return new Response(null, { status: 200 })
    } catch (error) {
      logger.error(`[${msgId}] ${error}`)
      return new Response(null, { status: 500 })
    } finally {
      logger.info(`[${msgId}] done`)
    }
  })
  .listen(process.env.PORT || 3000)

logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)

// Graceful shutdown logic
const gracefulShutdown = async () => {
  logger.info('Shutting down...')
  try {
    await app.stop()
    logger.info('stopped.')
  } catch (err) {
    logger.error('shutdown:', err)
  }
}

const signals = ["SIGINT", "SIGTERM"]
if (process.platform === "win32") signals.push("SIGBREAK")

// Capture termination signals
signals.forEach((signal) => {
  process.on(signal, gracefulShutdown)
})
