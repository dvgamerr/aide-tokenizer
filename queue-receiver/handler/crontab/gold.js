import numeral from 'numeral'
import { fetchSelf, pushMessageSelf } from '../../../provider/helper'
import flexGoldMessage from '../../../provider/line/flex-gold'

export default async ({ db, headers, request }) => {
  try {
    await fetchSelf('POST', '/stash/gold', headers)
    const users = await db.query(`SELECT r.note FROM reminder r WHERE name = 'gold'`)
    const { cost, usd, gold99 } = users.rows[0].note
    // {"cost":[{"oz":2.2,"cost":2607.35},{"oz":2.7,"cost":2105.64}],"gold99":[{"oz":2.2,"cost":2607.35},{"kg":0,"cost":0},{"oz":2.7,"cost":2105.64}],"gold96":[{"bg":0,"cost":0}],"saving":6385.41,"totalCost":560000}

    const gold = await db.query(`SELECT tout, tout_ico, usd_sale, usd_buy FROM stash.gold ORDER BY update_at DESC LIMIT 1`)
    const { tout, tout_ico, usd_sale, usd_buy } = gold.rows[0]

    const calcGold = gold99.map((entry) => {
      if (entry.oz) {
        const cost = entry.oz * entry.cost
        const spot = entry.oz * tout
        return { cost, spot, profit: spot - cost }
      } else if (entry.kg) {
        const cost = entry.kg * entry.cost
        const spot = entry.kg * tout
        return { cost, spot, profit: spot - cost }
      }
      return { cost: 0, spot: 0, profit: 0 }
    })
    // const totalCost = calcGold.reduce((total, e) => total + e.cost, 0)
    const totalCost = cost / usd_buy
    const profitTotal = Math.round((calcGold.reduce((total, e) => total + e.spot, 0) + usd - totalCost) * 100) / 100
    const profitPercent = Math.round((profitTotal / totalCost) * 100 * 100) / 100

    const trands = tout_ico === 'up' ? 'เพิ่มขึ้น' : 'ลดลง'
    const payload = {
      type: 'flex',
      altText: `🪙 ราคา${trands} ${numeral(tout * usd_sale).format('0,0')}`,
      contents: flexGoldMessage(totalCost, profitTotal, profitPercent, usd_sale),
    }

    if (request.method === 'GET') {
      return {
        altText: payload.altText,
        totalCost,
        profitTotal,
        profitPercent,
        usd_sale,
      }
    }
    const { status, statusText } = await pushMessageSelf(headers, payload)
    return new Response(null, { status, statusText })
  } catch (ex) {
    console.error(ex)
    return new Response(null, { status: 500 })
  }
}
