import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { sql } from 'drizzle-orm'

import { cinemaShowing } from '../../../provider/schema.js'

dayjs.extend(weekOfYear)

const upsertCinemaMovie = async (db, body) => {
  if (!body.length) return
  for (let i = 0; i < body.length; i += 10) {
    const chunk = body.slice(i, i + 10)
    const values = chunk.map((cinema) => ({
      nTime: cinema.time,
      nWeek: dayjs(cinema.release).week(),
      nYear: dayjs(cinema.release).year(),
      oTheater: cinema.theater,
      sBind: cinema.bind,
      sCover: cinema.theater.sf?.cover || cinema.theater.major.cover,
      sDisplay: cinema.display,
      sGenre: cinema.genre,
      sNameEn: cinema.name_en,
      sNameTh: cinema.name_th,
      sUrl: cinema.theater.sf?.url || cinema.theater.major.url,
      tRelease: new Date(cinema.release),
    }))

    await db
      .insert(cinemaShowing)
      .values(values)
      .onConflictDoUpdate({
        set: {
          nTime: sql`EXCLUDED.n_time`,
          nWeek: sql`EXCLUDED.n_week`,
          nYear: sql`EXCLUDED.n_year`,
          oTheater: sql`"stash"."cinema_showing".o_theater || EXCLUDED.o_theater`,
          sCover: sql`EXCLUDED.s_cover`,
          sDisplay: sql`EXCLUDED.s_display`,
          sGenre: sql`EXCLUDED.s_genre`,
          sNameEn: sql`EXCLUDED.s_name_en`,
          sNameTh: sql`EXCLUDED.s_name_th`,
          sUrl: sql`EXCLUDED.s_url`,
          tRelease: sql`EXCLUDED.t_release`,
        },
        target: [cinemaShowing.sBind, cinemaShowing.nWeek, cinemaShowing.nYear],
      })
  }
}

const handleDuplicates = (cinemaRows) => {
  const mergeKey = []
  const uniqueKey = []
  const seen = new Set()

  for (const row of cinemaRows) {
    const isDuplicate = seen.has(row.name_en) || seen.has(row.name_th)
    if (isDuplicate) {
      const existing = uniqueKey.find((e) => e.name_en === row.name_en || e.name_th === row.name_th)
      if (existing) {
        existing.theater = Object.assign(existing.theater, row.theater)
      }
      mergeKey.push(row)
    } else {
      seen.add(row.name_en)
      seen.add(row.name_th)
      uniqueKey.push(row)
    }
  }
  // for (const entry of uniqueUpsert) {
  //   if (deleteBindKey.includes(entry.bind)) deleteBindKey.splice(deleteBindKey.indexOf(entry.bind), 1)
  // }

  return { mergeKey, uniqueKey }
}

export default async ({ body, db, logger }) => {
  try {
    await upsertCinemaMovie(db, body)

    const duplica = await db.execute(sql`
      WITH duplicate AS (
        SELECT s_name_en name FROM "stash"."cinema_showing"
        GROUP BY s_name_en, n_week, n_year HAVING COUNT(*) > 1
        UNION ALL 
        SELECT s_name_th name FROM "stash"."cinema_showing"
        GROUP BY s_name_th, n_week, n_year HAVING COUNT(*) > 1
      )
      SELECT
        c.s_bind bind, c.s_name_en name_en, c.s_name_th name_th, c.s_display display, c.t_release release, c.s_genre genre, c.n_week week,
        c.n_year "year", c.n_time "time", c.s_url url, c.s_cover cover, c.o_theater theater 
      FROM duplicate d
      LEFT JOIN "stash"."cinema_showing" c ON c.s_name_en = d.name OR c.s_name_th = d.name;  
    `)

    const { mergeKey, uniqueKey } = handleDuplicates(duplica)
    logger.info(`Remove duplicate ${mergeKey.length} keys.`)
    if (mergeKey.length > 0) {
      for await (const cinema of mergeKey) {
        await db.execute(
          sql`DELETE FROM "stash"."cinema_showing" WHERE n_week = ${cinema.week} AND n_year = ${cinema.year} AND s_bind = ${cinema.bind}`,
        )
      }
    }

    await upsertCinemaMovie(db, uniqueKey)

    return new Response(null, { status: 201 })
  } catch (ex) {
    logger.error(ex)
    return new Response(JSON.stringify({ error: ex.toString() }), { status: 500 })
  }
}
