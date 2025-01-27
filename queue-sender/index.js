import flexChatId from '../provider/flex/id'
import { pgQueue, queueName } from '../provider/db'
import { pushMessage } from '../provider/line'
import pkg from '../package.json'
import { logger } from '../provider/logger'

const queueDelete = async (msgId) => {
  logger.info(`[queue:${msgId}] deleted`)
  clientQueue.msg.delete(queueName, msgId)
}
const queueArchive = async (msgId) => {
  logger.info(`[queue:${msgId}] archived}`)
  clientQueue.msg.archive(queueName, msgId)
}

const flexTemplate = {
  'get-id': flexChatId,
}
const clientQueue = await pgQueue()

logger.info(`Queue ${queueName} is running...`)
while (true) {
  const sender = await clientQueue.msg.read(queueName, 10)
  if (!sender) continue

  const { msgId, readCount } = sender
  try {
    const { chatId, messages, chatType, sessionId, proxyConfig, displayName, accessToken, apiKey } = sender.message
    const { type: msgType, name: msgName } = messages[0]

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
      const logFlowise = logger.child({ sessionId, chatId })

      logFlowise.info(`[${displayName}] HM[Context]:${question}`)
      const res = await fetch(proxyConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `aide-${pkg.name}/${pkg.version}`,
          'x-secret-key': Bun.env.AIDE_API_KEY || 'n/a',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ chatId, chatType, question }),
      })
      if (!res.ok) throw new Error(`${res.status} - ${res.statusText}\n${await res.text()}`)

      const { answer, intent } = await res.json()
      await pushMessage(accessToken, chatId, answer)
      logFlowise.info(`[${displayName}] AI[${intent}]:${answer}`)
    } else {
      await pushMessage(accessToken, chatId, messages)
    }

    if (Bun.env.NODE_ENV === 'production') {
      await queueArchive(msgId)
    } else {
      await queueDelete(msgId)
    }
  } catch (ex) {
    if (readCount > 3) {
      await queueDelete(msgId)
    }
    logger.warn(ex)
  }
}
