import { sql } from 'drizzle-orm'

// Middleware for validating authorization
export const createValidateAuthLine = (stmt) => ({
  async beforeHandle({ headers, set }) {
    try {
      if (!headers?.authorization) throw 'Unauthorized'

      const [authType, authToken] = headers?.authorization?.split(' ') || []
      const [allowed] = await stmt.execute(
        sql`SELECT COUNT(*) auth FROM line_users WHERE active = 't' AND (notice_name || ':' || api_key) = ${atob(authToken)}`,
      )

      if (!authType || !authToken || allowed.auth === '0') {
        set.status = 401
        set.headers['WWW-Authenticate'] = `${authType || 'Basic'} realm='sign', error="invalid_token"`
        return 'Unauthorized'
      }
    } catch (ex) {
      set.status = 400
      set.headers['WWW-Authenticate'] = `Basic realm='sign', error="${ex.message || ex}"`
      return 'Unauthorized'
    }
  },
})
