import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const mangaTypeEnum = pgEnum('manga_type', ['manga', 'manhwa', 'doujin'])
export const mangaLangEnum = pgEnum('manga_lang', ['TH', 'EN', 'CH', 'JP', 'KR'])

export const stashSchema = pgSchema('stash')

export const reminder = pgTable('reminder', {
  name: varchar('name', { length: 20 }).primaryKey(),
  note: jsonb('note').default('{}').notNull(),
})

export const lineNotice = pgTable('line_notice', {
  accessToken: varchar('access_token', { length: 200 }).notNull(),
  clientSecret: varchar('client_secret', { length: 50 }),
  name: varchar('name', { length: 20 }).primaryKey(),
  provider: varchar('provider', { length: 10 }).notNull(),
  proxy: jsonb('proxy'),
})

export const lineSessions = pgTable(
  'line_sessions',
  {
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    noticeName: varchar('notice_name', { length: 20 })
      .notNull()
      .references(() => lineNotice.name),
    sessionId: uuid('session_id').defaultRandom(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.noticeName] })],
)

export const lineUsers = pgTable(
  'line_users',
  {
    active: boolean('active').default(false).notNull(),
    admin: boolean('admin').default(false).notNull(),
    apiKey: uuid('api_key').defaultRandom().notNull(),
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    noticeName: varchar('notice_name', { length: 20 })
      .notNull()
      .references(() => lineNotice.name),
    profile: jsonb('profile').default('{}'),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.noticeName] }), index('line_users_api_key_unique').on(table.apiKey)],
)

export const cinemaShowing = stashSchema.table(
  'cinema_showing',
  {
    nTime: integer('n_time').default(0).notNull(),
    nWeek: integer('n_week').notNull(),
    nYear: integer('n_year').notNull(),
    oTheater: jsonb('o_theater').default('[]').notNull(),
    sBind: varchar('s_bind', { length: 200 }),
    sCover: text('s_cover').notNull(),
    sDisplay: text('s_display').notNull(),
    sGenre: varchar('s_genre', { length: 40 }).notNull(),
    sNameEn: text('s_name_en').notNull(),
    sNameTh: text('s_name_th').notNull(),
    sUrl: text('s_url').notNull(),
    tRelease: timestamp('t_release', { withTimezone: true }).notNull(),
  },
  (table) => [unique('uq_cinema_name').on(table.sBind, table.nWeek, table.nYear)],
)

export const mangaCollection = stashSchema.table(
  'manga_collection',
  {
    bTranslate: boolean('b_translate').default(false).notNull(),
    eLang: mangaLangEnum('e_lang').default('TH').notNull(),
    eType: mangaTypeEnum('e_type').default('manga').notNull(),
    nTotal: integer('n_total').default(0).notNull(),
    oImage: jsonb('o_image').default('[]').notNull(),
    sName: varchar('s_name', { length: 255 }).notNull(),
    sThumbnail: varchar('s_thumbnail', { length: 200 }).notNull(),
    sTitle: text('s_title').notNull(),
    sUrl: text('s_url').notNull(),
  },
  (table) => [unique('uq_manga_url').on(table.sUrl)],
)

export const gold = stashSchema.table(
  'gold',
  {
    tin: numeric('tin').default('0'),
    tinIco: varchar('tin_ico', { length: 4 }),
    tout: numeric('tout').default('0'),
    toutIco: varchar('tout_ico', { length: 4 }),
    updateAt: timestamp('update_at', { withTimezone: true }).defaultNow(),
    usdBuy: numeric('usd_buy').default('0'),
    usdSale: numeric('usd_sale').default('0'),
  },
  (table) => [index('uq_update_at').on(table.updateAt)],
)
