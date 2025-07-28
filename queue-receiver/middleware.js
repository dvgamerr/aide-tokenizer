import { randomUUID } from 'crypto'
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

// Trace ID middleware
export const traceIdMiddleware = {
  beforeHandle({ headers, set, store }) {
    // Get trace-id from headers or generate a new one
    const traceId = headers['x-trace-id'] || headers['trace-id'] || randomUUID()

    // Add trace-id to response headers
    set.headers['x-trace-id'] = traceId

    // Store trace-id in the store for use in other parts of the request lifecycle
    store.traceId = traceId
  },
}

// Error handling function
export const errorHandler = ({ code, error, path, store }, logger) => {
  if (code === 'NOT_FOUND') return new Response(code)

  // Get trace-id for error logging
  const traceId = store?.traceId

  // Log error properly with logger instead of console.error
  logger.error({ code, error: error.message, path, stack: error.stack, traceId })

  return {
    error: error.toString().replace('Error: ', ''),
    status: code,
    timestamp: new Date().toISOString(),
    traceId,
  }
}

// Response logging function
export const responseLogger = ({ code, path, request, response, status, store }, logger) => {
  if (['/health'].includes(path)) return

  // Extract trace-id from store or response headers
  const traceId = store?.traceId

  const ex = status
  const logError = ex?.code || code > 299
  const logLevel = logError ? 'warn' : 'trace'
  const errorMessage = logError ? ` |${ex?.code || ex?.message?.toString().replace('Error: ', '')}| ` : ' '

  logger[logLevel](
    `[${traceId}] [${code || response?.status || request.method}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`,
  )
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
