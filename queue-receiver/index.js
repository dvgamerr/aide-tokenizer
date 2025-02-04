import { Elysia, t } from 'elysia'
import { logger } from '../provider/helper'
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
import { name, version } from '../package.json'

const db = await pgClient()

logger.info(`queue-receiver ${version} starting...`)
const users = await db.query(`SELECT notice_name, api_key FROM line_users WHERE active = 't'`)
const userAllowed = users.rows.reduce((acc, e) => {
  const name = `${e.notice_name}:${e.api_key}`
  acc[name] = true
  return acc
}, {})
logger.info(`${Object.keys(userAllowed).length} user(s) allowed.`)
if (Bun.env.NODE_ENV === 'local') {
  for (const key in userAllowed) {
    console.log(`- ${key} ${btoa(key)}`)
  }
}
const validAuthLine = {
  async beforeHandle({ headers, set }) {
    try {
      const [type, token] = (headers?.authorization || '').split(' ')
      if (!headers?.authorization || !type || !token || !userAllowed[atob(token)]) {
        set.status = 401
        set.headers['WWW-Authenticate'] = `${type || 'Basic'} realm='sign', error="invalid_token"`
        return 'Unauthorized'
      }
    } catch {
      set.status = 400
      set.headers['WWW-Authenticate'] = `Basic realm='sign', error="invalid_token"`
      return 'Unauthorized'
    }
  },
}

const app = new Elysia().decorate({
  db,
  logger: logger,
  pkg: { name, version, userAgent: `aide-${name}/${version}` },
})

app.onError(({ code, error }) => {
  if (code === 'NOT_FOUND') return new Response(code)
  return { status: code, error: error.toString().replace('Error: ', '') }
})

app.onAfterResponse(({ code, path, response, request, error }) => {
  if (['/_healthz'].includes(path)) return
  const ex = error
  const logError = ex.code || code > 299
  const logLvl = logError ? 'warn' : 'trace'
  const errorMessage = logError ? ` |${ex.code || ex.message.toString().replace('Error: ', '')}| ` : ' '
  logger[logLvl](`[${code || response?.status || request.method}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`)
})

app.get('/_healthz', handlerHealth)
app.put('/line', handlerBotPushMessage, validAuthLine)
app.post('/:channel/:botName', handlerBotWebhook)
app.post('/flowise/LINE-popcorn', ...handlerFlowisePopcorn)

app.get('/collector/gold', handlerCollectorGold)
app.get('/collector/cinema', ...handlerCollectorCinema)

app.post('/stash/cinema', handlerStashCinema)
app.post('/stash/gold', handlerStashGold)

const crontab = new Elysia({ prefix: '/crontab' })
crontab.put('/gold', handlerCrontabGold, validAuthLine)
crontab.put('/cinema', handlerCrontabGold, validAuthLine)

app.use(crontab)
// app.put('/crontab/tin-gold', handlerStashGold)

app.listen({ port: process.env.PORT || 3000, hostname: '0.0.0.0' })
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
