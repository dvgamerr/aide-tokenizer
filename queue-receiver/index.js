import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'

import { logger, PORT, userAgent, version } from '../provider/config'
import db from '../provider/database'
import setupGracefulShutdown from '../provider/graceful'
import queue from '../provider/queue'
import handlerBotPushMessage from './handler/botname-push'
import handlerBotWebhook from './handler/botname-webhook'
import handlerCollector from './handler/collector'
import handlerCrontab from './handler/crontab'
import handlerHealth from './handler/health'
import handlerPrediction from './handler/prediction'
import handlerReminder from './handler/reminder'
import handlerStash from './handler/stash'
import { responseProvider } from './handler/swagger'
import handlerToken from './handler/token'
// import handlerStashCinema from './handler/stash/cinema'
// import handlerStashGold from './handler/stash/gold'
// import handlerCrontabGold from './handler/crontab/gold'
// import handlerCrontabCinema from './handler/crontab/cinema'
import { createValidateAuthLine, errorHandler, responseLogger, swaggerConfig, traceIdMiddleware } from './middleware'

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
    description: 'Returns a simple health check response to verify that the queue-receiver service is running and operational',
    responses: {
      200: { content: { 'text/plain': { schema: { example: '☕', type: 'string' } } }, description: 'Service is healthy' },
    },
    summary: 'Health check',
    tags: ['Health'],
  },
})

app.put('/', handlerBotPushMessage, {
  beforeHandle: validateAuthLine.beforeHandle,
  detail: {
    description:
      'Send a push message through the bot to LINE users. Supports both direct messaging to specific users and broadcasting to all users in the channel.',
    responses: responseProvider,
    security: [{ basicAuth: [] }],
    summary: 'Send push message to Provider',
    tags: ['Notify'],
  },
})

app.post('/:channel/:botName', handlerBotWebhook, {
  detail: {
    description:
      'Receives webhook events from Provider. This endpoint handles various types of events including messages, follows, joins, and other user interactions.',
    parameters: [
      {
        description: 'Channel identifier for the Provider',
        in: 'path',
        name: 'channel',
        required: true,
        schema: { type: 'string' },
      },
      {
        description: 'Bot name identifier for routing webhook events',
        in: 'path',
        name: 'botName',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
    responses: responseProvider,
    summary: 'Provider webhook receiver',
    tags: ['Notify'],
  },
})

app.use(handlerCollector)
app.use(handlerCrontab)
app.use(handlerPrediction)
app.use(handlerReminder)
app.use(handlerStash)
app.use(handlerToken)

// Setup graceful shutdown handlers
setupGracefulShutdown(app, stmt, logger)

// Start the server
app.listen({ hostname: '0.0.0.0', port: PORT })
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
