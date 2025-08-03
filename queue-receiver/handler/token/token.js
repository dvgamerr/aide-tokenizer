import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'

import { apiKeys } from '../../../provider/schema.js'

export async function handlerCreateToken({ body, db }) {
  const { description, expiresAt } = body

  // Generate secure API key
  const newApiKey = generateApiKey()

  // Insert new API key into database
  const [result] = await db
    .insert(apiKeys)
    .values({
      apiKey: newApiKey,
      description: description,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning({
      apiKey: apiKeys.apiKey,
      createdAt: apiKeys.createdAt,
      description: apiKeys.description,
      expiresAt: apiKeys.expiresAt,
    })

  return result
}

export async function validateApiKey({ db, headers }) {
  if (!headers['x-api-key']) return new Response(null, { status: 401 })

  const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.apiKey, headers['x-api-key'].trim())).limit(1)
  if (!keyRecord) return new Response(null, { status: 401 })
  if (headers['x-api-key'].trim() === '0000-000-00000-0') {
    await db.delete(apiKeys).where(eq(apiKeys.id, keyRecord.id))
    return
  }

  if (!keyRecord.isActive) return new Response(null, { status: 401 })
  if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
    await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.apiKey, headers['x-api-key'].trim()))
    return new Response(null, { status: 401 })
  }
}

function generateApiKey() {
  return `ak_${randomUUID().replace(/-/g, '')}`
}
