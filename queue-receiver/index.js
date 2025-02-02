import { Elysia } from 'elysia'
import { logger } from '../provider/helper'
import handlerHealth from './handler/health'
import handlerBotPushMessage from './handler/botname-push'
import handlerBotWebhook from './handler/botname-webhook'
import handlerFlowisePopcorn from './handler/flowise/popcorn'
import handlerCollectorGold from './handler/collector/gold-oz'

import { name, version } from '../package.json'

const app = new Elysia().decorate({
  logger: logger,
  pkg: { name, version, userAgent: `aide-${name}/${version}` },
})

app.onError(({ code, error }) => {
  if (code === 'NOT_FOUND') return new Response(code)
  return { status: code, error: error.toString().replace('Error: ', '') }
})

app.onAfterResponse(({ code, path, response, error }) => {
  if (['/_healthz'].includes(path)) return
  const logError = error && code
  const logLvl = logError ? 'warn' : 'trace'
  const errorMessage = logError ? ` |${error.toString().replace('Error: ', '')}| ` : ' '
  logger[logLvl](`[${code || response.status}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`)
})

app.get('/_healthz', handlerHealth)
app.put('/:channel/:botName', handlerBotPushMessage)
app.post('/:channel/:botName', handlerBotWebhook)
app.post('/flowise/LINE-popcorn', ...handlerFlowisePopcorn)
app.put('/collector/gold', handlerCollectorGold)
app.get('/collector/gold', handlerCollectorGold)

app.listen({ port: process.env.PORT || 3000, hostname: '0.0.0.0' })
logger.info(`running on ${app.server?.hostname}:${app.server?.port}`)
