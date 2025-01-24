import flexChatId from '../provider/flex/id'
import { pgQueue, pgClient, queueName } from '../provider/db'
import { pushMessage } from '../provider/line'
import { flowise } from '../provider/proxy/flowise'

import { logger } from '../provider/logger'

const flexTemplate = {
  'get-id': flexChatId,
}
const clientConn = await pgClient()
const clientQueue = await pgQueue()

logger.info(`Queue ${queueName} is running...`)
while (true) {
  const sender = await clientQueue.msg.read(queueName, 10)
  if (!sender) continue
  const { msgId, readCount } = sender
  const { chatId, botName, messages, sessionId } = sender.message

  try {
    const notice = await clientConn.query(
      `
    SELECT n.access_token, n.proxy
    FROM users u
    INNER JOIN notice n ON n.name = u.notice_name
    WHERE u.active = 't' AND u.notice_name = $1 AND chat_id = $2
  `,
      [botName, chatId],
    )
    if (!notice.rows.length) throw new Error(`No access token for ${botName}:${chatId}`)

    const accessToken = notice.rows[0]?.access_token
    const proxy = notice.rows[0]?.proxy

    if (messages[0]?.type === 'template') {
      if (!flexTemplate[messages[0]?.name]) continue

      await pushMessage(accessToken, chatId, [{ type: 'flex', altText: `ID: ${chatId}`, contents: flexTemplate[messages[0].name](chatId) }])
      continue
    }

    if (sessionId) {
      const question = messages.map((m) => m.text).join(' ')
      if (proxy.name == 'flowise') {
        const { answer } = await flowise(sessionId, question, 'th', proxy)
        await pushMessage(accessToken, chatId, answer)
      }
    } else {
      await pushMessage(accessToken, chatId, messages)
    }

    if (Bun.env.NODE_ENV === 'production') {
      await clientQueue.msg.archive(queueName, msgId)
    } else {
      logger.debug(JSON.stringify({ msgId, chatId, botName, messages, sessionId }, null, 2))
      await clientQueue.msg.delete(queueName, msgId)
    }
  } catch (ex) {
    if (readCount > 3) {
      await clientQueue.msg.delete(queueName, msgId)
    }
    logger.warn(ex)
  }
}
