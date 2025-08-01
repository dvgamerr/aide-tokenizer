// import { queueArchive, queueDelete, queueRead } from '../provider/queue'
// import { sleep } from '../provider/helper'
import flexChatId from '../provider/line/flex-id'
// import preloadAnimation from '../provider/line/preload-animation'
import pushMessage from '../provider/line/push-message'

const flexTemplate = { 'get-id': flexChatId }

// const ANSWER = {
//   SERVER_DOWN: {
//     EN: "I'm sorry, I can't help you right now.",
//     TH: 'ขอโทษค่ะ ไม่สามารถให้บริการในขณะนี้',
//   },
// }
import { sleepSync } from 'bun'

import { version } from '../package.json'
import setupGracefulShutdown from '../provider/graceful'
import { logger } from '../provider/helper'
import queue from '../provider/queue'

logger.info(`queue-receiver ${version} starting...`)
await queue.init()

// Setup graceful shutdown handlers
setupGracefulShutdown(null, queue, logger)

// {
//   headers: {
//     chatId: "U3aec2fb5f0dcaef47361bd6a3e1c0e0a",
//     botName: "popcorn",
//     traceId: "5845c3d4-733e-4bed-b803-150ac729458a",
//     accessToken: "EDwAeBwUA...",
//     displayName: "🌑кем",
//     proxyConfig: null,
//   },
//   message: [
//     {
//       type: "flex",
//       altText: "🪙 ราคาเพิ่มขึ้น 108,720",
//       contents: [Object ...],
//     }
//   ],
//   msg_id: "15",
//   read_ct: 1,
// }

while (true) {
  const { payload } = await queue.process(async ({ headers, message, msg_id, read_ct }) => {
    console.log({ headers, message, msg_id, read_ct })

    // const {
    //   msgId,
    //   readCount,
    //   message: { botName, chatId, messages, chatType, sessionId, proxyConfig, accessToken, apiKey, language },
    // } = sender
    // const { type: msgType, name: msgName } = messages[0]

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

      // if (sessionId) {
      //   const question = messages.map((m) => m.text).join(' ')
      //   logger.info(`[${sessionId}] ${botName}:HM[${chatType}]`)

      //   if (chatType === 'USER' && readCount === 1) {
      //     await preloadAnimation(accessToken, chatId, 30)
      //   }
      //   const res = await fetch(proxyConfig.url, {
      //     body: JSON.stringify({ chatId: sessionId, chatType, question }),
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'User-Agent': `aide-${pkg.name}/${pkg.version}`,
      //       'x-secret-key': Bun.env.AIDE_API_KEY || 'n/a',
      //       'x-api-key': apiKey,
      //     },
      //     method: 'POST',
      //   })
      //   if (!res.ok) throw new Error(`${res.status} - \n${await res.text()}`)
      //   const body = await res.json()
      //   logger.info(`[${sessionId}] ${botName}:AI[${body.intention}]`)
      //   if (body.answer) await pushMessage(accessToken, chatId, body.answer)
      // } else {
      //   await pushMessage(accessToken, chatId, messages)
      // }
    } catch (ex) {
      // if (readCount > 3) {
      //   await queueDelete(msgId)
      //   await pushMessage(accessToken, chatId, ANSWER.SERVER_DOWN[language || 'TH'])
      // }
      logger.warn({ error: ex.toString(), traceId: headers?.traceId })
    }
  })

  if (!payload) {
    sleepSync(100)
    continue
  }
}
