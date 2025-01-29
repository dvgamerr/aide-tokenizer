import pino from 'pino'

export const logger = pino({
  level: Bun.env.LOG_LEVEL || 'info',
})

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
