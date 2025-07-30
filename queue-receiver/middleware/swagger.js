import { version } from '../../package.json'

// Swagger documentation configuration
export const swaggerConfig = {
  documentation: {
    components: {
      securitySchemes: {
        apiKey: {
          description: 'API key authentication using X-API-Key header or Authorization Bearer token',
          in: 'header',
          name: 'X-API-Key',
          type: 'apiKey',
        },
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
