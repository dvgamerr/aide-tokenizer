import pino from 'pino'

import { pgQueue, queueName } from '../provider/db'
// import { getChatId, preloadAnimation, pushMessage } from '../provider/line'

const logger = pino()
const clientQueue = await pgQueue()

logger.info(`Queue ${queueName} is running...`)
while (true) {
  const sender = await clientQueue.msg.read(queueName, 10)
  if (!sender) continue
  const { msgId, message } = sender
  console.log(message)

  await clientQueue.msg.delete(queueName, msgId)
}
