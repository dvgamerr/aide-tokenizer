import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm'

import { cinemaShowing } from '../../../provider/schema.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)

export default async ({ db, query }) => {
  const { genre, release_date, search, week, year } = query
  const conditions = []

  if (search) {
    conditions.push(or(ilike(cinemaShowing.sNameEn, `%${search}%`), ilike(cinemaShowing.sNameTh, `%${search}%`)))
  } else if (release_date) {
    if (!release_date.match(/^\d{4}-\d{2}-\d{2}$/) || !dayjs(release_date).isValid()) {
      throw { message: 'Invalid release_date', status: 400 }
    }
    conditions.push(eq(cinemaShowing.tRelease, release_date))
  } else if (week || year) {
    if (week) conditions.push(eq(cinemaShowing.nWeek, week))
    if (year) conditions.push(eq(cinemaShowing.nYear, year))
  }

  if (genre) {
    conditions.push(ilike(cinemaShowing.sGenre, `%${genre}%`))
  }

  if (conditions.length === 0 || (!search && genre)) {
    conditions.push(eq(cinemaShowing.nWeek, dayjs().week()))
    conditions.push(eq(cinemaShowing.nYear, dayjs().year()))
  }

  const results = await db
    .select({
      nTime: cinemaShowing.nTime,
      oTheater: cinemaShowing.oTheater,
      sCover: cinemaShowing.sCover,
      sDisplay: cinemaShowing.sDisplay,
      sGenre: cinemaShowing.sGenre,
      sUrl: cinemaShowing.sUrl,
      tRelease: cinemaShowing.tRelease,
    })
    .from(cinemaShowing)
    .where(and(...conditions))
    .orderBy(desc(cinemaShowing.tRelease), asc(cinemaShowing.sDisplay))

  return results.map((row) => ({
    ...row,
    o_theater: Object.keys(row.oTheater),
    t_release: dayjs(row.tRelease).tz('Asia/Bangkok').format('YYYY-MM-DD'),
  }))
}
