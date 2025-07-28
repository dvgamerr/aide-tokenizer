import { LINE_API } from '.'
import { logger } from '../helper'

export default async (accessToken, userId) => {
  const res = await fetch(`${LINE_API}/profile/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })

  const data = await res.json()
  if (!res.ok) {
    logger.debug({ data, res })
    throw new Error(`Failed ${res.statusText} (${res.status})`)
  }

  return data
}
