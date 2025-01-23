import flexChatId from '../provider/flex/id'
import { pgQueue, pgClient, queueName } from '../provider/db'
import { pushMessage } from '../provider/line'

import { logger } from '../provider/logger'

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

    if (messages[0]?.type === 'template') {
      if (!flexTemplate[messages[0]?.name]) continue

      await pushMessage(accessToken, chatId, [{ type: 'flex', altText: `ID: ${chatId}`, contents: flexTemplate[messages[0].name](chatId) }])
    } else {
      // await pushMessage(accessToken, chatId, messages)
    }
  } catch (ex) {
    logger.error(ex)
  }

  if (Bun.env.NODE_ENV === 'production') {
    await clientQueue.msg.archive(queueName, msgId)
  } else {
    logger.debug(JSON.stringify({ msgId, chatId, botName, messages, sessionId }, null, 2))
    await clientQueue.msg.delete(queueName, msgId)
  }
}
