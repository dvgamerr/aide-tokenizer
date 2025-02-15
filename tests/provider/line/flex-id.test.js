import { describe, it, expect } from 'bun:test'
import flexId from '../../../provider/line/flex-id'

describe('flexId', () => {
  const Id = '12345'

  it('should return the correct bubble structure', () => {
    const result = flexId(Id)

    expect(result).toEqual({
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: 'ID : ',
            weight: 'bold',
            color: '#1DB446',
            size: 'xs',
            flex: 1,
          },
          {
            type: 'text',
            text: Id,
            size: 'xs',
            color: '#aaaaaa',
            wrap: true,
            weight: 'bold',
            flex: 10,
          },
        ],
        paddingTop: 'sm',
        paddingBottom: 'sm',
        justifyContent: 'center',
        paddingStart: 'lg',
        paddingEnd: 'none',
        action: {
          type: 'postback',
          label: 'action',
          data: '[ID]',
          displayText: Id,
        },
      },
      styles: {
        footer: {
          separator: true,
        },
      },
    })
  })
})
