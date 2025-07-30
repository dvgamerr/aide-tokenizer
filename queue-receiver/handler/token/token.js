import { eq } from 'drizzle-orm'

import { apiKeys } from '../../../provider/schema.js'

export async function handlerCreateToken({ body, db, logger, set, store }) {
  const traceId = store.traceId

  try {
    logger.info(`[${traceId}] Creating new API token`, { body })

    const { description, expiresAt, userId } = body

    // Generate secure API key
    const newApiKey = generateApiKey()

    // Insert new API key into database
    const result = await db
      .insert(apiKeys)
      .values({
        apiKey: newApiKey,
        description: description || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: userId || null,
      })
      .returning({
        apiKey: apiKeys.apiKey,
        createdAt: apiKeys.createdAt,
        description: apiKeys.description,
        expiresAt: apiKeys.expiresAt,
        id: apiKeys.id,
        isActive: apiKeys.isActive,
        userId: apiKeys.userId,
      })

    logger.info(`[${traceId}] API token created successfully`, {
      tokenId: result[0].id,
      userId: result[0].userId,
    })

    set.status = 201
    return {
      data: result[0],
      message: 'API token created successfully',
      success: true,
    }
  } catch (error) {
    logger.error(`[${traceId}] Failed to create API token`, {
      error: error.message,
      stack: error.stack,
    })

    set.status = 500
    return {
      error: error.message,
      message: 'Failed to create API token',
      success: false,
    }
  }
}

export async function validateApiKey(apiKey, db) {
  if (!apiKey) return null

  try {
    const result = await db.select().from(apiKeys).where(eq(apiKeys.apiKey, apiKey)).limit(1)

    if (result.length === 0) return null

    const keyRecord = result[0]

    // Check if key is active
    if (!keyRecord.isActive) return null

    // Check if key has expired
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      // Automatically revoke expired keys
      await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.apiKey, apiKey))

      return null
    }

    return keyRecord
  } catch (error) {
    console.error('Error validating API key:', error)
    return null
  }
}

/**
 * Generate a secure API key
 * @returns {string} Generated API key
 */
function generateApiKey() {
  return `ak_${crypto.randomUUID().replace(/-/g, '')}`
}
