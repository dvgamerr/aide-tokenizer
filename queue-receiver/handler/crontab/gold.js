import numeral from 'numeral'
import { pushMessageSelf } from '../../../provider/helper'
import flexGoldMessage from '../../../provider/line/flex-gold'

export default async ({ db, headers }) => {
  try {
    const users = await db.query(`SELECT r.note FROM reminder r WHERE name = 'gold'`)
    const { cost } = users.rows[0].note

    const gold = await db.query(`SELECT tout, tout_ico, usd_sale FROM stash.gold ORDER BY update_at DESC LIMIT 1`)
    const { tout, tout_ico, usd_sale } = gold.rows[0]

    const calcGold = cost.map((entry) => {
      const cost = entry.oz * entry.cost
      const spot = entry.oz * tout

      return { cost, spot, profit: spot - cost }
    })

    const costTotal = calcGold.reduce((total, e) => total + e.cost, 0)
    const profitTotal = Math.round(calcGold.reduce((total, e) => total + e.profit, 0) * 100) / 100
    const profitPercent = Math.round((profitTotal / costTotal) * 100 * 100) / 100

    const trands = tout_ico === 'up' ? 'เพิ่มขึ้น' : 'ลดลง'

    const payload = {
      type: 'flex',
      altText: `🪙 ราคา${trands} ${numeral(tout * usd_sale).format('0,0')}`,
      contents: flexGoldMessage(costTotal, profitTotal, profitPercent, usd_sale),
    }
    const { status, statusText } = await pushMessageSelf(headers, payload)
    return new Response(null, { status, statusText })
  } catch (ex) {
    console.error(ex)
    return new Response(null, { status: 500 })
  }
}
