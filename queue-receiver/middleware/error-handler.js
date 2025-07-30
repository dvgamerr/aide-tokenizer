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
  }
}

export class BadRequestError extends Error {
  constructor(status, message) {
    super(message)
    this.code = 'BAD_REQUEST'
    this.status = status
    this.message = message
  }
}
