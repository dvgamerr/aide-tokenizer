import { Elysia } from 'elysia'
// import { Pgmq } from 'pgmq-js'
import { getChatId, preloadAnimation, pushMessage } from './provider/line' 
const logger = require('pino')()



const app = new Elysia()
  .post('/:channel/:bot_name', async ({ body, params }) => {
    const logs = logger.child({ id: body.events[0].message.id, destination: body.destination, ...params })
    try {
      logs.info('queue')
      const chatId = getChatId(body.events[0])
      // const queue = await Pgmq.queue('notice-queue')
      // await queue.send({ ...body, bot_id: params.bot_id })
      logs.info('preloading...')
      preloadAnimation(chatId)
      for await (const e of body.events) {
        setTimeout(() => {
          logs.info('push message...')
          pushMessage(chatId, `${e.message.text}`)
        }, 5000)
      }

      return new Response(null, { status: 200 })
    } catch (error) {
      console.error('Webhook processing error:', error)
      return new Response(null, { status: 500 })
    } finally {
      logs.info('done')
    }
  })
  .listen(process.env.PORT || 3000)

logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
