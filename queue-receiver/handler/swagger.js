export const responseProvider = {
  200: {
    content: {
      'application/json': {
        schema: {
          properties: {
            success: {
              example: true,
              type: 'boolean',
            },
          },
          type: 'object',
        },
      },
    },
    description: 'Message sent successfully',
  },
  400: {
    content: {
      'application/json': {
        schema: {
          properties: {
            error: {
              example: 'Invalid message format',
              type: 'string',
            },
            success: {
              example: false,
              type: 'boolean',
            },
          },
          type: 'object',
        },
      },
    },
    description: 'Bad request - Invalid message format or missing required fields',
  },
  401: {
    content: {
      'application/json': {
        schema: {
          properties: {
            error: {
              example: 'Unauthorized',
              type: 'string',
            },
            success: {
              example: false,
              type: 'boolean',
            },
          },
          type: 'object',
        },
      },
    },
    description: 'Unauthorized - Invalid authentication credentials',
  },
  500: {
    content: {
      'application/json': {
        schema: {
          properties: {
            error: {
              example: 'Internal server error',
              type: 'string',
            },
            success: {
              example: false,
              type: 'boolean',
            },
          },
          type: 'object',
        },
      },
    },
    description: 'Internal server error',
  },
}
