import pino from 'pino'

import flexChatId from '../provider/flex/id'
import { pgQueue, pgClient, queueName } from '../provider/db'
import { pushMessage } from '../provider/line'

const logger = pino()
const clientConn = await pgClient()
const clientQueue = await pgQueue()

const flexTemplate = {
  'get-id': flexChatId,
}

logger.info(`Queue ${queueName} is running...`)
while (true) {
  const sender = await clientQueue.msg.read(queueName, 10)
  if (!sender) continue
  const { msgId } = sender
  const { chatId, botName, messages, sessionId } = sender.message

  try {
    const notice = await clientConn.query(
      `
    SELECT n.access_token
    FROM users u
    INNER JOIN notice n ON n.name = u.notice_name
    WHERE u.active = 't' AND u.notice_name = $1 AND chat_id = $2
  `,
      [botName, chatId],
    )
    if (!notice.rows.length) throw new Error(`No access token for ${botName}:${chatId}`)
    const accessToken = notice.rows[0]?.access_token
    for (const msg of messages) {
      if (msg.type === 'template') {
        if (!flexTemplate[msg.name]) continue

        const contents = flexTemplate[msg.name](msg.chatId)

        await pushMessage(accessToken, msg.chatId, { type: 'flex', altText: `ID: ${msg.chatId}`, contents })
      }
    }
  } catch (ex) {
    logger.error(ex)
  }

  if (Bun.env.NODE_ENV === 'production') {
    await clientQueue.msg.archive(queueName, msgId)
  } else {
    logger.info(JSON.stringify({ msgId, chatId, botName, messages, sessionId }, null, 2))
    await clientQueue.msg.delete(queueName, msgId)
  }
}
