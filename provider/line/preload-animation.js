import { logger } from '../logger'
import { LINE_API } from '.'

export default async (accessToken, chatId, loadingSeconds) => {
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
