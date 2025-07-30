import { validateApiKey } from '../handler/token/token.js'

export function createValidateApiKey(db) {
  return {
    async beforeHandle({ headers, set, store }) {
      const traceId = store.traceId
      const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '')

      if (!apiKey) {
        set.status = 401
        return {
          error: 'API key is required',
          message: 'Please provide a valid API key in X-API-Key header or Authorization header',
          success: false,
        }
      }

      try {
        const validKey = await validateApiKey(apiKey, db)

        if (!validKey) {
          set.status = 401
          return {
            error: 'Invalid or expired API key',
            message: 'The provided API key is invalid, expired, or has been revoked',
            success: false,
          }
        }

        // Add the validated API key info to the context
        store.apiKey = validKey

        return // Continue to handler
      } catch (error) {
        console.error(`[${traceId}] API key validation error:`, error)
        set.status = 500
        return {
          error: 'Internal server error',
          message: 'Failed to validate API key',
          success: false,
        }
      }
    },
  }
}
