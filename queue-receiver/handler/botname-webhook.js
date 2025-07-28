import { randomUUIDv7 } from 'bun'
import crypto from 'crypto'
import { and, eq, sql } from 'drizzle-orm'

import { getChatId, getType } from '../../provider/line'
import userProfile from '../../provider/line/user-profile'
import { lineSessions, lineUsers } from '../../provider/schema'

const isCommandIncluded = (event, cmd) => {
  return event?.message?.type === 'text' && event.message.text.trim().match(new RegExp(`^/${cmd}.*`, 'ig'))
}

const calculateTokens = (traceId, events, logger, botName) => {
  const tokens = (events.map((e) => (e.message.text || '').length).reduce((p, v) => p + v) / 3.75).toFixed(0)
  logger.info(`[${traceId}] [${botName}] ${tokens} tokens.`)
  return tokens
}

const validateSignature = (traceId, body, clientSecret, lineSignature, logger, botName) => {
  const expectedSignature = crypto.createHmac('SHA256', clientSecret).update(JSON.stringify(body)).digest('base64')
  const isValid = lineSignature === expectedSignature

  if (!isValid) {
    logger.warn(`[${traceId}] [${botName}] ${lineSignature} signature failure.`)
  }

  return isValid
}

const getUserData = async (db, chatId, botName, channel) => {
  const [notice] = await db.execute(
    sql`
      SELECT
        n.access_token, n.client_secret, u.api_key, u.admin, u.active, s.session_id,
        n.proxy, coalesce(u.profile ->> 'displayName', u.chat_id) as display_name, u.language
      FROM line_notice n
      LEFT JOIN line_users u ON n.name = u.notice_name AND u.chat_id = ${chatId}
      LEFT JOIN line_sessions s ON n.name = s.notice_name AND u.chat_id = s.chat_id
      WHERE n.name = ${botName} AND lower(provider) = ${channel.toLowerCase()}
    `,
  )

  return notice
}

const createUserIfNotExists = async (db, chatId, botName, apiKey) => {
  if (apiKey) return

  await db.insert(lineUsers).values({
    chatId: chatId,
    noticeName: botName,
  })
}

const ensureSessionExists = async (db, chatId, botName, sessionId) => {
  if (sessionId) return sessionId

  sessionId = randomUUIDv7()
  await db
    .insert(lineSessions)
    .values({
      chatId: chatId,
      noticeName: botName,
      sessionId: sessionId,
    })
    .onConflictDoNothing()
  return sessionId
}

const handleAdminCommands = async (event, queue, options) => {
  const { isAdmin, optionQueue } = options

  if (!isAdmin) return false

  if (isCommandIncluded(event, 'raw')) {
    const tempOption = { ...optionQueue }
    delete tempOption.sessionId
    await queue.send(tempOption, [{ sender: { name: 'admin' }, text: JSON.stringify(event, null, 2), type: 'text' }])
    return true
  }

  return false
}

const handleIdCommand = async (event, queue, options) => {
  const { chatId, optionQueue } = options

  if (isCommandIncluded(event, 'id')) {
    const tempOption = { ...optionQueue }
    delete tempOption.sessionId
    await queue.send(tempOption, [{ chatId, name: 'get-id', sender: { name: 'admin' }, type: 'template' }])
    return true
  }
  return false
}

const handleImCommand = async (event, queue, options) => {
  const { accessToken, apiKey, chatId, chatType, db, optionQueue, params } = options

  if (isCommandIncluded(event, 'im')) {
    const tempOption = { ...optionQueue }
    delete tempOption.sessionId

    const profile = chatType === 'USER' ? await userProfile(accessToken, chatId) : { displayName: 'Group' }

    if (event.message.text.trim().includes(apiKey)) {
      await db
        .update(lineUsers)
        .set({
          active: true,
          profile: profile,
        })
        .where(and(eq(lineUsers.chatId, chatId), eq(lineUsers.noticeName, params.botName)))
      await queue.send(tempOption, [{ sender: { name: 'admin' }, text: `Hi, ${profile.displayName}`, type: 'text' }])
    } else {
      await queue.send(tempOption, [{ sender: { name: 'admin' }, text: `${profile.displayName}, Nope! 😅 `, type: 'text' }])
    }
    return true
  }
  return false
}

const processEvents = async (queue, events, options) => {
  let messages = []
  let timestamp = 0

  for await (const event of events) {
    // ตรวจสอบคำสั่ง admin
    if (await handleAdminCommands(event, queue, options)) {
      continue
    }

    // ตรวจสอบคำสั่ง id
    if (await handleIdCommand(event, queue, options)) {
      continue
    }

    // ตรวจสอบคำสั่ง im
    if (await handleImCommand(event, queue, options)) {
      continue
    }

    // เก็บ timestamp และ message ปกติ
    timestamp = event.timestamp
    messages.push(Object.assign(event.message, { replyToken: event.replyToken }))
  }

  return { messages, timestamp }
}

export default async ({ body, db, headers, logger, params, queue, store }) => {
  const traceId = store?.traceId

  if (params.channel.toLowerCase() === 'line') {
    // ตรวจสอบ signature ของ LINE
    if (!headers['x-line-signature']) return new Response(null, { status: 404 })
    if (!body.events[0]?.type || body.events[0]?.type == 'postback') {
      return new Response(null, { status: 201 })
    }

    // คำนวณจำนวน tokens
    calculateTokens(traceId, body.events, logger, params.botName)

    // ดึงข้อมูล chat และ user
    const chatId = getChatId(body.events[0])
    const chatType = getType(body.events[0])

    const userData = await getUserData(db, chatId, params.botName, params.channel)
    if (!userData) {
      return new Response(null, { status: 401 })
    }

    // สร้าง cache token object
    const cacheToken = {
      accessToken: userData.access_token,
      apiKey: userData.api_key,
      clientSecret: userData.client_secret,
      displayName: userData.display_name,
      isActive: userData.active,
      isAdmin: userData.admin,
      language: userData.language,
      proxyConfig: userData.proxy,
      sessionId: userData.session_id,
    }

    // สร้าง user ใหม่ถ้ายังไม่มี
    await createUserIfNotExists(db, chatId, params.botName, cacheToken.apiKey)

    const { accessToken, apiKey, clientSecret, isActive, isAdmin } = cacheToken
    const lineSignature = headers['x-line-signature']

    // ตรวจสอบ signature
    if (!validateSignature(traceId, body, clientSecret, lineSignature, logger, params.botName)) {
      return new Response(null, { status: 401 })
    }

    // สร้าง session ถ้ายังไม่มี
    let sessionId = await ensureSessionExists(db, chatId, params.botName, cacheToken.sessionId)
    logger.debug(`[${traceId}] [${params.botName}] sessionId: ${sessionId}`)

    // ประมวลผล events
    const { messages, timestamp } = await processEvents(queue, body.events, {
      accessToken,
      apiKey,
      chatId,
      chatType,
      db,
      isAdmin,
      optionQueue: { ...cacheToken, botName: params.botName, chatId, chatType, sessionId },
      params,
    })

    // ส่งข้อความถ้า user active และมีข้อความ
    if (isActive && messages.length) {
      await queue.send({ ...cacheToken, botName: params.botName, chatId, chatType, sessionId, timestamp }, messages)
    }

    logger.debug(`[${traceId}] [${params.botName}] Active: ${isActive} (${messages.length})`)
    return new Response(null, { status: 201 })
  } else {
    return new Response(null, { status: 404 })
  }
}
