import { Elysia } from "elysia"
import { Pgmq } from "pgmq-js"

const app = new Elysia()
  .post('/webhook/:bot_id', async ({ body, params }) => {
    try {
      const queue = await Pgmq.queue('notice-queue')
      await queue.send({ ...body, bot_id: params.bot_id })
      return new Response(null, { status: 200 })
    } catch (error) {
      console.error('Webhook processing error:', error)
      return new Response(null, { status: 500 })
    }
  })
  .listen(process.env.PORT || 3000)

console.log(`Webhook server running on ${app.server?.hostname}:${app.server?.port}`)
