// import { queueArchive, queueDelete, queueRead } from '../provider/queue'
// import { sleep } from '../provider/helper'
// import flexChatId from '../provider/line/flex-id'
// import preloadAnimation from '../provider/line/preload-animation'
// import pushMessage from '../provider/line/push-message'

// const flexTemplate = { 'get-id': flexChatId }

// const ANSWER = {
//   SERVER_DOWN: {
//     EN: "I'm sorry, I can't help you right now.",
//     TH: 'ขอโทษค่ะ ไม่สามารถให้บริการในขณะนี้',
//   },
// }
import { version } from '../package.json'
import { logger } from '../provider/helper'
import queue from '../provider/queue'

logger.info(`queue-receiver ${version} starting...`)
await queue.init()

// while (true) {
//   const sender = await queueRead()
//   if (!sender) {
//     await sleep(400)
//     continue
//   }

//   const {
//     msgId,
//     readCount,
//     message: { botName, chatId, messages, chatType, sessionId, proxyConfig, accessToken, apiKey, language },
//   } = sender
//   const { type: msgType, name: msgName } = messages[0]

//   try {
//     if (msgType === 'template') {
//       if (!flexTemplate[msgName]) {
//         await queueDelete(msgId)
//         continue
//       }

//       await pushMessage(accessToken, chatId, [{ type: 'flex', altText: `ID: ${chatId}`, contents: flexTemplate[msgName](chatId) }])
//       await queueDelete(msgId)
//       continue
//     }

//     if (sessionId) {
//       const question = messages.map((m) => m.text).join(' ')
//       logger.info(`[${sessionId}] ${botName}:HM[${chatType}]`)

//       if (chatType === 'USER' && readCount === 1) {
//         await preloadAnimation(accessToken, chatId, 30)
//       }
//       const res = await fetch(proxyConfig.url, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'User-Agent': `aide-${pkg.name}/${pkg.version}`,
//           'x-secret-key': Bun.env.AIDE_API_KEY || 'n/a',
//           'x-api-key': apiKey,
//         },
//         body: JSON.stringify({ chatId: sessionId, chatType, question }),
//       })
//       if (!res.ok) throw new Error(`${res.status} - \n${await res.text()}`)
//       const body = await res.json()
//       logger.info(`[${sessionId}] ${botName}:AI[${body.intention}]`)
//       if (body.answer) await pushMessage(accessToken, chatId, body.answer)
//     } else {
//       await pushMessage(accessToken, chatId, messages)
//     }

//     await (Bun.env.NODE_ENV === 'production' ? queueArchive : queueDelete)(msgId)
//   } catch (ex) {
//     if (readCount > 3) {
//       await queueDelete(msgId)
//       await pushMessage(accessToken, chatId, ANSWER.SERVER_DOWN[language || 'TH'])
//     }
//     logger.warn({ error: ex.toString(), msgId })
//   }
// }
