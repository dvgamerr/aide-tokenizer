import { queueSend } from '../../provider/db'
import { getChatId, getType } from '../../provider/line'
import userProfile from '../../provider/line/user-profile'
import { randomUUIDv7 } from 'bun'
import crypto from 'crypto'

const isCommandIncluded = (event, cmd) => {
  return event?.message?.type === 'text' && event.message.text.trim().match(new RegExp(`^/${cmd}.*`, 'ig'))
}

export default async ({ logger, db, headers, body, params }) => {
  if (!headers['x-line-signature']) return new Response(null, { status: 404 })
  if (!body.events[0]?.type || body.events[0]?.type == 'postback') {
    return new Response(null, { status: 201 })
  }

  const tokens = (body.events.map((e) => (e.message.text || '').length).reduce((p, v) => p + v) / 3.75).toFixed(0)
  logger.info(`[${params.botName}] ${tokens} tokens.`)

  const chatId = getChatId(body.events[0])
  const chatType = getType(body.events[0])
  const notice = await db.query(
    `
      SELECT
        n.access_token, n.client_secret, u.api_key, u.admin, u.active, s.session_id,
        n.proxy, coalesce(u.profile ->> 'displayName', u.chat_id) as display_name
      FROM line_notice n
      LEFT JOIN line_users u ON n.name = u.notice_name AND u.chat_id = $1
      LEFT JOIN line_sessions s ON n.name = s.notice_name AND u.chat_id = s.chat_id
      WHERE n.name = $2 AND provider = $3
    `,
    [chatId, params.botName, params.channel.toUpperCase()],
  )
  if (!notice.rowCount) {
    return new Response(null, { status: 401 })
  }

  const cacheToken = {
    accessToken: notice.rows[0]?.access_token,
    clientSecret: notice.rows[0]?.client_secret,
    apiKey: notice.rows[0]?.api_key,
    isAdmin: notice.rows[0]?.admin,
    isActive: notice.rows[0]?.active,
    proxyConfig: notice.rows[0]?.proxy,
    displayName: notice.rows[0]?.display_name,
    sessionId: notice.rows[0]?.session_id,
  }

  if (!cacheToken.apiKey) {
    await db.query('INSERT INTO line_users (chat_id, notice_name) VALUES ($1, $2)', [chatId, params.botName])
  }
  const { accessToken, clientSecret, apiKey, isAdmin, isActive } = cacheToken
  let { sessionId } = cacheToken
  const lineSignature = headers['x-line-signature']

  if (lineSignature !== crypto.createHmac('SHA256', clientSecret).update(JSON.stringify(body)).digest('base64')) {
    logger.warn(`[${params.botName}] ${lineSignature} signature failure.`)
    return new Response(null, { status: 401 })
  }

  logger.debug(`[${params.botName}] sessionId: ${sessionId}`)
  if (!sessionId) {
    sessionId = randomUUIDv7()
    await db.query(
      `
        INSERT INTO line_sessions (chat_id, notice_name, session_id) VALUES ($1, $2, $3)
        ON CONFLICT (chat_id, notice_name) DO NOTHING
        `,
      [chatId, params.botName, sessionId],
    )
  }

  let timestamp = 0,
    messages = []

  const optionQueue = { ...cacheToken, botName: params.botName, chatId, sessionId, chatType }
  for await (const event of body.events) {
    if (isAdmin) {
      if (isCommandIncluded(event, 'raw')) {
        delete optionQueue.sessionId
        await queueSend(optionQueue, [{ type: 'text', text: JSON.stringify(event, null, 2), sender: { name: 'admin' } }])
        continue
      }
    }
    if (isCommandIncluded(event, 'id')) {
      delete optionQueue.sessionId
      await queueSend(optionQueue, [{ type: 'template', name: 'get-id', chatId, sender: { name: 'admin' } }])
      continue
    } else if (isCommandIncluded(event, 'im')) {
      delete optionQueue.sessionId
      const profile = chatType === 'USER' ? await userProfile(accessToken, chatId) : { displayName: 'Group' }
      if (event.message.text.trim().includes(apiKey)) {
        await db.query("UPDATE line_users SET active = 't', profile = $3::json WHERE chat_id = $1 AND notice_name = $2", [
          chatId,
          params.botName,
          JSON.stringify(profile),
        ])
        await queueSend(optionQueue, [{ type: 'text', text: `Hi, ${profile.displayName}`, sender: { name: 'admin' } }])
      } else {
        await queueSend(optionQueue, [{ type: 'text', text: `${profile.displayName}, Nope! 😅 `, sender: { name: 'admin' } }])
      }
      continue
    }
    timestamp = event.timestamp

    messages.push(Object.assign(event.message, { replyToken: event.replyToken }))
  }

  if (isActive && messages.length) await queueSend({ ...optionQueue, timestamp }, messages)
  logger.debug(`[${params.botName}] active:${isActive} - ${messages.length}`)

  return new Response(null, { status: 201 })
}
