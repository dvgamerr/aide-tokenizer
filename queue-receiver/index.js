// Import necessary modules and handlers
import { Elysia } from 'elysia'
import { logger, userAgent, version, PORT } from '../provider/helper'
import handlerHealth from './handler/health'
import handlerBotPushMessage from './handler/botname-push'
import handlerBotWebhook from './handler/botname-webhook'
import handlerFlowisePopcorn from './handler/flowise/popcorn'
import handlerCollectorGold from './handler/collector/gold-oz'
import handlerCollectorCinema from './handler/collector/cinema'
import handlerStashCinema from './handler/stash/cinema'
import handlerStashGold from './handler/stash/gold'
import handlerCrontabGold from './handler/crontab/gold'
import { pgClient } from '../provider/db'

// Initialize database connection
const database = await pgClient()

// Log application start
logger.info(`queue-receiver ${version} starting...`)

// Fetch and process allowed users
const users = await database.query(`SELECT notice_name, api_key FROM line_users WHERE active = 't'`)
const allowedUsers = users.rows.reduce((accumulator, user) => {
  const userKey = `${user.notice_name}:${user.api_key}`
  accumulator[userKey] = true
  return accumulator
}, {})
logger.info(`${Object.keys(allowedUsers).length} user(s) allowed.`)

// Log allowed users in local environment
if (Bun.env.NODE_ENV === 'local') {
  for (const userKey in allowedUsers) {
    console.log(`- ${userKey} ${btoa(userKey)}`)
  }
}

// Middleware for validating authorization
const validateAuthLine = {
  async beforeHandle({ headers, set }) {
    try {
      const [authType, authToken] = (headers?.authorization || '').split(' ')
      if (!headers?.authorization || !authType || !authToken || !allowedUsers[atob(authToken)]) {
        set.status = 401
        set.headers['WWW-Authenticate'] = `${authType || 'Basic'} realm='sign', error="invalid_token"`
        return 'Unauthorized'
      }
    } catch {
      set.status = 400
      set.headers['WWW-Authenticate'] = `Basic realm='sign', error="invalid_token"`
      return 'Unauthorized'
    }
  },
}

// Initialize Elysia app with decorations
const app = new Elysia().decorate({
  db: database,
  logger: logger,
  userAgent,
})

// Error handling
app.onError(({ code, error }) => {
  if (code === 'NOT_FOUND') return new Response(code)
  return { status: code, error: error.toString().replace('Error: ', '') }
})

// Response logging
app.onAfterResponse(({ code, path, response, request, error }) => {
  if (['/_healthz'].includes(path)) return
  const ex = error
  const logError = ex.code || code > 299
  const logLevel = logError ? 'warn' : 'trace'
  const errorMessage = logError ? ` |${ex.code || ex.message.toString().replace('Error: ', '')}| ` : ' '
  logger[logLevel](`[${code || response?.status || request.method}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`)
})

// Define routes
app.put('/', handlerBotPushMessage, validateAuthLine)
app.post('/:channel/:botName', handlerBotWebhook)
app.post('/flowise/LINE-popcorn', ...handlerFlowisePopcorn)
app.get('/collector/gold', handlerCollectorGold)
app.get('/collector/cinema', ...handlerCollectorCinema)
app.post('/stash/cinema', handlerStashCinema)
app.post('/stash/gold', handlerStashGold)
app.get('/_healthz', handlerHealth)

// Define crontab routes
const crontab = new Elysia({ prefix: '/crontab' })
crontab.put('/gold', handlerCrontabGold, validateAuthLine)
crontab.put('/cinema', handlerCrontabGold, validateAuthLine)
app.use(crontab)

// Start the server
app.listen({ port: PORT, hostname: '0.0.0.0' })
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
