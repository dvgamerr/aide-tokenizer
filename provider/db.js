import { Pgmq } from 'pgmq-js'
import { Client } from 'pg'
import { logger } from './helper'
// import { parse } from 'url'

const parserDBUrl = (dbUrl) => {
  const url = new URL(dbUrl)
  return {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port,
    database: url.pathname.split('/')[1],
    ssl: false,
  }
}
// PG_MAIN_URL
// PG_QUEUE_URL

const pgConn = parserDBUrl(Bun.env.PG_MAIN_URL)
const clientConn = new Client(pgConn)

let connClient = false
export const pgClient = async () => {
  if (connClient) return clientConn

  logger.info(` - database '${pgConn.database}' connecting...`)
  await clientConn.connect()
  connClient = true

  clientConn.on('error', (err) => {
    logger.error('something bad has happened!', err.stack)
    connClient = false
  })

  return clientConn
}

const queueName = Bun.env.PG_QUEUE_NAME || 'notice_queue'
export const pgQueue = async () => {
  const conn = parserDBUrl(Bun.env.PG_QUEUE_URL)
  const queueConn = await Pgmq.new(conn)
  logger.info(` - queue at '${conn.database}' in '${queueName}' connecting...`)
  let queueCreated = false
  for await (const e of await queueConn.queue.list()) {
    if (e === queueName) queueCreated = true
  }

  if (!queueCreated) {
    logger.info(` - queue '${queueName}' is created`)
    await queueConn.queue.create(queueName)
  }
  return queueConn
}

const clientQueue = await pgQueue()

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
