import { Pgmq } from 'pgmq-js'
import { Client } from 'pg'
import pino from 'pino'

const logger = pino()

const PG_HOST = Bun.env.PG_HOST || 'localhost'
const PG_USER = Bun.env.PG_USER || 'postgres'
const PG_PASS = Bun.env.PG_PASS || ''
const PG_POST = parseInt(Bun.env.PG_POST) || 5432
const PG_DB = Bun.env.PG_DB || 'postgres'

export const queueName = Bun.env.QUEUE_NAME || 'notice_queue'

const pgConn = {
  host: PG_HOST,
  database: PG_DB,
  password: PG_PASS,
  port: PG_POST,
  user: PG_USER,
  ssl: false,
}

export const pgClient = async () => {
  logger.info(` - database '${PG_DB}' connecting...`)
  const clientConn = new Client(pgConn)
  await clientConn.connect()

  return clientConn
}

export const pgQueue = async () => {
  logger.info(` - queue '${queueName}' connecting...`)
  const queueConn = await Pgmq.new(pgConn)

  let queueCreated = false

  if (queueCreated) {
    await queueConn.queue.create(queueName)
  }
}
