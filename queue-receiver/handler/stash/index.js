import { Elysia } from 'elysia'

import gold from './gold'

const route = new Elysia({
  detail: {
    description:
      'Stash management system for crontab handlers, scheduled tasks, and investment data processing. Provides endpoints for retrieving and processing financial data including gold investments, currency exchange rates, and automated LINE notifications.',
    tags: ['Stash'],
  },
  prefix: '/stash',
})

// Gold Investment Processing and Notification Endpoint
route.patch('/gold', gold, {})

export default route
