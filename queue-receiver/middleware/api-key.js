import { validateApiKey } from '../handler/token/token.js'

export function createValidateApiKey(db) {
  return {
    async beforeHandle({ headers, set, store }) {
      const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '')

      if (!apiKey) {
        set.status = 401
        return { error: 'API key is required', success: false }
      }

      const validKey = await validateApiKey(apiKey, db)
      if (!validKey) {
        set.status = 401
        return { error: 'Invalid or expired API key', success: false }
      }

      store.apiKey = validKey
    },
  }
}
