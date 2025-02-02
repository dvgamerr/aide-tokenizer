import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(weekOfYear)

export default async ({ db, body }) => {
  return { ok: true }
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
