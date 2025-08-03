import pino from 'pino'

import { name, version as packageVersion } from '../package.json'

// Configuration constants
export const PORT = Bun.env.PORT || 3000
export const version = packageVersion
export const userAgent = `aide-${name}/${version}`

// Logger instance
export const logger = pino({
  level: Bun.env.LOG_LEVEL || 'info',
})

export const parseDatabaseUrl = (url) => {
  const uri = new URL(url)
  return {
    database: uri.pathname.split('/')[1],
    host: uri.hostname,
    password: uri.password,
    port: uri.port,
    ssl: false,
    user: uri.username,
  }
}

export const getAuthAPIKey = (headers) => {
  const basic = headers?.authorization
  try {
    const [, token] = basic.split(' ')
    const [botName, apiKey] = atob(token).split(':')
    return { apiKey, botName }
  } catch {
    return {}
  }
}
