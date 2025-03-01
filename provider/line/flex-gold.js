import numeral from 'numeral'

const formatMoney = (val, postfix) => `${numeral(val).format('0,0.00')}${postfix ? ` ${postfix}` : ''}`

const colorMode = {
  dark: {
    title: '#ffc107',
    background: '#1E1E1E',
    text: '#DDDDDD',
    muted: '#AAAAAA',
    highlight: '#1DB446',
    separator: '#444444',
  },
  light: {
    title: '#ffc107',
    background: '#F7F7F7',
    text: '#111111',
    muted: '#ababab',
    highlight: '#1DB446',
    separator: '#E0E0E0',
  },
}

export default (costTotal, profitTotal, profitPercent, exchange_sale, mode = 'dark') => {
  const savingsTotal = costTotal + profitTotal
  const savingsTotalTH = savingsTotal * exchange_sale
  const profitTotalTH = profitTotal * exchange_sale

  const color = colorMode[mode]

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
              color: color.title,
            },
            {
              type: 'text',
              text: new Date().toISOString().substring(0, 10),
              color: color.muted,
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
          color: color.separator,
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
                  color: color.text,
                  flex: 4,
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: formatMoney(savingsTotal, 'USD'),
                  size: 'xs',
                  color: color.text,
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
                  color: color.muted,
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
                  color: color.highlight,
                  flex: 4,
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: `(${formatMoney(profitPercent)}%)`,
                  size: 'xxs',
                  color: color.highlight,
                  offsetTop: 'xs',
                  align: 'end',
                  flex: 5,
                },
                {
                  type: 'text',
                  text: formatMoney(profitTotal, 'USD'),
                  size: 'xs',
                  color: color.highlight,
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
                  color: color.muted,
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
        backgroundColor: color.background,
      },
      footer: {
        separator: true,
      },
    },
  }
}
