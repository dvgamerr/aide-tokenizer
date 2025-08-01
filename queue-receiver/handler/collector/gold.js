import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { sql } from 'drizzle-orm'
import numeral from 'numeral'

import { gold, reminder } from '../../../provider/schema.js'
// import flexGoldMessage from '../../../provider/line/flex-gold'

dayjs.extend(relativeTime)

const goldCalculator = (gold, market, key) =>
  gold
    .map((entry) => {
      const ozCost = (entry.oz || 0) * (entry.usd || 0)
      const ozSpot = (entry.oz || 0) * parseFloat(market.tout)
      const kgCost = (entry.kg || 0) * (entry.usd || 0)
      const kgSpot = (entry.kg || 0) * parseFloat(market.tout)

      const cost = ozCost + kgCost
      const spot = ozSpot + kgSpot

      return { cost, profit: spot - cost, spot }
    })
    .reduce((total, e) => total + e[key], 0)

// export default async ({ db, headers, pkg, request, userAgent }) => {
export const getGold = async ({ db, logger, query, store }) => {
  const traceId = store?.traceId

  const currency = query?.currency || 'USD'

  const [goldReminder] = await db.execute(sql`SELECT r.note FROM reminder r WHERE name = 'gold'`)
  let [market] = await db.execute(sql`SELECT * FROM stash.gold ORDER BY update_at DESC LIMIT 1`)
  if (!goldReminder) {
    await db.insert(reminder).values({ name: 'gold', note: { deposit: 1, gold99: [{ oz: 1, usd: 0 }], wallet: 0 } })
  }
  if (!market) {
    market = { tin: '0', tin_ico: 'none', tout: '0', tout_ico: 'none', usd_buy: '33.5', usd_sale: '34.5' }
    await db.insert(gold).values(market)
  }
  market = Object.assign(market, {
    tin: parseFloat(market.tin),
    tout: parseFloat(market.tout),
    usd_buy: parseFloat(market.usd_buy),
    usd_sale: parseFloat(market.usd_sale),
  })
  const { deposit, gold96, gold99, wallet } = goldReminder.note

  const costTotal = goldCalculator(gold99, market, 'spot') + goldCalculator(gold96, market, 'spot')
  const depositTotal = deposit / market.usd_buy
  const profitTotal = costTotal + wallet - depositTotal
  const profitPercent = Math.round((profitTotal / depositTotal) * 100 * 100) / 100

  const trands = market.tout_ico === 'up' ? 'เพิ่มขึ้น' : 'ลดลง'

  logger.info(
    `[${traceId}] 🪙 ${profitTotal > 0 ? 'กำไร' : 'ขาดทุน'} ${numeral(profitTotal * parseFloat(market.usd_sale)).format('0,0')} บาท (${profitTotal > 0 ? '+' : ''}${profitPercent}%) ราคา${trands} `,
  )

  delete market.tin
  delete market.tin_ico

  return {
    exchange: { buy: parseFloat(market.usd_buy), sale: parseFloat(market.usd_sale) },
    profitPercent,
    profitTotal: Math.round(profitTotal * (currency === 'THB' ? market.usd_sale : 1) * 100) / 100,
    spot: {
      tout: parseFloat(market.tout),
      tout_ico: market.tout_ico,
    },
    total: Math.round((costTotal + wallet) * (currency === 'THB' ? market.usd_buy : 1) * 100) / 100,
    update_at: dayjs(market.update_at).fromNow(),
  }
}

export const postGold = async ({ body, db }) => {
  // Use INSERT ON CONFLICT for upsert operation
  await db.execute(sql`
    INSERT INTO reminder (name, note) 
    VALUES ('gold', ${JSON.stringify(body)})
    ON CONFLICT (name) 
    DO UPDATE SET note = ${JSON.stringify(body)}
  `)

  return { success: true }
}
