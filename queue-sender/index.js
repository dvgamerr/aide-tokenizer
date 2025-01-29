import flexChatId from '../provider/line/flex-id'
import { pgQueue, queueName } from '../provider/db'
import { sleep } from '../../provider/helper'
import pushMessage from '../provider/line/push-message'
import pkg from '../package.json'
import { logger } from '../provider/helper'

const queueDelete = async (msgId) => {
  logger.trace(`[queue]  deleted Id: ${msgId}`)
  clientQueue.msg.delete(queueName, msgId)
}

const queueArchive = async (msgId) => {
  logger.trace(`[queue] archived Id: ${msgId}`)
  clientQueue.msg.archive(queueName, msgId)
}

const flexTemplate = { 'get-id': flexChatId }
const clientQueue = await pgQueue()

logger.info(`Queue ${queueName} is running...`)
while (true) {
  const sender = await clientQueue.msg.read(queueName, 10)
  if (!sender) continue

  const {
    msgId,
    readCount,
    message: { chatId, messages, chatType, sessionId, proxyConfig, displayName, accessToken, apiKey },
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
      logger.info(`${displayName}:HM[${chatType}]:${question}`)

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
      logger.info(`${displayName}:AI[${body.intent}]:${body.answer}`)
      await pushMessage(accessToken, chatId, body.answer || body)
    } else {
      await pushMessage(accessToken, chatId, messages)
    }

    await (Bun.env.NODE_ENV === 'production' ? queueArchive : queueDelete)(msgId)
  } catch (ex) {
    if (readCount > 3) await queueDelete(msgId)
    logger.warn(ex)
  }
  await sleep(1000)
}
