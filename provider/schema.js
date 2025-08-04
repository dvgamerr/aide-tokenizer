/* eslint-disable perfectionist/sort-objects */
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const lineNotice = pgTable('line_notice', {
  name: varchar('name', { length: 20 }).primaryKey(),
  accessToken: varchar('access_token', { length: 200 }).notNull(),
  clientSecret: varchar('client_secret', { length: 50 }),
  provider: varchar('provider', { length: 10 }).notNull(),
  proxy: jsonb('proxy'),
})

export const lineSessions = pgTable(
  'line_sessions',
  {
    noticeName: varchar('notice_name', { length: 20 })
      .notNull()
      .references(() => lineNotice.name),
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    sessionId: uuid('session_id').defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.noticeName] })],
)

export const lineUsers = pgTable(
  'line_users',
  {
    noticeName: varchar('notice_name', { length: 20 })
      .notNull()
      .references(() => lineNotice.name),
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    apiKey: uuid('api_key').defaultRandom().notNull(),
    active: boolean('active').default(false).notNull(),
    admin: boolean('admin').default(false).notNull(),
    profile: jsonb('profile').default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.noticeName] }), index('line_users_api_key_unique').on(table.apiKey)],
)

export const apiKeys = pgTable('api_keys', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  description: varchar('description', { length: 255 }),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const reminder = pgTable('reminder', {
  name: varchar('name', { length: 20 }).primaryKey(),
  note: jsonb('note').default('{}').notNull(),
})

// export const mangaTypeEnum = pgEnum('manga_type', ['manga', 'manhwa', 'doujin'])
// export const mangaLangEnum = pgEnum('manga_lang', ['TH', 'EN', 'CH', 'JP', 'KR'])

export const stashSchema = pgSchema('stash')

export const cinemaShowing = stashSchema.table(
  'cinema_showing',
  {
    sBind: varchar('s_bind', { length: 200 }),
    sDisplay: text('s_display').notNull(),
    sNameEn: text('s_name_en').notNull(),
    sNameTh: text('s_name_th').notNull(),
    sUrl: text('s_url').notNull(),
    nTime: integer('n_time').default(0).notNull(),
    nWeek: integer('n_week').notNull(),
    nYear: integer('n_year').notNull(),
    oTheater: jsonb('o_theater').default('[]').notNull(),
    sCover: text('s_cover').notNull(),
    sGenre: varchar('s_genre', { length: 40 }).notNull(),
    tRelease: timestamp('t_release', { withTimezone: true }).notNull(),
  },
  (table) => [unique('uq_cinema_name').on(table.sBind, table.nWeek, table.nYear)],
)

// export const mangaCollection = stashSchema.table(
//   'manga_collection',
//   {
//     bTranslate: boolean('b_translate').default(false).notNull(),
//     eLang: mangaLangEnum('e_lang').default('TH').notNull(),
//     eType: mangaTypeEnum('e_type').default('manga').notNull(),
//     nTotal: integer('n_total').default(0).notNull(),
//     oImage: jsonb('o_image').default('[]').notNull(),
//     sName: varchar('s_name', { length: 255 }).notNull(),
//     sThumbnail: varchar('s_thumbnail', { length: 200 }).notNull(),
//     sTitle: text('s_title').notNull(),
//     sUrl: text('s_url').notNull(),
//   },
//   (table) => [unique('uq_manga_url').on(table.sUrl)],
// )

export const gold = stashSchema.table(
  'gold',
  {
    tin: numeric('tin').default('0'),
    tinIco: varchar('tin_ico', { length: 4 }),
    tout: numeric('tout').default('0'),
    toutIco: varchar('tout_ico', { length: 4 }),
    usdBuy: numeric('usd_buy').default('0'),
    usdSale: numeric('usd_sale').default('0'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('uq_updated_at').on(table.updatedAt)],
)

export const lottery = stashSchema.table('lottery', {
  draw: date('draw').primaryKey(),
  firstPrize: varchar('first_prize', { length: 6 }).notNull(),
  frontThree: varchar('front_three', { length: 3 }).array(),
  backThree: varchar('back_three', { length: 3 }).array(),
  backTwo: varchar('back_two', { length: 2 }).array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
