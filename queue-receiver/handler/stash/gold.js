const GOLD_API = 'https://www.goldapi.io/api/XAU/USD'
export default async ({ db, userAgent }) => {
  const gold = await fetch(GOLD_API, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": Bun.env.GOLD_API_KEY || ''
    },
    redirect: 'follow'
  })
  const rates = await fetch("https://www.x-rates.com/calculator/?from=USD&to=THB&amount=1")

  if (gold.ok && rates.ok) {
    const goldData = await gold.json()
    const ratesText = await rates.text()

    const usd = parseFloat(ratesText.match(/USD =([\W\w]+?)THB/ig).join('').match(/[.\d]+/ig).join(''))
    
    await db.query(
      `INSERT INTO "stash"."gold" 
        ("tin", "tout", "tin_ico", "tout_ico", "usd_sale", "usd_buy", "update_at")
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
      `,
      [
        goldData.ask, // tin (price in grams)
        goldData.bid, // tout (price in grams)
        goldData.ch > 0 ? 'up' : 'down', // tin_ico
        goldData.ch > 0 ? 'up' : 'down', // tout_ico
        isNaN(usd) ? 33 : usd,  // usd_sale
        isNaN(usd) ? 33 : usd,  // usd_buy
        new Date(goldData.timestamp * 1000), // Convert Unix timestamp to Date object
      ],
    )
  }


  return new Response(JSON.stringify({ gold: gold.status, rates: rates.status }), { status: gold.status })
}
