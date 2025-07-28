import { LINE_API } from '.'
import { logger } from '../helper'

export default async (accessToken, chatId, messages) => {
  const payload = {
    messages:
      typeof messages === 'string' ? [{ text: messages, type: 'text' }] : messages.map((e) => (!e.type ? { ...e, type: 'text' } : e)),
    to: chatId,
  }

  const res = await fetch(`${LINE_API}/message/push`, {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const data = await res.json()
  if (!res.ok) {
    logger.debug({ data, payload: payload, res })
    throw new Error(`Failed ${res.statusText} (${res.status})`)
  }

  return data
}
