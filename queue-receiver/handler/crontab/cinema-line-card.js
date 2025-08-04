import dayjs from 'dayjs'
import { sql } from 'drizzle-orm'

import flexCarouselMessage from '../../../provider/line/flex-carousel'
import pushMessage from '../botname-push'

export default async (ctx) => {
  const { db, logger, store } = ctx
  const traceId = store?.traceId

  try {
    const today = dayjs()
    const currentYear = today.year()
    const currentWeek = today.week()

    const movieShowings = await db.execute(
      sql`
        SELECT s_bind, s_name_en, s_name_th, t_release, s_genre, n_time, s_url, s_cover, o_theater
        FROM "stash"."cinema_showing" 
        WHERE n_year = ${currentYear} AND n_week = ${currentWeek}
        ORDER BY s_bind ASC;
      `,
    )

    if (!movieShowings.length) {
      await pushMessage(Object.assign(ctx, { body: { text: '🔎 ไม่พบข้อมูลหนังที่กำลังฉาย' }, method: 'POST' }))
      return new Response(null, { status: 204 })
    }
    const maxFlexItems = 10
    const totalFlexGroups = Math.ceil(movieShowings.length / maxFlexItems)
    logger.info(`[${traceId}] LINE Flex ${totalFlexGroups} scale`)

    for (let groupIndex = 0; groupIndex < totalFlexGroups; groupIndex++) {
      const startIndex = groupIndex * maxFlexItems
      const endIndex = startIndex + maxFlexItems
      const payload = {
        altText: `ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${currentWeek} ปี ${currentYear}${totalFlexGroups > 1 ? ` [${groupIndex + 1}/${totalFlexGroups}]` : ''} ครับผม`,
        contents: {
          contents: flexCarouselMessage(movieShowings.slice(startIndex, endIndex)),
          type: 'carousel',
        },
        type: 'flex',
      }
      await pushMessage(Object.assign(ctx, { body: payload }))
    }
    return new Response(null, { status: 201 })
  } catch (ex) {
    console.error(ex)
    return new Response(null, { status: 500 })
  }
}
//   const res = await fetch(`http://notice.touno.io/line/popcorn/movie`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(flexCarousel(message, items)),
//   })

//   const body = await res.json()
//   logger.info(`notice.touno.io (${res.status}): ${JSON.stringify(body)}`)
