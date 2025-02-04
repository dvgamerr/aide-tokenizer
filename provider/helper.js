import pino from 'pino'
import { name, version as packageVersion } from '../package.json'

export const PORT = Bun.env.PORT || 3000

export const version = packageVersion

export const userAgent = `aide-${name}/${version}`

export const logger = pino({
  level: Bun.env.LOG_LEVEL || 'info',
})

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const getAuthAPIKey = (headers) => {
  const [, token] = headers.authorization.split(' ')
  const [botName, apiKey] = atob(token).split(':')
  return { botName, apiKey }
}

export const pushMessageSelf = async (headers, payload) => {
  return await fetch(`http://localhost:${PORT}/`, {
    method: 'PUT',
    headers: {
      authorization: headers.authorization,
      'content-type': 'application/json',
      'User-Agent': userAgent,
    },
    body: JSON.stringify(payload),
  })
}
