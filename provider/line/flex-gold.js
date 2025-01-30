import numeral from 'numeral'

const formatMoney = (val, postfix) => `${numeral(val).format('0,0.00')}${postfix ? ` ${postfix}` : ''}`

export default (costTotal, profitTotal, profitPercent, exchange_sale) => {
  const savingsTotal = costTotal + profitTotal
  const savingsTotalTH = savingsTotal * exchange_sale
  const profitTotalTH = profitTotal * exchange_sale

  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '🪙 ราคาทองคำ',
              weight: 'bold',
              size: 'sm',
              margin: 'none',
              color: '#457B9D',
            },
            {
              type: 'text',
              text: new Date().toISOString().substring(0, 10),
              color: '#ababab',
              size: 'xxs',
              align: 'end',
              offsetTop: 'sm',
            },
          ],
          spacing: 'xs',
        },
        {
          type: 'separator',
          margin: 'sm',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'none',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'มูลค่าทองคำรวม',
                  size: 'xs',
                  color: '#555555',
                  flex: 4,
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: formatMoney(savingsTotal, 'USD'),
                  size: 'xs',
                  color: '#111111',
                  align: 'end',
                  flex: 4,
                },
              ],
              margin: 'none',
              paddingStart: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `(${formatMoney(savingsTotalTH, 'บาท')})`,
                  size: 'xxs',
                  color: '#ababab',
                  align: 'end',
                },
              ],
              paddingStart: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'กำไร',
                  size: 'xs',
                  color: '#1DB446',
                  flex: 4,
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: `(${formatMoney(profitPercent)}%)`,
                  size: 'xxs',
                  color: '#1DB446',
                  offsetTop: 'xs',
                  align: 'end',
                  flex: 5,
                },
                {
                  type: 'text',
                  text: formatMoney(profitTotal, 'USD'),
                  size: 'xs',
                  color: '#1DB446',
                  align: 'end',
                  flex: 5,
                },
              ],
              paddingStart: 'md',
              margin: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `(${formatMoney(profitTotalTH, 'บาท')})`,
                  size: 'xxs',
                  color: '#ababab',
                  align: 'end',
                },
              ],
              paddingStart: 'md',
            },
          ],
        },
      ],
      spacing: 'none',
      margin: 'none',
      paddingAll: 'none',
      paddingTop: 'sm',
      paddingBottom: 'md',
      paddingStart: 'md',
      paddingEnd: 'md',
    },
    styles: {
      body: {
        backgroundColor: '#F7F7F7',
      },
      footer: {
        separator: true,
      },
    },
  }
}
