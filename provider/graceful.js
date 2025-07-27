let isShuttingDown = false

const gracefulShutdown = async (signal, app, db, logger) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, forcing exit...')
    process.exit(1)
  }

  isShuttingDown = true
  logger.info(`Received ${signal}...`)

  try {
    app.server?.stop()

    await db.disconnect()

    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message })
    process.exit(1)
  }
}

const SHUTDOWN_TIMEOUT = 10000
let shutdownTimer

const forceShutdown = (logger) => {
  logger.error('Forced shutdown due to timeout')
  process.exit(1)
}

const gracefulShutdownWithTimeout = async (signal, app, db, logger) => {
  if (shutdownTimer) return // Already shutting down

  shutdownTimer = setTimeout(() => forceShutdown(logger), SHUTDOWN_TIMEOUT)

  try {
    await gracefulShutdown(signal, app, db, logger)
    clearTimeout(shutdownTimer)
  } catch (error) {
    clearTimeout(shutdownTimer)
    throw error
  }
}

export const setupGracefulShutdown = (app, db, logger) => {
  process.once('SIGTERM', () => gracefulShutdownWithTimeout('SIGTERM', app, db, logger))

  process.once('SIGINT', () => gracefulShutdownWithTimeout('SIGINT', app, db, logger))

  if (process.platform === 'win32') {
    process.once('SIGBREAK', () => gracefulShutdownWithTimeout('SIGBREAK', app, db, logger))
  }

  process.once('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack })
    gracefulShutdownWithTimeout('uncaughtException', app, db, logger)
  })

  process.once('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise })
    gracefulShutdownWithTimeout('unhandledRejection', app, db, logger)
  })
}

export default setupGracefulShutdown
