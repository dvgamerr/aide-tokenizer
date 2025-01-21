import { queueConn, queueName } from '../provider/db'
// import { getChatId, preloadAnimation, pushMessage } from '../provider/line'

await queueConn.queue.create(queueName)

while (true) {
  const sender = await queueConn.msg.read(queueName, 10)
  if (!sender) continue

  console.log(sender)
}
