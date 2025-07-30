// Response logging function
export const responseLogger = ({ code, path, request, response, status, store }, logger) => {
  if (['/health'].includes(path)) return

  // Extract trace-id from store or response headers
  const traceId = store?.traceId

  const ex = status
  const logError = ex?.code || code > 299
  const logLevel = logError ? 'warn' : 'info'
  const errorMessage = logError ? ` |${ex?.code || ex?.message?.toString().replace('Error: ', '')}| ` : ' '

  logger[logLevel](
    `[${traceId}] [${code || response?.status || request.method}] ${path}${errorMessage}${Math.round(performance.now() / 1000)}ms`,
  )
}
