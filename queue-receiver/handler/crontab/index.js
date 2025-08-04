import { Elysia } from 'elysia'

import cinema from './cinema-line-card'
import gold from './gold-line-flex'

const route = new Elysia({
  detail: {
    description: 'Scheduled task endpoints for automated data collection and processing',
    tags: ['Crontab'],
  },
  prefix: '/crontab',
})

route.get('/cinema', cinema, {
  detail: {
    description: 'Fetches cinema showtimes and movie information for scheduled updates.',
    summary: 'Send LINE Flex for cinema showing',
    tags: ['Crontab'],
  },
})

route.get('/gold', gold, {
  detail: {
    description: 'Fetches current gold prices and calculates investment profit/loss.',
    summary: 'Send LINE Flex for gold prices',
    tags: ['Crontab'],
  },
})

export default route
