import { pushMessageSelf } from '../../../provider/helper'
import flexCarouselMessage from '../../../provider/line/flex-carousel'
import dayjs from 'dayjs'

export default async ({ db, logger, headers, params }) => {
  console.log(params)
  try {
    const today = dayjs()
    const currentYear = today.year()
    const currentWeek = today.week()

    const movieShowings = await db.query(
      `
        SELECT s_bind, s_name_en, s_name_th, t_release, s_genre, n_time, s_url, s_cover, o_theater
        FROM "stash"."cinema_showing" 
        WHERE n_year = $1 AND n_week = $2
        ORDER BY s_bind ASC;
      `,
      [currentYear, currentWeek],
    )

    if (!movieShowings.rowCount) {
      await pushMessageSelf(headers, { text: '🔎 ไม่พบข้อมูลหนังที่กำลังฉาย' })
      return new Response(null, { status: 204 })
    }

    const maxFlexItems = 10
    const totalFlexGroups = Math.ceil(movieShowings.rows.length / maxFlexItems)
    logger.info(`LINE Flex ${totalFlexGroups} scale`)

    for (let groupIndex = 0; groupIndex < totalFlexGroups; groupIndex++) {
      const startIndex = groupIndex * maxFlexItems
      const endIndex = startIndex + maxFlexItems
      const payload = {
        type: 'flex',
        altText: `ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${currentWeek} ปี ${currentYear}${totalFlexGroups > 1 ? ` [${groupIndex + 1}/${totalFlexGroups}]` : ''} ครับผม`,
        contents: {
          type: 'carousel',
          contents: flexCarouselMessage(movieShowings.rows.slice(startIndex, endIndex)),
        },
      }
      await pushMessageSelf(headers, payload)
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
