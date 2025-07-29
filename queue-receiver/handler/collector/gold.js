import { sql } from 'drizzle-orm'
import numeral from 'numeral'

import { gold, reminder } from '../../../provider/schema.js'
// import flexGoldMessage from '../../../provider/line/flex-gold'

// export default async ({ db, headers, pkg, request, userAgent }) => {
export const getGold = async ({ db }) => {
  const [goldReminder] = await db.execute(sql`SELECT r.note FROM reminder r WHERE name = 'gold'`)
  let [market] = await db.execute(sql`SELECT * FROM stash.gold ORDER BY update_at DESC LIMIT 1`)
  if (!goldReminder) {
    await db.insert(reminder).values({ name: 'gold', note: { cost: [{ oz: 1, usd: 0 }], wallet: 0 } })
  }
  if (!market) {
    market = { tin: 0, tinIco: 'none', tout: 0, toutIco: 'none', usdBuy: 33.5, usdSale: 34.5 }
    await db.insert(gold).values(market)
  }
  const { cost } = goldReminder.note

  const calcGold = cost.map((entry) => {
    const cost = entry.oz * entry.usd
    const spot = entry.oz * market.tout

    return { cost, profit: spot - cost, spot }
  })

  const costTotal = calcGold.reduce((total, e) => total + e.cost, 0)
  const profitTotal = Math.round(calcGold.reduce((total, e) => total + e.profit, 0) * 100) / 100
  const profitPercent = Math.round((profitTotal / costTotal) * 100 * 100) / 100

  const trands = market.tout_ico === 'up' ? 'เพิ่มขึ้น' : 'ลดลง'

  console.log(`🪙 ราคา${trands} ${numeral(market.tout * market.usd_sale).format('0,0')} ${profitPercent}`)

  delete market.tin
  delete market.tin_ico

  return {
    costTotal,
    exchange: { buy: market.usd_buy, sale: market.usd_sale },
    profitPercent,
    profitTotal,
    spot: {
      tout: market.tout,
      tout_ico: market.tout_ico,
    },
    update_date: market.update_date,
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
