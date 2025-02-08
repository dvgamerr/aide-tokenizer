import { t } from 'elysia'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)

class SQLQueryBuilder {
  constructor(table, columns) {
    this.table = table
    this.columns = columns
    this.values = []
    this.where = []
  }

  add(condition, value) {
    this.values.push(value)
    this.where.push(condition.replace(/\?/gi, `$${this.values.length}`))
  }

  build(extra) {
    const query = `
      SELECT ${this.columns}
      FROM ${this.table}
      WHERE ${this.where.length ? `${this.where.join(' AND ')}` : ''}
      ${extra}
    `
    return [query, this.values]
  }
}

export default [
  async ({ db, query }) => {
    const { search, release_date, week, year, genre } = query
    const sqlBuilder = new SQLQueryBuilder('stash.cinema_showing ', 's_display, t_release, s_genre, n_time, s_url, s_cover, o_theater')

    if (search) {
      sqlBuilder.add(`(LOWER(s_name_en) LIKE LOWER(?) OR LOWER(s_name_th) LIKE LOWER(?))`, `%${search}%`)
    } else if (release_date) {
      if (!release_date.match(/^\d{4}-\d{2}-\d{2}$/) || !dayjs(release_date).isValid())
        throw { status: 400, message: 'Invalid release_date' }

      sqlBuilder.add(`t_release AT TIME ZONE 'Asia/Bangkok' = ?`, release_date)
    } else if (week || year) {
      sqlBuilder.add(`n_week = ?`, week)
      sqlBuilder.add(`n_year = ?`, year)
    }

    if (genre) {
      sqlBuilder.add(`s_genre LIKE ?`, `%${genre}%`)
    }

    if (sqlBuilder.values.length === 0 || (!search && genre)) {
      sqlBuilder.add(`n_week = ?`, dayjs().week())
      sqlBuilder.add(`n_year = ?`, dayjs().year())
    }

    const cinemaResults = await db.query(...sqlBuilder.build('ORDER BY t_release DESC, s_display ASC'))
    return (
      cinemaResults.rows.map((row) => {
        row.t_release = dayjs(row.t_release).tz('Asia/Bangkok').format('YYYY-MM-DD')
        row.o_theater = Object.keys(row.o_theater)
        return row
      }) || []
    )
  },
  {
    query: t.Object({
      search: t.Optional(t.String()),
      release_date: t.Optional(t.String()),
      genre: t.Optional(t.String()),
      week: t.Optional(t.Number()),
      year: t.Optional(t.Number()),
    }),
  },
]
