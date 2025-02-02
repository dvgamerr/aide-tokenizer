import { Pgmq } from 'pgmq-js'
import { Client } from 'pg'
import { logger } from './helper'

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

export let connClient = false
export let connQueue = false

const clientConn = new Client(pgConn)

export const pgClient = async () => {
  if (connClient) return clientConn

  logger.info(` - database '${PG_DB}' connecting...`)
  await clientConn.connect()
  connClient = true

  clientConn.on('error', (err) => {
    logger.error('something bad has happened!', err.stack)
    connClient = false
  })

  return clientConn
}

export const pgQueue = async () => {
  logger.info(` - queue '${queueName}' connecting...`)
  const queueConn = await Pgmq.new(pgConn)

  let queueCreated = false
  for await (const e of await queueConn.queue.list()) {
    if (e === queueName) queueCreated = true
  }

  if (!queueCreated) {
    logger.info(` - queue created.`)
    await queueConn.queue.create(queueName)
  }
  return queueConn
}

const clientQueue = await pgQueue()

logger.info(`Queue ${queueName} is running...`)
export const queueSend = async (options, messages = []) => {
  const msgId = await clientQueue.msg.send(queueName, { ...options, messages })
  logger.info(`[ queue:sended ] Id: ${msgId}`)
}

export const queueDelete = async (msgId) => {
  logger.info(`[queue:deleted ] Id: ${msgId}`)
  clientQueue.msg.delete(queueName, msgId)
}

export const queueArchive = async (msgId) => {
  logger.info(`[queue:archived] Id: ${msgId}`)
  clientQueue.msg.archive(queueName, msgId)
}

export const queueRead = async () => {
  const sender = await clientQueue.msg.read(queueName, 10)
  if (sender) logger.info(`[queue:messaged] Id: ${sender.msgId}`)
  return sender
}
