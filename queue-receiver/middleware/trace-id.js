import { randomUUID } from 'crypto'

export const traceIdMiddleware = {
  beforeHandle({ headers, set, store }) {
    const traceId = headers['x-trace-id'] || headers['trace-id'] || randomUUID()
    set.headers['x-trace-id'] = traceId
    store.traceId = traceId
  },
}
