import { Elysia, t } from 'elysia'

import cinema from './cinema-filter'
import gold from './get-gold'

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

route.get('/gold', gold, {
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

export default route
