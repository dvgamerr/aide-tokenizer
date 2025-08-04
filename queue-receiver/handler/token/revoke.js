import { eq } from 'drizzle-orm'

import { apiKeys } from '../../../provider/schema.js'
export async function handlerRevokeToken({ db, headers }) {
  const apiKey = headers['x-api-key']
  await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.apiKey, apiKey))
  return
}
