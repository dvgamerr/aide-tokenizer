import { Elysia } from 'elysia'

import gold from './gold'

const route = new Elysia({
  detail: {
    description: 'Scheduled task endpoints for automated data collection and processing',
    tags: ['Crontab'],
  },
  prefix: '/crontab',
})

route.get('/gold', gold, {
  detail: {
    description:
      'Retrieves current gold prices from external APIs and calculates investment profit/loss based on stored portfolio data. Returns comprehensive gold market data including spot prices, exchange rates, cost basis, and profit calculations.',
    summary: 'Fetch gold prices and calculate investment returns',
    tags: ['Crontab'],
  },
})

export default route
