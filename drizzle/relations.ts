import { relations } from 'drizzle-orm/relations'
import { lineNotice, lineSessions, lineUsers } from './schema'

export const lineSessionsRelations = relations(lineSessions, ({ one }) => ({
  lineNotice: one(lineNotice, {
    fields: [lineSessions.noticeName],
    references: [lineNotice.name],
  }),
}))

export const lineNoticeRelations = relations(lineNotice, ({ many }) => ({
  lineSessions: many(lineSessions),
  lineUsers: many(lineUsers),
}))

export const lineUsersRelations = relations(lineUsers, ({ one }) => ({
  lineNotice: one(lineNotice, {
    fields: [lineUsers.noticeName],
    references: [lineNotice.name],
  }),
}))
