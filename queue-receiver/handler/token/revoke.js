import { eq } from 'drizzle-orm'

import { apiKeys } from '../../../provider/schema.js'
export async function handlerRevokeToken({ body, db, logger, set, store }) {
  const traceId = store.traceId

  try {
    logger.info(`[${traceId}] Revoking API token`, { body })

    const { apiKey: tokenToRevoke } = body

    if (!tokenToRevoke) {
      set.status = 400
      return {
        message: 'API key is required',
        success: false,
      }
    }

    // Update the API key to inactive
    const result = await db
      .update(apiKeys)
      .set({
        isActive: false,
      })
      .where(eq(apiKeys.apiKey, tokenToRevoke))
      .returning({
        apiKey: apiKeys.apiKey,
        id: apiKeys.id,
        isActive: apiKeys.isActive,
        userId: apiKeys.userId,
      })

    if (result.length === 0) {
      logger.warn(`[${traceId}] API token not found for revocation`, { apiKey: tokenToRevoke })
      set.status = 404
      return {
        message: 'API token not found',
        success: false,
      }
    }

    logger.info(`[${traceId}] API token revoked successfully`, {
      tokenId: result[0].id,
      userId: result[0].userId,
    })

    set.status = 200
    return {
      data: {
        apiKey: result[0].apiKey,
        id: result[0].id,
        isActive: result[0].isActive,
        revokedAt: new Date().toISOString(),
      },
      message: 'API token revoked successfully',
      success: true,
    }
  } catch (error) {
    logger.error(`[${traceId}] Failed to revoke API token`, {
      error: error.message,
      stack: error.stack,
    })

    set.status = 500
    return {
      error: error.message,
      message: 'Failed to revoke API token',
      success: false,
    }
  }
}
