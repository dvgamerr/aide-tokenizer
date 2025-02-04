import pino from 'pino'

export const logger = pino({
  level: Bun.env.LOG_LEVEL || 'info',
})

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const getAuthAPIKey = (headers) => {
  const [, token] = headers.authorization.split(' ')
  const [botName, apiKey] = atob(token).split(':')
  return { botName, apiKey }
}

export const pushMessageSelf = async (headers, userAgent, payload) => {
  return await fetch(`http://localhost:3000/line`, {
    method: 'PUT',
    headers: {
      authorization: headers.authorization,
      'content-type': 'application/json',
      'User-Agent': userAgent,
    },
    body: JSON.stringify(payload),
  })
}
