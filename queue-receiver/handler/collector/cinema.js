export default async ({ db, body }) => {
  const values = body.flatMap((cinema) => [
    cinema.name,
    cinema.name,
    cinema.display,
    cinema.release,
    cinema.genre,
    cinema.week,
    cinema.year,
    cinema.time,
    cinema.url,
    cinema.cover,
    cinema.theater,
  ])

  try {
    await db.query(
      `
    INSERT INTO "stash"."cinema_showing"
    (s_name, s_bind, s_display, t_release, s_genre, n_week, n_year, n_time, s_url, s_cover, o_theater)
    VALUES
    ${values.map((_, i) => `($${i * 11 + 1}, $${i * 11 + 2}, $${i * 11 + 3}, $${i * 11 + 4}, $${i * 11 + 5}, $${i * 11 + 6}, $${i * 11 + 7}, $${i * 11 + 8}, $${i * 11 + 9}, $${i * 11 + 10}, $${i * 11 + 11})`).join(', ')}
  `,
      values,
    )
    return new Response(null, { status: 201 })
  } catch (ex) {
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
