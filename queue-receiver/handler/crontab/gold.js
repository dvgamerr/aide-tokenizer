import numeral from 'numeral'

import flexGoldMessage from '../../../provider/line/flex-gold'
import { getGold as getCollectorGold } from '../../handler/collector/gold'
import getStashGold from '../../handler/stash/gold'
import pushMessage from '../botname-push'

export default async (ctx) => {
  try {
    // Fetch and store gold price data from stash
    await getStashGold(ctx)

    // Fetch gold price data from collector
    const collector = await getCollectorGold(ctx)

    const trands = collector.spot.tout_ico === 'up' ? 'เพิ่มขึ้น' : 'ลดลง'
    const payload = {
      altText: `🪙 ราคา${trands} ${numeral(collector.spot.tout * collector.exchange.buy).format('0,0')}`,
      contents: flexGoldMessage(collector),
      type: 'flex',
    }

    const res = await pushMessage(Object.assign(ctx, { body: payload }))
    return new Response(JSON.stringify(res), { status: 201 })
  } catch (ex) {
    console.error(ex)
    return new Response(null, { status: 500 })
  }
}
