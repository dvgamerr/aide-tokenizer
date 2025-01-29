import { logger } from '../logger'
import { LINE_API } from '.'

export default async (accessToken, chatId, messages) => {
  const payload = {
    to: chatId,
    messages:
      typeof messages === 'string' ? [{ type: 'text', text: messages }] : messages.map((e) => (!e.type ? { ...e, type: 'text' } : e)),
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
