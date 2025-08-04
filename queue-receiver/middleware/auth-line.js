import { sql } from 'drizzle-orm'

export const createValidateAuthLine = (stmt) => ({
  async beforeHandle({ headers, set }) {
    const auth = headers?.authorization
    if (!auth) {
      set.status = 401
      return 'Unauthorized'
    }

    const [authType, authToken] = auth.split(' ')
    if (!authType || !authToken) {
      set.status = 401
      return 'Unauthorized'
    }

    const [result] = await stmt.execute(
      sql`SELECT COUNT(*) auth FROM line_users WHERE active = 't' AND (notice_name || ':' || api_key) = ${atob(authToken)}`,
    )

    if (result.auth === '0') {
      set.status = 401
      set.headers['WWW-Authenticate'] = `${authType} realm='sign', error="invalid_token"`
      return 'Unauthorized'
    }
  },
})
