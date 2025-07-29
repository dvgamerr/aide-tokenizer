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
})

route.post('/gold', postGold, {
  body: t.Object({
    cost: t.Array(
      t.Object({
        oz: t.Number({
          description: 'Number of ounces purchased',
          example: 1,
          minimum: 0,
        }),
        usd: t.Number({
          description: 'Cost per ounce in USD',
          example: 3343.68,
          minimum: 0,
        }),
      }),
      {
        description: 'Array of gold investment entries',
        example: [
          { oz: 1, usd: 3343.68 },
          { oz: 2.7, usd: 0 },
        ],
        minItems: 1,
      },
    ),
    wallet: t.Number({
      description: 'Current wallet balance',
      example: 11200.16,
      minimum: 0,
    }),
  }),
  detail: {
    description:
      'Update gold investment cost data. Accepts wallet balance and an array of investment entries with USD cost and oz (ounce) values.',
    summary: 'Update gold',
    tags: ['Collector'],
  },
})

export default route
