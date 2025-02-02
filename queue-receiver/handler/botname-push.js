import { queueSend } from '../../provider/db'

export default async ({ logger, db, headers, body, params, query }) => {
  const { botName } = params
  try {
    let apiKey = query.apiKey
    let text = query?.text

    logger.info(`[${botName}] push "${text || body?.text || body?.altText}"`)

    const credentials = (headers['authorization'] || '').split(' ')
    if (credentials.length === 2) apiKey = Buffer.from(credentials[1], 'base64').toString('ascii')
    if (!apiKey) return new Response(null, { status: 401 })

    if (!text && !body?.text && !body?.altText && !body?.messages?.length && !body?.contents?.length)
      return new Response(null, { status: 400 })

    const notice = await db.query(
      `
        SELECT 
          n.access_token, u.chat_id, n.proxy, 
          coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
        FROM line_users u
        INNER JOIN line_notice n ON n.name = u.notice_name
        WHERE u.active = 't' AND u.api_key = $1 AND u.notice_name = $2 AND provider = $3
      `,
      [apiKey, params.botName, params.channel.toUpperCase()],
    )

    if (!notice.rows.length) return new Response(null, { status: 401 })

    const { chat_id: chatId, proxy: proxyConfig, access_token: accessToken, display_name: displayName } = notice.rows[0]

    await queueSend(
      {
        sessionId: null,
        botName: params.botName,
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
