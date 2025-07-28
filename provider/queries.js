import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

// Example usage of drizzle-orm with the database schema
import { pgClient } from './database.js'
import { cinemaShowing, gold, lineNotice, lineSessions, lineUsers, mangaCollection, reminder } from './schema.js'

// Example queries using drizzle-orm

// 1. Get all line users with their notice info
export const getUsersWithNotice = async () => {
  const db = await pgClient()
  return await db.select().from(lineUsers).leftJoin(lineNotice, eq(lineUsers.noticeName, lineNotice.name))
}

// 2. Find user by chat ID and notice name
export const findUser = async (chatId, noticeName) => {
  const db = await pgClient()
  return await db
    .select()
    .from(lineUsers)
    .where(and(eq(lineUsers.chatId, chatId), eq(lineUsers.noticeName, noticeName)))
    .limit(1)
}

// 3. Create new user
export const createUser = async (userData) => {
  const db = await pgClient()
  return await db.insert(lineUsers).values(userData).returning()
}

// 4. Update user profile
export const updateUserProfile = async (chatId, noticeName, profile) => {
  const db = await pgClient()
  return await db
    .update(lineUsers)
    .set({ profile })
    .where(and(eq(lineUsers.chatId, chatId), eq(lineUsers.noticeName, noticeName)))
    .returning()
}

// 5. Get latest cinema showing
export const getLatestCinema = async (limit = 10) => {
  const db = await pgClient()
  return await db.select().from(cinemaShowing).orderBy(desc(cinemaShowing.tRelease)).limit(limit)
}

// 6. Search manga by name or title
export const searchManga = async (searchTerm) => {
  const db = await pgClient()
  return await db
    .select()
    .from(mangaCollection)
    .where(or(ilike(mangaCollection.sName, `%${searchTerm}%`), ilike(mangaCollection.sTitle, `%${searchTerm}%`)))
}

// 7. Get latest gold prices
export const getLatestGoldPrice = async () => {
  const db = await pgClient()
  return await db.select().from(gold).orderBy(desc(gold.updateAt)).limit(1)
}

// 8. Count active users
export const countActiveUsers = async () => {
  const db = await pgClient()
  return await db.select({ count: count() }).from(lineUsers).where(eq(lineUsers.active, true))
}

// 9. Get or create reminder
export const getOrCreateReminder = async (name, note = {}) => {
  const db = await pgClient()

  // Try to get existing reminder
  const existing = await db.select().from(reminder).where(eq(reminder.name, name)).limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  // Create new reminder if not exists
  return await db.insert(reminder).values({ name, note }).returning()
}

// 10. Create session for user
export const createSession = async (chatId, noticeName) => {
  const db = await pgClient()
  return await db.insert(lineSessions).values({ chatId, noticeName }).returning()
}
