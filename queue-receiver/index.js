import { swagger } from '@elysiajs/swagger'
import { sql } from 'drizzle-orm'
import { Elysia } from 'elysia'

import db from '../provider/database'
import setupGracefulShutdown from '../provider/graceful'
import { logger, PORT, userAgent, version } from '../provider/helper'
import queue from '../provider/queue'
import handlerBotPushMessage from './handler/botname-push'
import handlerBotWebhook from './handler/botname-webhook'
import handlerHealth from './handler/health'
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

// Middleware for validating authorization
const validateAuthLine = {
  async beforeHandle({ headers, set }) {
    try {
      if (!headers?.authorization) throw 'Unauthorized'
      const [authType, authToken] = headers?.authorization?.split(' ') || []
      const [allowed] = await stmt.execute(
        sql`SELECT COUNT(*) auth FROM line_users WHERE active = 't' AND (notice_name || ':' || api_key) = ${atob(authToken)}`,
      )

      if (!headers?.authorization || !authType || !authToken || allowed.auth === '0') {
        set.status = 401
        set.headers['WWW-Authenticate'] = `${authType || 'Basic'} realm='sign', error="invalid_token"`
        return 'Unauthorized'
      }
    } catch (ex) {
      set.status = 400
      set.headers['WWW-Authenticate'] = `Basic realm='sign', error="${ex.message || ex}"`
      return 'Unauthorized'
    }
  },
}

// Initialize Elysia app with decorations
const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Queue Receiver API',
          version: '1.0.0',
        },
      },
      path: '/docs',
    }),
  )
  .decorate({
    db: stmt,
    logger: logger,
    queue: queue,
    userAgent,
  })

// Error handling
app.onError(({ code, error, path }) => {
  if (code === 'NOT_FOUND') return new Response(code)

  // Log error properly with logger instead of console.error
  logger.error({
    code,
    error: error.message,
    path,
    stack: error.stack,
  })

  return {
    error: error.toString().replace('Error: ', ''),
    status: code,
    timestamp: new Date().toISOString(),
  }
})

// Response logging
app.onAfterResponse(({ code, path, request, response, status }) => {
  if (['/health'].includes(path)) return
  const ex = status
  const logError = ex?.code || code > 299
  const logLevel = logError ? 'warn' : 'trace'
  const errorMessage = logError ? ` |${ex?.code || ex?.message?.toString().replace('Error: ', '')}| ` : ' '
  logger[logLevel](`[${code || response?.status || request.method}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`)
})

// // Define routes
app.get('/health', handlerHealth)
app.put('/', handlerBotPushMessage, validateAuthLine)
app.post('/:channel/:botName', handlerBotWebhook)
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
