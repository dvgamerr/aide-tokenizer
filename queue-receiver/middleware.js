import { sql } from 'drizzle-orm'

import { version } from '../package.json'

// Swagger documentation configuration
export const swaggerConfig = {
  documentation: {
    components: {
      securitySchemes: {
        basicAuth: {
          description: 'Basic authentication using bot name and API key',
          scheme: 'basic',
          type: 'http',
        },
      },
    },
    info: {
      description: 'API for handling LINE bot messages and webhooks',
      title: 'Queue Receiver API',
      version: version,
    },
  },
  path: '/docs',
}

// Error handling function
export const errorHandler = ({ code, error, path }, logger) => {
  if (code === 'NOT_FOUND') return new Response(code)

  // Log error properly with logger instead of console.error
  logger.error({ code, error: error.message, path, stack: error.stack })

  return {
    error: error.toString().replace('Error: ', ''),
    status: code,
    timestamp: new Date().toISOString(),
  }
}

// Response logging function
export const responseLogger = ({ code, path, request, response, status }, logger) => {
  if (['/health'].includes(path)) return
  const ex = status
  const logError = ex?.code || code > 299
  const logLevel = logError ? 'warn' : 'trace'
  const errorMessage = logError ? ` |${ex?.code || ex?.message?.toString().replace('Error: ', '')}| ` : ' '
  logger[logLevel](`[${code || response?.status || request.method}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`)
}

// Middleware for validating authorization
export const createValidateAuthLine = (stmt) => ({
  async beforeHandle({ headers, set }) {
    try {
      if (!headers?.authorization) throw 'Unauthorized'
      const [authType, authToken] = headers?.authorization?.split(' ') || []
      const [allowed] = await stmt.execute(
        sql`SELECT COUNT(*) auth FROM line_users WHERE active = 't' AND (notice_name || ':' || api_key) = ${atob(authToken)}`,
      )

      if (!headers?.authorization || !authType || !authToken || allowed.auth === '0') {
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
