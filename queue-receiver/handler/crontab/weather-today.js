import { logger } from '../../../provider/config'
import pushMessage from '../botname-push'
import predictrionWeather from '../prediction/weather-daily'

export default async (ctx) => {
  const { store } = ctx
  try {
    const apiUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality'
    const params = new URLSearchParams({
      end_date: '2025-08-04',
      hourly: 'pm2_5,pm10',
      latitude: '13.7',
      longitude: '100.5',
      start_date: '2025-08-04',
      timezone: 'auto',
    })

    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()

    const pm25Values = data.hourly.pm2_5
    const hasHighPM25 = pm25Values.some((value) => value >= 35)
    if (!hasHighPM25) {
      logger.info(`[${store?.traceId}] pm 2.5 safty`)
      return new Response(null, { status: 204 })
    }
    const invoke = await predictrionWeather(Object.assign(ctx, { body: { pm2_5: data.hourly.pm2_5 } }))

    logger.info(`[${store?.traceId}] prediction ${invoke.cost}`)
    await pushMessage(
      Object.assign(ctx, {
        body: {
          text: invoke.content,
          type: 'text',
        },
      }),
    )
    return new Response(null, { status: 201 })
  } catch (ex) {
    console.error(ex)
    return new Response(null, { status: 500 })
  }
}
