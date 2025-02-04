import pino from 'pino'

export const logger = pino({
  level: Bun.env.LOG_LEVEL || 'info',
})

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const getAuthAPIKey = (headers) => {
  const [, token] = headers.authorization.split(' ')
  const [name, apiKey] = atob(token).split(':')
  return { name, apiKey }
}
