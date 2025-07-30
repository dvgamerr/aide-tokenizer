import { randomUUID } from 'crypto'

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
