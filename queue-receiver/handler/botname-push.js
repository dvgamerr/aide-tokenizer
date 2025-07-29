import { sql } from 'drizzle-orm'

import { getAuthAPIKey } from '../../provider/helper'
import queue from '../../provider/queue'

export default async ({ body, db, headers, logger, query, store }) => {
  const traceId = store?.traceId
  const { apiKey, botName } = getAuthAPIKey(headers)
  const text = query.text || body.text

  try {
    if (!apiKey) {
      logger.warn(`[${traceId}] Missing API key`)
      return new Response(null, { status: 401 })
    }

    if (!text && !body.messages?.length && !body.contents) {
      logger.warn(`[${traceId}] [${botName}] Missing message content`)
      return new Response(null, { status: 400 })
    }

    const tokens = (JSON.stringify(body).length / 3.75).toFixed(0)
    const [user] = await db.execute(sql`
      SELECT
        n.access_token, 
        u.chat_id, 
        n.proxy,
        coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
      FROM line_users u
      INNER JOIN line_notice n ON n.name = u.notice_name
      WHERE u.active = 't' 
        AND u.notice_name = ${botName} 
        AND u.api_key = ${apiKey} 
        AND lower(provider) = 'line'
    `)

    if (!user) {
      logger.warn(`[${traceId}] [${botName}] No active users found for API key`)
      return new Response(null, { status: 401 })
    }

    const { access_token: accessToken, chat_id: chatId, display_name: displayName, proxy: proxyConfig } = user
    const messages = body.messages ? body.messages : [text ? { text, type: 'text' } : body]
    await queue.send(
      {
        accessToken,
        botName,
        chatId,
        displayName,
        proxyConfig,
        sessionId: null,
      },
      messages,
    )

    logger.info(`[${traceId}] [${botName}] Message queued for ${displayName} (${tokens} tokens)`)
  } catch (error) {
    logger.error(`[${traceId}] [${botName}] Error: ${error.message}`, { error })
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 201 })
}
