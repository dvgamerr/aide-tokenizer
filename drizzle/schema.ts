import { pgTable, varchar, jsonb, foreignKey, primaryKey, uuid, timestamp, index, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const mangaLang = pgEnum('manga_lang', ['TH', 'EN', 'CH', 'JP', 'KR'])
export const mangaType = pgEnum('manga_type', ['manga', 'manhwa', 'doujin'])
export const tLang = pgEnum('t_lang', ['TH', 'EN', 'NA'])

export const reminder = pgTable('reminder', {
  name: varchar({ length: 20 }).primaryKey().notNull(),
  note: jsonb().default({}).notNull(),
})

export const lineNotice = pgTable('line_notice', {
  name: varchar({ length: 20 }).primaryKey().notNull(),
  provider: varchar({ length: 10 }).notNull(),
  accessToken: varchar('access_token', { length: 200 }).notNull(),
  clientSecret: varchar('client_secret', { length: 50 }),
  proxy: jsonb(),
})

export const lineSessions = pgTable(
  'line_sessions',
  {
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    noticeName: varchar('notice_name', { length: 20 }).notNull(),
    sessionId: uuid('session_id').defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.noticeName],
      foreignColumns: [lineNotice.name],
      name: 'line_sessions_notice_name_line_notice_name_fk',
    }),
    primaryKey({ columns: [table.chatId, table.noticeName], name: 'line_sessions_chat_id_notice_name_pk' }),
  ],
)

export const lineUsers = pgTable(
  'line_users',
  {
    chatId: varchar('chat_id', { length: 36 }).notNull(),
    noticeName: varchar('notice_name', { length: 20 }).notNull(),
    apiKey: uuid('api_key').defaultRandom().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    active: boolean().default(false).notNull(),
    admin: boolean().default(false).notNull(),
    profile: jsonb().default({}),
    language: tLang().default('NA').notNull(),
  },
  (table) => [
    index('line_users_api_key_unique').using('btree', table.apiKey.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.noticeName],
      foreignColumns: [lineNotice.name],
      name: 'line_users_notice_name_line_notice_name_fk',
    }),
    primaryKey({ columns: [table.chatId, table.noticeName], name: 'line_users_chat_id_notice_name_pk' }),
  ],
)
