import pino from 'pino'

import { name, version as packageVersion } from '../package.json'

const createRequestHeaders = (headers) => ({
  authorization: headers?.authorization,
  'content-type': 'application/json',
  'User-Agent': userAgent,
})

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

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

export const apiRequest = async (method, path, headers, payload) => {
  const url = `http://localhost:${PORT}/${path.replace(/^\//, '')}`
  const options = {
    headers: createRequestHeaders(headers),
    method,
  }
  if (payload) options.body = JSON.stringify(payload)

  const res = await fetch(url)
  console.log(res)
}

export const pushMessage = async (headers, payload) => {
  return await apiRequest('PUT', '', headers, payload)
}
