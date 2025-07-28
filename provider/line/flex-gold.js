import numeral from 'numeral'

const formatMoney = (val, postfix) => `${numeral(val).format('0,0.00')}${postfix ? ` ${postfix}` : ''}`

const colorMode = {
  dark: {
    background: '#1E1E1E',
    highlight: '#1DB446',
    muted: '#AAAAAA',
    separator: '#444444',
    text: '#DDDDDD',
    title: '#ffc107',
  },
  light: {
    background: '#F7F7F7',
    highlight: '#1DB446',
    muted: '#ababab',
    separator: '#E0E0E0',
    text: '#111111',
    title: '#ffc107',
  },
}

export default (costTotal, profitTotal, profitPercent, exchange_sale, mode = 'dark') => {
  const savingsTotal = costTotal + profitTotal
  const savingsTotalTH = savingsTotal * exchange_sale
  const profitTotalTH = profitTotal * exchange_sale

  const color = colorMode[mode]

  return {
    body: {
      contents: [
        {
          contents: [
            {
              color: color.title,
              margin: 'none',
              size: 'sm',
              text: '🪙 ราคาทองคำ',
              type: 'text',
              weight: 'bold',
            },
            {
              align: 'end',
              color: color.muted,
              offsetTop: 'sm',
              size: 'xxs',
              text: new Date().toISOString().substring(0, 10),
              type: 'text',
            },
          ],
          layout: 'horizontal',
          margin: 'md',
          spacing: 'xs',
          type: 'box',
        },
        {
          color: color.separator,
          margin: 'sm',
          type: 'separator',
        },
        {
          contents: [
            {
              contents: [
                {
                  color: color.text,
                  flex: 4,
                  size: 'xs',
                  text: 'มูลค่าทองคำรวม',
                  type: 'text',
                  weight: 'bold',
                },
                {
                  align: 'end',
                  color: color.text,
                  flex: 4,
                  size: 'xs',
                  text: formatMoney(savingsTotal, 'USD'),
                  type: 'text',
                },
              ],
              layout: 'horizontal',
              margin: 'none',
              paddingStart: 'md',
              type: 'box',
            },
            {
              contents: [
                {
                  align: 'end',
                  color: color.muted,
                  size: 'xxs',
                  text: `(${formatMoney(savingsTotalTH, 'บาท')})`,
                  type: 'text',
                },
              ],
              layout: 'horizontal',
              paddingStart: 'md',
              type: 'box',
            },
            {
              contents: [
                {
                  color: color.highlight,
                  flex: 4,
                  size: 'xs',
                  text: 'กำไร',
                  type: 'text',
                  weight: 'bold',
                },
                {
                  align: 'end',
                  color: color.highlight,
                  flex: 5,
                  offsetTop: 'xs',
                  size: 'xxs',
                  text: `(${formatMoney(profitPercent)}%)`,
                  type: 'text',
                },
                {
                  align: 'end',
                  color: color.highlight,
                  flex: 5,
                  size: 'xs',
                  text: formatMoney(profitTotal, 'USD'),
                  type: 'text',
                },
              ],
              layout: 'horizontal',
              margin: 'md',
              paddingStart: 'md',
              type: 'box',
            },
            {
              contents: [
                {
                  align: 'end',
                  color: color.muted,
                  size: 'xxs',
                  text: `(${formatMoney(profitTotalTH, 'บาท')})`,
                  type: 'text',
                },
              ],
              layout: 'horizontal',
              paddingStart: 'md',
              type: 'box',
            },
          ],
          layout: 'vertical',
          margin: 'md',
          spacing: 'none',
          type: 'box',
        },
      ],
      layout: 'vertical',
      margin: 'none',
      paddingAll: 'none',
      paddingBottom: 'md',
      paddingEnd: 'md',
      paddingStart: 'md',
      paddingTop: 'sm',
      spacing: 'none',
      type: 'box',
    },
    size: 'mega',
    styles: {
      body: {
        backgroundColor: color.background,
      },
      footer: {
        separator: true,
      },
    },
    type: 'bubble',
  }
}
