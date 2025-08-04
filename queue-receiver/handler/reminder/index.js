import { Elysia, t } from 'elysia'

import gold from './rebalance-gold'

const route = new Elysia({
  detail: {
    description: 'Data collector endpoints for various external APIs',
    tags: ['Collector'],
  },
  prefix: '/reminder',
})

route.post('/gold', gold, {
  body: t.Object({
    deposit: t.Number({
      description: 'Total investment deposit',
      example: 100000,
      minimum: 0,
    }),
    gold96: t.Array(
      t.Object({
        cost: t.Number({
          description: 'Total cost for 96% gold in local currency',
          example: 0,
          minimum: 0,
        }),
        kg: t.Number({
          description: 'Number of kilograms purchased for 96% gold',
          example: 0,
          minimum: 0,
        }),
      }),
      {
        description: 'Array of 96% gold investment entries',
        example: [{ cost: 0, kg: 0 }],
        minItems: 0,
      },
    ),
    gold99: t.Array(
      t.Object({
        oz: t.Number({
          description: 'Number of ounces purchased for 99% gold',
          example: 1,
          minimum: 0,
        }),
        usd: t.Number({
          description: 'Cost per ounce in USD for 99% gold',
          example: 1,
          minimum: 0,
        }),
      }),
      {
        description: 'Array of 99% gold investment entries',
        example: [{ oz: 1, usd: 1 }],
        minItems: 0,
      },
    ),
    wallet: t.Number({
      description: 'Current wallet balance',
      example: 10,
      minimum: 0,
    }),
  }),
  detail: {
    description:
      'Update gold investment cost data. Accepts wallet balance, total cost, and arrays of investment entries for both 99% and 96% gold.',
    summary: 'Update gold',
    tags: ['Collector'],
  },
})

export default route
