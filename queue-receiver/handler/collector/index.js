import { Elysia, t } from 'elysia'

import cinema from './cinema'
import { getGold, postGold } from './gold'

const route = new Elysia({
  detail: {
    description: 'Data collector endpoints for various external APIs',
    tags: ['Collector'],
  },
  prefix: '/collector',
})

route.get('/cinema', cinema, {
  detail: {
    description: 'Fetch cinema showing data with optional filtering by genre, release date, search term, week, or year',
    summary: 'Get cinema showing',
    tags: ['Collector'],
  },
  query: t.Object({
    genre: t.Optional(t.String()),
    release_date: t.Optional(t.String()),
    search: t.Optional(t.String()),
    week: t.Optional(t.Number()),
    year: t.Optional(t.Number()),
  }),
})

route.get('/gold', getGold, {
  detail: {
    description:
      'Fetch current gold prices and calculate profit/loss based on stored investment data. Returns cost total, profit calculations, exchange rates, and current spot prices.',
    summary: 'Get gold price',
    tags: ['Collector'],
  },
  query: t.Object({
    currency: t.Optional(
      t.Union([t.Literal('THB'), t.Literal('USD')], {
        description: 'Currency for price display',
        example: 'THB',
      }),
    ),
  }),
})

route.post('/gold', postGold, {
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
