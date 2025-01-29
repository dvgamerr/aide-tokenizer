import { logger } from '../helper'
import { LINE_API } from '.'

export default async (accessToken, userId) => {
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
