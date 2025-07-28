import { describe, expect, it } from 'bun:test'
import dayjs from 'dayjs'

import generateCarousel from '../../../provider/line/flex-carousel'
import 'dayjs/locale/th'

describe('generateCarousel', () => {
  const movies = [
    {
      n_time: 120,
      o_theater: {
        major: { url: 'https://majorcineplex.com' },
        sf: { url: 'https://sfcinema.com' },
      },
      s_cover: 'https://example.com/poster.jpg',
      s_name_en: 'Movie Name',
      s_name_th: 'ชื่อหนัง',
      t_release: '2023-10-01',
    },
  ]

  it('should generate a carousel with correct structure', () => {
    const result = generateCarousel(movies)
    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(1)
    const bubble = result[0]
    expect(bubble).toHaveProperty('type', 'bubble')
    expect(bubble).toHaveProperty('size', 'kilo')
    expect(bubble.body).toHaveProperty('type', 'box')
    expect(bubble.body).toHaveProperty('layout', 'vertical')
  })

  it('should format the release date correctly', () => {
    const result = generateCarousel(movies)
    const releaseDate = dayjs(movies[0].t_release).locale('th').format('D MMMM YYYY')
    const dateText = result[0].body.contents[1].contents[1].text
    expect(dateText).toBe(releaseDate)
  })

  it('should generate correct poster structure', () => {
    const result = generateCarousel(movies)
    const poster = result[0].body.contents[0].contents
    expect(poster[0]).toHaveProperty('type', 'image')
    expect(poster[0]).toHaveProperty('url', movies[0].s_cover)
    expect(poster[1]).toHaveProperty('type', 'box')
    expect(poster[1].contents[0]).toHaveProperty('type', 'text')
    expect(poster[1].contents[0]).toHaveProperty('text', '🔗 Major')
  })

  it('should generate correct action URLs', () => {
    const result = generateCarousel(movies)
    const actionUrl = result[0].body.contents[1].action.uri
    const expectedUrl = encodeURI(
      `https://www.youtube.com/results?search_query=${movies[0].s_name_en.replace(/\W/gi, '+')}+Official+Trailer`,
    )
    expect(actionUrl).toBe(expectedUrl)
  })
})
