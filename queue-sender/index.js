import flexChatId from '../provider/line/flex-id'
import { queueRead, queueDelete, queueArchive } from '../provider/db'
import { sleep } from '../provider/helper'
import pushMessage from '../provider/line/push-message'
import preloadAnimation from '../provider/line/preload-animation'
import pkg from '../package.json'
import { logger } from '../provider/helper'

const flexTemplate = { 'get-id': flexChatId }

while (true) {
  const sender = await queueRead()
  if (!sender) {
    await sleep(400)
    continue
  }

  const {
    msgId,
    readCount,
    message: { botName, chatId, messages, chatType, sessionId, proxyConfig, accessToken, apiKey },
  } = sender
  const { type: msgType, name: msgName } = messages[0]

  try {
    if (msgType === 'template') {
      if (!flexTemplate[msgName]) {
        await queueDelete(msgId)
        continue
      }

      await pushMessage(accessToken, chatId, [{ type: 'flex', altText: `ID: ${chatId}`, contents: flexTemplate[msgName](chatId) }])
      await queueDelete(msgId)
      continue
    }

    if (sessionId) {
      const question = messages.map((m) => m.text).join(' ')
      logger.info(`[${sessionId}] ${botName}:HM[${chatType}]`)

      if (chatType === 'USER') {
        await preloadAnimation(accessToken, chatId, 30)
      }
      const res = await fetch(proxyConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `aide-${pkg.name}/${pkg.version}`,
          'x-secret-key': Bun.env.AIDE_API_KEY || 'n/a',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ chatId: sessionId, chatType, question }),
      })
      if (!res.ok) throw new Error(`${res.status} - ${res.statusText}\n${await res.text()}`)
      const body = await res.json()
      logger.info(`[${sessionId}] ${botName}:AI[${body.intent}]`)
      await pushMessage(accessToken, chatId, body.answer || body)
    } else {
      await pushMessage(accessToken, chatId, messages)
    }

    await (Bun.env.NODE_ENV === 'production' ? queueArchive : queueDelete)(msgId)
  } catch (ex) {
    if (readCount > 3) await queueDelete(msgId)
    logger.warn(ex)
  }
}
