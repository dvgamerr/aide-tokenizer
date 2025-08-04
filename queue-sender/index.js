import { sleepSync } from 'bun'

import { version } from '../package.json'
import { logger } from '../provider/config'
import setupGracefulShutdown from '../provider/graceful'
import flexChatId from '../provider/line/flex-id'
import pushMessage from '../provider/line/push-message'
import queue from '../provider/queue'

const flexTemplate = { 'get-id': flexChatId }

const ANSWER = {
  SERVER_DOWN: {
    EN: "I'm sorry, I can't help you right now.",
    TH: 'ขอโทษค่ะ ไม่สามารถให้บริการในขณะนี้',
  },
}

logger.info(`queue-sender ${version} starting...`)
await queue.init()

// Setup graceful shutdown handlers
setupGracefulShutdown(null, queue, logger)

while (true) {
  const { payload } = await queue.process(async ({ headers, message, msg_id, read_ct }) => {
    try {
      for (const msg of message) {
        if (msg.type === 'template') {
          if (!flexTemplate[msg.name]) continue

          const content = [{ altText: `ID: ${headers.chatId}`, contents: flexTemplate[msg.name](headers.chatId), type: 'flex' }]
          await pushMessage(headers.accessToken, headers.chatId, content)
          continue
        }

        await pushMessage(headers.accessToken, headers.chatId, message)
      }
    } catch (ex) {
      if (read_ct > 3) {
        await queue.delete(headers.traceId, msg_id)
        await pushMessage(headers.accessToken, headers.chatId, ANSWER.SERVER_DOWN['TH'])
      }
      // Log error properly with logger instead of console.error
      logger.error({ error: ex.message || ex.toString(), stack: ex.stack, traceId: headers.traceId })
    }
  })

  if (!payload) {
    sleepSync(100)
    continue
  }
}
