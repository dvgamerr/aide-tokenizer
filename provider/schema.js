import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  numeric,
  uuid,
  pgEnum,
  pgSchema,
  unique,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'

// Custom enums
export const mangaTypeEnum = pgEnum('manga_type', ['manga', 'manhwa', 'doujin'])
export const mangaLangEnum = pgEnum('manga_lang', ['TH', 'EN', 'CH', 'JP', 'KR'])
export const tLangEnum = pgEnum('t_lang', ['TH', 'EN', 'NA'])

// Stash schema
export const stashSchema = pgSchema('stash')

// Public schema tables
export const reminder = pgTable('reminder', {
  name: varchar('name', { length: 20 }).primaryKey(),
  note: jsonb('note').default('{}').notNull(),
})

export const lineNotice = pgTable('line_notice', {
  name: varchar('name', { length: 20 }).primaryKey(),
  provider: varchar('provider', { length: 10 }).notNull(),
  accessToken: varchar('access_token', { length: 200 }).notNull(),
  clientSecret: varchar('client_secret', { length: 50 }),
  proxy: jsonb('proxy'),
})

export const lineSessions = pgTable(
  'line_sessions',
  {
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    noticeName: varchar('notice_name', { length: 20 })
      .notNull()
      .references(() => lineNotice.name),
    sessionId: uuid('session_id').defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.noticeName] })],
)

export const lineUsers = pgTable(
  'line_users',
  {
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    noticeName: varchar('notice_name', { length: 20 })
      .notNull()
      .references(() => lineNotice.name),
    apiKey: uuid('api_key').defaultRandom().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    active: boolean('active').default(false).notNull(),
    admin: boolean('admin').default(false).notNull(),
    profile: jsonb('profile').default('{}'),
    language: tLangEnum('language').default('NA').notNull(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.noticeName] }), index('line_users_api_key_unique').on(table.apiKey)],
)

// Stash schema tables
export const cinemaShowing = stashSchema.table(
  'cinema_showing',
  {
    sBind: varchar('s_bind', { length: 200 }),
    sNameEn: text('s_name_en').notNull(),
    sNameTh: text('s_name_th').notNull(),
    sDisplay: text('s_display').notNull(),
    tRelease: timestamp('t_release', { withTimezone: true }).notNull(),
    sGenre: varchar('s_genre', { length: 40 }).notNull(),
    nWeek: integer('n_week').notNull(),
    nYear: integer('n_year').notNull(),
    nTime: integer('n_time').default(0).notNull(),
    sUrl: text('s_url').notNull(),
    sCover: text('s_cover').notNull(),
    oTheater: jsonb('o_theater').default('[]').notNull(),
  },
  (table) => [unique('uq_cinema_name').on(table.sBind, table.nWeek, table.nYear)],
)

export const mangaCollection = stashSchema.table(
  'manga_collection',
  {
    sName: varchar('s_name', { length: 255 }).notNull(),
    sTitle: text('s_title').notNull(),
    sUrl: text('s_url').notNull(),
    sThumbnail: varchar('s_thumbnail', { length: 200 }).notNull(),
    bTranslate: boolean('b_translate').default(false).notNull(),
    eType: mangaTypeEnum('e_type').default('manga').notNull(),
    eLang: mangaLangEnum('e_lang').default('TH').notNull(),
    nTotal: integer('n_total').default(0).notNull(),
    oImage: jsonb('o_image').default('[]').notNull(),
  },
  (table) => [unique('uq_manga_url').on(table.sUrl)],
)

export const gold = stashSchema.table(
  'gold',
  {
    tin: numeric('tin').default('0'),
    tout: numeric('tout').default('0'),
    tinIco: varchar('tin_ico', { length: 4 }),
    toutIco: varchar('tout_ico', { length: 4 }),
    usdSale: numeric('usd_sale').default('0'),
    usdBuy: numeric('usd_buy').default('0'),
    updateAt: timestamp('update_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('uq_update_at').on(table.updateAt)],
)
