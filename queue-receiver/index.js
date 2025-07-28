import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'

import db from '../provider/database'
import setupGracefulShutdown from '../provider/graceful'
import { logger, PORT, userAgent, version } from '../provider/helper'
import queue from '../provider/queue'
import handlerBotPushMessage from './handler/botname-push'
import handlerBotWebhook from './handler/botname-webhook'
import handlerHealth from './handler/health'
import { createValidateAuthLine, errorHandler, responseLogger, swaggerConfig, traceIdMiddleware } from './middleware'
// import handlerCollectorGold from './handler/collector/gold-oz'
// import handlerCollectorCinema from './handler/collector/cinema'
// import handlerStashCinema from './handler/stash/cinema'
// import handlerStashGold from './handler/stash/gold'
// import handlerCrontabGold from './handler/crontab/gold'
// import handlerCrontabCinema from './handler/crontab/cinema'

logger.info(`queue-receiver ${version} starting...`)

// Initialize database connection
const stmt = await db.connect()
await queue.init()

// Create middleware with database connection
const validateAuthLine = createValidateAuthLine(stmt)

// Initialize Elysia app with decorations
const app = new Elysia()
  .use(swagger(swaggerConfig))
  .state('traceId', '')
  .onBeforeHandle(traceIdMiddleware.beforeHandle)
  .decorate({ db: stmt, logger: logger, queue: queue, userAgent })
  .onError((context) => errorHandler(context, logger))
  .onAfterResponse((context) => responseLogger(context, logger))

// Define routes with Swagger documentation
app.get('/health', handlerHealth, {
  detail: {
    description: 'Returns a simple health check response',
    summary: 'Health check',
    tags: ['Health'],
  },
})

app.put('/', handlerBotPushMessage, {
  beforeHandle: validateAuthLine.beforeHandle,
  detail: {
    description: 'Send a push message through the bot to LINE users',
    security: [{ basicAuth: [] }],
    summary: 'Send message',
    tags: ['Notify'],
  },
})

app.post('/:channel/:botName', handlerBotWebhook, {
  detail: {
    description: 'Receives webhook events from LINE platform',
    parameters: [
      {
        description: 'Channel identifier',
        in: 'path',
        name: 'channel',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        description: 'Bot name identifier',
        in: 'path',
        name: 'botName',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
    summary: 'Provider webhook',
    tags: ['Notify'],
  },
})
// app.get('/collector/gold', handlerCollectorGold)
// app.get('/collector/cinema', ...handlerCollectorCinema)

// // Define stash routes
// const stash = new Elysia({ prefix: '/stash' })
// stash.post('/cinema', handlerStashCinema)
// stash.post('/gold', handlerStashGold)
// app.use(stash)

// // Define crontab routes
// const crontab = new Elysia({ prefix: '/crontab' })
// crontab.put('/cinema/:flexType', handlerCrontabCinema, {
//   beforeHandle: validateAuthLine.beforeHandle,
//   params: t.Object({
//     flexType: t.Enum({ weekly: 'weekly', day: 'day' }),
//   }),
// })
// crontab.put('/gold', handlerCrontabGold, validateAuthLine)
// crontab.get('/gold', handlerCrontabGold, validateAuthLine)
// app.use(crontab)

// Setup graceful shutdown handlers
setupGracefulShutdown(app, stmt, logger)

// Start the server
app.listen({ hostname: '0.0.0.0', port: PORT })
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
