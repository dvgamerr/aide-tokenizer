import { t } from 'elysia'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(weekOfYear)

export default [
  async ({ db, query }) => {
    const { name_en, name_th, release_date } = query

    const filter = []
    const filterQuery = []
    let filterLimit = ''

    if (name_en) {
      filter.push(release_date)
      filterQuery.push(`s_name_en = $${filter.length}`)
    } else if (name_th) {
      filter.push(release_date)
      filterQuery.push(`s_name_th = $${filter.length}`)
    }
    if (release_date) {
      if (!release_date.match(/^\d{4}-\d{2}-\d{2}$/) || !dayjs(release_date).isValid())
        throw { status: 400, message: 'Invalid release_date' }

      filter.push(release_date)
      filterQuery.push(`t_release AT TIME ZONE 'Asia/Bangkok' = $${filter.length}`)
    }

    if (filter.length === 0) {
      filter.push(dayjs().week())
      filterQuery.push(`n_week = $${filter.length}`)

      filter.push(dayjs().year())
      filterQuery.push(`n_year = $${filter.length}`)
    }
    const sqlquery = `  
      SELECT s_display, t_release, s_genre, n_time, s_url, s_cover, o_theater
      FROM "stash"."cinema_showing" 
      WHERE ${filterQuery.length ? `${filterQuery.join(' AND ')}` : ''}
      ORDER BY t_release DESC, s_display ASC
      ${filterLimit}
    `

    const cinema = await db.query(sqlquery, filter)
    return (
      cinema.rows.map((e) => {
        e.o_theater = Object.keys(e.o_theater)
        return e
      }) || []
    )
  },
  {
    query: t.Object({
      name_en: t.Optional(t.String()),
      name_th: t.Optional(t.String()),
      release_date: t.Optional(t.String()),
    }),
  },
]
