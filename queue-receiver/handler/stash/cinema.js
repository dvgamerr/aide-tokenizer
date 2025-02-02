import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(weekOfYear)

export default async ({ db, body }) => {
  try {
    const values = body.flatMap((cinema) => [
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
    await db.query(
      `
      INSERT INTO "stash"."cinema_showing"
      (s_name_en, s_name_th, s_bind, s_display, t_release, s_genre, n_week, n_year, n_time, s_url, s_cover, o_theater)
      VALUES
      ${body.map(setInsert).join(', ')}
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
        o_theater = EXCLUDED.o_theater
      `,
      values,
    )
    return new Response(null, { status: 201 })
  } catch (ex) {
    console.log(ex)
    return new Response(JSON.stringify({ error: ex.toString() }), { status: 500 })
  }
}

// {
//   "name": "g-i-dle-world-tour-idol-in-cinemas",
//   "display": "[G]I-DLE WORLD TOUR [iDOL] IN CINEMAS",
//   "genre": "Music",
//   "time": 102,
//   "release": "2025-01-28T17:00:00.000Z",
//   "theater": {
//     "major": {
//       "cover": "https://cdn.majorcineplex.com/uploads/movie/4486/thumb_4486.jpg",
//       "url": "https://www.majorcineplex.com/movie/g-i-dle-world-tour-idol-in-cinemas"
//     },
//     "sf": {
//       "cover": "https://lh3.googleusercontent.com/GpEdraIPw-n4v4HN7CdsoR1rWCkTklLEOB4cdfce1AfUeYrrH3PC5nElT9_BZru_EswInI5PXQOjxzRxz-1lnqCZBNNB6pTZt1Y=w215",
//       "url": "https://www.sfcinemacity.com/movie/%5BG%5DI-DLE-WORLD-TOUR-%5BiDOL%5D-IN-CINEMAS.HO00002406"
//     }
//   }
// },
// {
//   "name": "lembayung",
//   "display": "Lembayung",
//   "genre": "Horror, Thriller",
//   "time": 123,
//   "release": "2025-01-28T17:00:00.000Z",
//   "theater": {
//     "major": {
//       "cover": "https://cdn.majorcineplex.com/uploads/movie/4405/thumb_4405.jpg",
//       "url": "https://www.majorcineplex.com/movie/lembayung"
//     },
//     "sf": {
//       "cover": "https://lh3.googleusercontent.com/RjdL9FntlgyPRO8ziaUChmyLkbHxikR3Bb0zr6Qqrf9v_Wd7SoWlCwvNBMo8PbqjtyIwgm8fu8fTa26fhgGI4VAcID-uBdUxOA=w215",
//       "url": "https://www.sfcinemacity.com/movie/Lembayung.HO00002343"
//     }
//   }
// }
