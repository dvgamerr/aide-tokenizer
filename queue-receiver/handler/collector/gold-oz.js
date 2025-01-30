import { pgClient } from '../../../provider/db'
import flexGoldMessage from '../../../provider/line/flex-gold'
import numeral from 'numeral'

const clientConn = await pgClient()

const GOLD_API = 'https://register.ylgbullion.co.th/api/price/gold'
export default async ({ request, headers, pkg, userAgent }) => {
  const users = await clientConn.query(`SELECT r.note FROM reminder r WHERE name = 'gold'`)
  const { cost } = users.rows[0].note

  const res = await fetch(GOLD_API, {
    method: 'GET',
    headers: {
      'Accept-Encoding': 'deflate, gzip;q=1.0, *;q=0.5',
      'User-Agent': pkg.userAgent,
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).then((res) => res.json())

  const calcGold = cost.map((entry) => {
    const cost = entry.oz * entry.cost
    const spot = entry.oz * res.spot.tout

    return { cost, spot, profit: spot - cost }
  })

  const costTotal = calcGold.reduce((total, e) => total + e.cost, 0)
  const profitTotal = Math.round(calcGold.reduce((total, e) => total + e.profit, 0) * 100) / 100
  const profitPercent = Math.round((profitTotal / costTotal) * 100 * 100) / 100

  const trands = res.spot['tout-ico'] === 'up' ? 'เพิ่มขึ้น' : 'ลดลง'

  if (request.method === 'PUT') {
    console.log(headers)
    const line = await fetch('http://localhost:3000/line/aide', {
      method: 'PUT',
      headers: {
        authorization: headers['authorization'],
        'content-type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({
        type: 'flex',
        altText: `🪙 ราคา${trands} ${numeral(res.spot.tout * res.exchange_sale).format('0,0')}`,
        contents: flexGoldMessage(costTotal, profitTotal, profitPercent, res.exchange_sale),
      }),
    })
    const { status, statsuText } = line
    return new Response(null, { status, statsuText })
  } else {
    delete res.spot['tin']
    delete res.spot['tin-ico']

    return {
      costTotal,
      profitTotal,
      profitPercent,
      spot: res.spot,
      exchange: { sale: res.exchange_sale, buy: res.exchange_buy },
      update_date: res.update_date,
    }
  }
}
