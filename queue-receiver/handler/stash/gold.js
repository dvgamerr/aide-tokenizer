import { gold } from '../../../provider/schema.js'

const GOLD_API = 'https://register.ylgbullion.co.th/api/price/gold'

export default async ({ db }) => {
  try {
    const response = await fetch(GOLD_API, {
      headers: {
        'Accept-Encoding': 'deflate, gzip;q=1.0, *;q=0.5',
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const goldData = await response.json()

    // Parse the exchange rates from the API response
    const usdBuy = parseFloat(goldData.exchange_buy) || 33
    const usdSale = parseFloat(goldData.exchange_sale) || 33

    // Insert gold data using Drizzle ORM
    await db
      .insert(gold)
      .values({
        tin: goldData.spot.tin.toString(), // Convert to string for numeric type
        tinIco: goldData.spot['tin-ico'],
        tout: goldData.spot.tout.toString(), // Convert to string for numeric type
        toutIco: goldData.spot['tout-ico'],
        updateAt: new Date(goldData.update_date),
        usdBuy: usdBuy.toString(), // Convert to string for numeric type
        usdSale: usdSale.toString(), // Convert to string for numeric type
      })
      .onConflictDoNothing()

    return new Response(
      JSON.stringify({
        inserted: {
          tin: goldData.spot.tin,
          tinIco: goldData.spot['tin-ico'],
          tout: goldData.spot.tout,
          toutIco: goldData.spot['tout-ico'],
          updateAt: goldData.update_date,
          usdBuy,
          usdSale,
        },
        success: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error fetching gold data:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
}
