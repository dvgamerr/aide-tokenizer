export const responseLogger = ({ code, path, status, store }, logger) => {
  if (path === '/health') return

  const traceId = store?.traceId
  const isError = code > 299
  const errorMsg = isError ? ` |${status?.code || status?.message?.replace('Error: ', '') || 'Error'}| ` : ' '
  const duration = Math.round(performance.now() / 1000)

  logger[isError ? 'warn' : 'info'](`[${traceId}] [${code}] ${path}${errorMsg}${duration}ms`)
}
