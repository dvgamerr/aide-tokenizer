import { queueSend } from '../../provider/db'
import { getAuthAPIKey } from '../../provider/helper'

export default async ({ logger, db, headers, query, body }) => {
  const { botName, apiKey } = getAuthAPIKey(headers)
  const text = query.text || body.text

  try {
    if (!apiKey) {
      return new Response(null, { status: 401 })
    }

    if (!text && !body.messages?.length && !body.contents) {
      return new Response(null, { status: 400 })
    }
    const tokens = (JSON.stringify(body).length / 3.75).toFixed(0)
    logger.info(`[${botName}] ${tokens} tokens.`)

    const noticeQuery = `
      SELECT
        n.access_token, u.chat_id, n.proxy,
        coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
      FROM line_users u
      INNER JOIN line_notice n ON n.name = u.notice_name
      WHERE u.active = 't'  AND u.notice_name = $1 AND u.api_key = $2 AND provider = 'LINE'
    `
    const notice = await db.query(noticeQuery, [botName, apiKey])

    if (!notice.rowCount) {
      return new Response(null, { status: 401 })
    }

    const { chat_id: chatId, proxy: proxyConfig, access_token: accessToken, display_name: displayName } = notice.rows[0]
    const messages = body.messages ? body.messages : [text ? { type: 'text', text } : body]
    await queueSend(
      {
        sessionId: null,
        botName,
        chatId,
        displayName,
        accessToken,
        proxyConfig,
      },
      messages,
    )
  } catch (ex) {
    logger.error(`[${botName}] ${ex.toString()}`)
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 201 })
}
