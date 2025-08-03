import { Elysia, t } from 'elysia'

import { handlerRevokeToken } from './revoke'
import { handlerCreateToken, validateApiKey } from './token'

const route = new Elysia({ prefix: '/v1' })

route.post('/token', handlerCreateToken, {
  beforeHandle: validateApiKey,
  body: t.Object({
    description: t.String({
      description: 'description for the API token',
    }),
    expiresAt: t.Optional(
      t.Null(
        t.String({
          description: 'Optional expiration date in ISO format',
          format: 'date-time',
        }),
      ),
    ),
  }),
  detail: {
    description:
      'Create a new API token for accessing protected endpoints. The token will be generated securely and can optionally have an expiration date.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            properties: {
              description: {
                description: 'Optional description for the API token',
                type: 'string',
              },
              expiresAt: {
                description: 'Optional expiration date in ISO format',
                format: 'date-time',
                type: 'string',
              },
            },
            type: 'object',
          },
        },
      },
    },
    summary: 'Create API token',
    tags: ['Token'],
  },
})

route.post('/revoke', handlerRevokeToken, {
  beforeHandle: validateApiKey,
  detail: {
    description:
      'Revoke an existing API token by setting its status to inactive. Once revoked, the token cannot be used for authentication.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            properties: {
              apiKey: {
                description: 'The API key to revoke',
                type: 'string',
              },
            },
            required: ['apiKey'],
            type: 'object',
          },
        },
      },
      required: true,
    },
    summary: 'Revoke token',
    tags: ['Token'],
  },
})

export default route
