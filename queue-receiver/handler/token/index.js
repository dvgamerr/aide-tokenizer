import { Elysia } from 'elysia'

import { handlerRevokeToken } from './revoke'
import { handlerCreateToken, validateApiKey } from './token'

const route = new Elysia({ prefix: '/v1' })

route.post('/token', handlerCreateToken, {
  beforeHandle: validateApiKey,
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
              userId: {
                description: 'User ID associated with this token',
                type: 'integer',
              },
            },
            type: 'object',
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: {
              properties: {
                data: {
                  properties: {
                    apiKey: { type: 'string' },
                    createdAt: { type: 'string' },
                    description: { type: 'string' },
                    expiresAt: { type: 'string' },
                    id: { type: 'integer' },
                    isActive: { type: 'boolean' },
                    userId: { type: 'integer' },
                  },
                  type: 'object',
                },
                message: { type: 'string' },
                success: { type: 'boolean' },
              },
              type: 'object',
            },
          },
        },
        description: 'API token created successfully',
      },
      400: {
        content: {
          'application/json': {
            schema: {
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
                success: { type: 'boolean' },
              },
              type: 'object',
            },
          },
        },
        description: 'Bad request',
      },
      500: {
        content: {
          'application/json': {
            schema: {
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
                success: { type: 'boolean' },
              },
              type: 'object',
            },
          },
        },
        description: 'Internal server error',
      },
    },
    security: [{ basicAuth: [] }],
    summary: 'Create new API token',
    tags: ['API Token'],
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
    responses: {
      200: {
        content: {
          'application/json': {
            schema: {
              properties: {
                data: {
                  properties: {
                    apiKey: { type: 'string' },
                    id: { type: 'integer' },
                    isActive: { type: 'boolean' },
                    revokedAt: { type: 'string' },
                  },
                  type: 'object',
                },
                message: { type: 'string' },
                success: { type: 'boolean' },
              },
              type: 'object',
            },
          },
        },
        description: 'API token revoked successfully',
      },
      400: {
        content: {
          'application/json': {
            schema: {
              properties: {
                message: { type: 'string' },
                success: { type: 'boolean' },
              },
              type: 'object',
            },
          },
        },
        description: 'Bad request - API key is required',
      },
      404: {
        content: {
          'application/json': {
            schema: {
              properties: {
                message: { type: 'string' },
                success: { type: 'boolean' },
              },
              type: 'object',
            },
          },
        },
        description: 'API token not found',
      },
      500: {
        content: {
          'application/json': {
            schema: {
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
                success: { type: 'boolean' },
              },
              type: 'object',
            },
          },
        },
        description: 'Internal server error',
      },
    },
    security: [{ basicAuth: [] }],
    summary: 'Revoke API token',
    tags: ['API Token'],
  },
})

export default route
