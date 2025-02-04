import { queueSend } from '../../provider/db'
import { getAuthAPIKey } from '../../provider/helper'

export default async (ctx) => {
  const { logger, db, headers, query } = ctx
  const body = ctx?.body
  const { botName, apiKey } = getAuthAPIKey(headers)
  const text = query?.text || body?.text || !body?.altText

  try {
    if (!apiKey) return new Response(null, { status: 401 })

    const tokens = (text.length / 3.75).toFixed(0)
    logger.info(`[${botName}] ${tokens} tokens.`)

    if (!text && !body?.messages?.length && !body?.contents?.length) return new Response(null, { status: 400 })

    const notice = await db.query(
      `
        SELECT
          n.access_token, u.chat_id, n.proxy,
          coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
        FROM line_users u
        INNER JOIN line_notice n ON n.name = u.notice_name
        WHERE u.active = 't' AND u.notice_name = $1 AND u.api_key = $2 AND provider = 'LINE'
      `,
      [botName, apiKey],
    )

    if (!notice.rowCount) return new Response(null, { status: 401 })

    const { chat_id: chatId, proxy: proxyConfig, access_token: accessToken, display_name: displayName } = notice.rows[0]
    await queueSend(
      {
        sessionId: null,
        botName,
        chatId,
        displayName,
        accessToken,
        proxyConfig,
      },
      body?.messages ? body.messages : [text ? { type: 'text', text } : body],
    )
  } catch (ex) {
    logger.error(`[${botName}] ${ex.toString()}`)
    return new Response(null, { status: 500 })
  }

  return new Response(null, { status: 201 })
}
