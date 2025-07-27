import pino from 'pino'
import { name, version as packageVersion } from '../package.json'

export const PORT = Bun.env.PORT || 3000

export const version = packageVersion

export const userAgent = `aide-${name}/${version}`

export const logger = pino({
  level: Bun.env.LOG_LEVEL || 'info',
})

export const parseDatabaseUrl = (url) => {
  const uri = new URL(url)
  return {
    user: uri.username,
    password: uri.password,
    host: uri.hostname,
    port: uri.port,
    database: uri.pathname.split('/')[1],
    ssl: false,
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const getAuthAPIKey = (headers) => {
  const [, token] = headers.authorization.split(' ')
  const [botName, apiKey] = atob(token).split(':')
  return { botName, apiKey }
}

export const pushMessageSelf = async (headers, payload) => {
  return await fetch(`http://localhost:${PORT}/`, {
    method: 'PUT',
    headers: {
      authorization: headers.authorization,
      'content-type': 'application/json',
      'User-Agent': userAgent,
    },
    body: JSON.stringify(payload),
  })
}

export const fetchSelf = async (method, path, headers, payload) => {
  return await fetch(`http://localhost:${PORT}/${path}`, {
    method,
    headers: {
      authorization: headers.authorization,
      'content-type': 'application/json',
      'User-Agent': userAgent,
    },
    body: JSON.stringify(payload),
  })
}

// // Enhanced Error Handling Utilities
// export const createErrorHandler = (context) => {
//   return (error, additionalInfo = {}) => {
//     const errorData = {
//       context,
//       error: error.message,
//       stack: error.stack,
//       timestamp: new Date().toISOString(),
//       ...additionalInfo,
//     }

//     logger.error(`Error in ${context}`, errorData)
//     return errorData
//   }
// }

// export const withRetry = async (operation, maxRetries = 3, baseDelay = 1000) => {
//   let lastError

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       return await operation()
//     } catch (error) {
//       lastError = error

//       if (attempt === maxRetries) {
//         throw error
//       }

//       const delay = baseDelay * Math.pow(2, attempt - 1)
//       logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, {
//         error: error.message,
//         attempt,
//         maxRetries,
//       })

//       await sleep(delay)
//     }
//   }

//   throw lastError
// }

// // Health Check Utility
// export const createHealthChecker = (checks = {}) => {
//   return async () => {
//     const results = {}
//     let isHealthy = true

//     for (const [name, checkFn] of Object.entries(checks)) {
//       try {
//         const startTime = Date.now()
//         await checkFn()
//         results[name] = {
//           status: 'healthy',
//           responseTime: Date.now() - startTime,
//         }
//       } catch (error) {
//         isHealthy = false
//         results[name] = {
//           status: 'unhealthy',
//           error: error.message,
//         }
//       }
//     }

//     return {
//       status: isHealthy ? 'healthy' : 'unhealthy',
//       timestamp: new Date().toISOString(),
//       checks: results,
//     }
//   }
// }
