import { LINE_API } from '.'
import { logger } from '../helper'

export default async (accessToken, chatId, loadingSeconds) => {
  if (!chatId.match(/^U/)) return
  const res = await fetch(`${LINE_API}/chat/loading/start`, {
    body: JSON.stringify({ chatId, loadingSeconds }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const data = await res.json()
  if (!res.ok) {
    logger.warn({ data, res })
    throw new Error(`Failed ${res.statusText} (${res.status})`)
  }

  return data
}
