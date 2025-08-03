import { reminder } from '../../../provider/schema.js'

export default async ({ body, db }) => {
  // Use Drizzle ORM for upsert operation
  await db
    .insert(reminder)
    .values({ name: 'gold', note: body })
    .onConflictDoUpdate({ set: { note: body }, target: reminder.name })

  return { success: true }
}
