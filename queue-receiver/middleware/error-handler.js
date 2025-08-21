export const errorHandler = ({ code, error, path, store }, logger) => {
  if (code === 'NOT_FOUND') return new Response(code, { status: 404 })

  logger.error({ code, error: error.message, path, stack: error.stack, traceId: store?.traceId })

  return {
    error: error.toString().replace('Error: ', ''),
    status: code,
  }
}

export class BadRequestError extends Error {
  constructor(status, message) {
    super(message)
    this.code = 'BAD_REQUEST'
    this.status = status
  }
}

export class InternalError extends Error {
  constructor(message) {
    super(message)
    this.code = 'INTERNAL_ERROR'
    this.status = 500
  }
}
