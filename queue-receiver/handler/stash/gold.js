import dayjs from 'dayjs'

const GOLD_API = 'https://register.ylgbullion.co.th/api/price/gold'
export default async ({ db, userAgent }) => {
  const res = await fetch(GOLD_API, {
    method: 'GET',
    headers: {
      'Accept-Encoding': 'deflate, gzip;q=1.0, *;q=0.5',
      'User-Agent': userAgent,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).then((res) => res.json())

  await db.query(
    `INSERT INTO "stash"."gold" 
      ("tin", "tout", "tin_ico", "tout_ico", "usd_sale", "usd_buy", "update_at")
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT DO NOTHING
    `,
    [
      res.spot.tin,
      res.spot.tout,
      res.spot['tin-ico'],
      res.spot['tout-ico'],
      parseFloat(res.exchange_sale),
      parseFloat(res.exchange_buy),
      dayjs(res.update_date).add(-7, 'hour').toDate(),
    ],
  )

  return new Response(null, { status: 200 })
}
