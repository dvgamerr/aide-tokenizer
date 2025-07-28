import { getAuthAPIKey } from '../../provider/helper'
import queue from '../../provider/queue'

export default async ({ body, db, headers, logger, query, store }) => {
  const traceId = store?.traceId
  const { apiKey, botName } = getAuthAPIKey(headers)
  const text = query.text || body.text

  try {
    if (!apiKey) {
      return new Response(null, { status: 401 })
    }

    if (!text && !body.messages?.length && !body.contents) {
      return new Response(null, { status: 400 })
    }
    const tokens = (JSON.stringify(body).length / 3.75).toFixed(0)
    logger.info(`[${traceId}] [${botName}] ${tokens} tokens.`)

    const noticeQuery = `
      SELECT
        n.access_token, u.chat_id, n.proxy,
        coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
      FROM line_users u
      INNER JOIN line_notice n ON n.name = u.notice_name
      WHERE u.active = 't'  AND u.notice_name = $1 AND u.api_key = $2 AND lower(provider) = 'line'
    `
    const notice = await db.query(noticeQuery, [botName, apiKey])

    if (!notice.rowCount) {
      return new Response(null, { status: 401 })
    }

    const { access_token: accessToken, chat_id: chatId, display_name: displayName, proxy: proxyConfig } = notice.rows[0]
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
  } catch (ex) {
    logger.error(`[${botName}] ${ex.toString()}`)
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 201 })
}
