import pino from 'pino'

const logger = pino()
const LINE_API = 'https://api.line.me/v2/bot'

export const getChatId = (e) => (e.source.type === 'user' ? e.source.userId : e.source.groupId || e.source.roomId)
export const getUserId = (e) => e.source.userId

export const preloadAnimation = async (accessToken, chatId, loadingSeconds) => {
  if (!chatId.match(/^U/)) return
  const res = await fetch(`${LINE_API}/chat/loading/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ chatId, loadingSeconds }),
  })

  const data = await res.json()
  if (!res.ok) {
    logger.debug({ res, data })
    throw new Error(`Failed ${res.statusText} (${res.status})`)
  }

  return data
}

export const pushMessage = async (accessToken, chatId, messages) => {
  const payload = {
    to: chatId,
    messages: typeof messages === 'string' ? { type: 'text', text: messages } : messages,
  }

  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok) {
    logger.debug({ res, data, payload: payload })
    throw new Error(`Failed ${res.statusText} (${res.status})`)
  }

  return data
}
export const userProfile = async (accessToken, userId) => {
  const res = await fetch(`${LINE_API}/profile/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await res.json()
  if (!res.ok) {
    logger.debug({ res, data })
    throw new Error(`Failed ${res.statusText} (${res.status})`)
  }

  return data
}
