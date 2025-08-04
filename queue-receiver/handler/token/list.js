import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { eq } from 'drizzle-orm'

import { apiKeys } from '../../../provider/schema.js'

dayjs.extend(relativeTime)

export async function handlerListTokens({ db }) {
  const activeTokens = await db
    .select({
      apiKey: apiKeys.apiKey,
      createdAt: apiKeys.createdAt,
      description: apiKeys.description,
      updatedAt: apiKeys.updatedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.isActive, true))

  console.log(activeTokens)

  return activeTokens.map((token) => ({
    ...token,
    updatedAt: dayjs(token.updatedAt).fromNow(),
  }))
}
