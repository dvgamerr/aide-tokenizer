import { Elysia } from 'elysia'

import weather from './weather-daily'

const route = new Elysia({
  detail: {
    description: 'Prediction endpoints for weather forecasting and data analysis',
    tags: ['Prediction'],
  },
  prefix: '/prediction',
})

route.post('/weather-daily', weather, {
  detail: {
    description: 'Fetches daily weather information and predictions for automated processing.',
    summary: 'Get daily weather predictions',
    tags: ['Prediction'],
  },
})

export default route
