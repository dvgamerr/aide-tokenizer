import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(weekOfYear)

const upsertCinemaMovie = async (db, body) => {
  if (!body.length) return
  for (let i = 0; i < body.length; i += 10) {
    const chunk = body.slice(i, i + 10)
    const values = chunk.flatMap((cinema) => [
      cinema.name_en,
      cinema.name_th,
      cinema.bind,
      cinema.display,
      cinema.release,
      cinema.genre,
      dayjs(cinema.release).week(),
      dayjs(cinema.release).year(),
      cinema.time,
      cinema.theater.sf?.url || cinema.theater.major.url,
      cinema.theater.sf?.cover || cinema.theater.major.cover,
      cinema.theater,
    ])

    const setInsert = (_, i) =>
      `($${i * 12 + 1}, $${i * 12 + 2}, $${i * 12 + 3}, $${i * 12 + 4}, $${i * 12 + 5}, $${i * 12 + 6}, $${i * 12 + 7}, $${i * 12 + 8}, $${i * 12 + 9}, $${i * 12 + 10}, $${i * 12 + 11}, $${i * 12 + 12})`
    const quertInsert = `
    INSERT INTO "stash"."cinema_showing"
    (s_name_en, s_name_th, s_bind, s_display, t_release, s_genre, n_week, n_year, n_time, s_url, s_cover, o_theater)
    VALUES
    ${chunk.map(setInsert).join(', ')}
    ON CONFLICT (s_bind, n_week, n_year)
    DO UPDATE SET
      s_name_en = EXCLUDED.s_name_en,
      s_name_th = EXCLUDED.s_name_th,
      s_display = EXCLUDED.s_display,
      t_release = EXCLUDED.t_release,
      s_genre = EXCLUDED.s_genre,
      n_week = EXCLUDED.n_week,
      n_year = EXCLUDED.n_year,
      n_time = EXCLUDED.n_time,
      s_url = EXCLUDED.s_url,
      s_cover = EXCLUDED.s_cover,
      o_theater = "stash"."cinema_showing".o_theater || EXCLUDED.o_theater
    `
    await db.query(quertInsert, values)
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

  return { uniqueKey, mergeKey }
}

export default async ({ db, body, logger }) => {
  try {
    await upsertCinemaMovie(db, body)

    const duplica = await db.query(`
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

    const { uniqueKey, mergeKey } = handleDuplicates(duplica.rows)
    logger.info(`Remove duplicate ${mergeKey.length} keys.`)
    if (mergeKey.length > 0) {
      for await (const cinema of mergeKey) {
        await db.query(`DELETE FROM "stash"."cinema_showing" WHERE n_week = $1 AND n_year = $2 AND s_bind = $3`, [
          cinema.week,
          cinema.year,
          cinema.bind,
        ])
      }
    }

    await upsertCinemaMovie(db, uniqueKey)

    return new Response(null, { status: 201 })
  } catch (ex) {
    logger.log(ex)
    return new Response(JSON.stringify({ error: ex.toString() }), { status: 500 })
  }
}
