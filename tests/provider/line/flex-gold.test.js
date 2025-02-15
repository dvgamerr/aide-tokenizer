import { describe, it, expect } from 'bun:test'
import flexGold from '../../../provider/line/flex-gold'

describe('flexGold', () => {
  const costTotal = 1000
  const profitTotal = 200
  const profitPercent = 20
  const exchange_sale = 30

  it('should return the correct bubble structure', () => {
    const result = flexGold(costTotal, profitTotal, profitPercent, exchange_sale)
    console.log(result.body.contents.length)
    expect(result.body.contents).toBeInstanceOf(Array)
    expect(result.body.contents).toHaveLength(3)
  })
})
