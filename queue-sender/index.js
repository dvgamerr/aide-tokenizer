import { Pgmq } from 'pgmq-js'
// import { getChatId, preloadAnimation, pushMessage } from '../provider/line'
const logger = require('pino')()

const PG_HOST = Bun.env.PG_HOST || 'localhost'
const PG_USER = Bun.env.PG_USER || 'postgres'
const PG_PASS = Bun.env.PG_PASS || ''
const PG_DB = Bun.env.PG_DB || 'postgres'

const qName = Bun.env.PG_QUEUE || 'notice_line'
logger.info(`Connecting to queue '${qName}'...`)
const pgmq = await Pgmq.new({
  host: PG_HOST,
  database: PG_DB,
  password: PG_PASS,
  port: 5432,
  user: PG_USER,
  ssl: false,
})

await pgmq.queue.create(qName)

while (true) {
  const sender = await pgmq.msg.read(qName, 10)
  if (!sender) continue

  console.log(sender)
}
