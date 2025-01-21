import { pgQueue, queueName } from '../provider/db'
// import { getChatId, preloadAnimation, pushMessage } from '../provider/line'

const clientQueue = await pgQueue()

while (true) {
  const sender = await clientQueue.msg.read(queueName, 10)
  if (!sender) continue

  console.log(sender)
}
