import { sql } from 'drizzle-orm'

import { getAuthAPIKey } from '../../provider/helper'
import queue from '../../provider/queue'
import { BadRequestError } from '../middleware'

export default async ({ body, db, headers, logger, query, store }) => {
  const traceId = store?.traceId
  if (!headers?.authorization) {
    throw new BadRequestError(401, 'Missing API key')
  }

  const { apiKey, botName } = getAuthAPIKey(headers)
  const text = query.text || body?.text

  if (!apiKey) {
    throw new BadRequestError(401, 'Missing API key')
  }

  if (!body && !text) {
    throw new BadRequestError(400, 'Missing message content')
  }

  const tokens = (JSON.stringify(body || text).length / 3.75).toFixed(0)
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
    throw new BadRequestError(401, 'No active users found for API key')
  }

  const { access_token: accessToken, chat_id: chatId, display_name: displayName, proxy: proxyConfig } = user
  const messages = body?.messages ? body.messages : [text ? { text, type: 'text' } : body]
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

  return new Response(null, { status: 201 })
}
