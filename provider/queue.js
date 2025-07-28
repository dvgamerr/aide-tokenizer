import { Pgmq } from 'pgmq-js'

import { logger, parseDatabaseUrl } from './helper'

// Queue Manager Class for easier usage
export class QueueManager {
  constructor() {
    this.client = null
    this.queueName = Bun.env.PG_QUEUE_NAME || 'notice_queue'
  }

  // เก็บข้อความไว้ใน archive
  async archive(msgId) {
    await this.init()
    logger.info(`[queue:archived] Id: ${msgId}`)
    return await this.client.msg.archive(this.queueName, msgId)
  }

  // ลบข้อความ
  async delete(msgId) {
    await this.init()
    logger.info(`[queue:deleted ] Id: ${msgId}`)
    return await this.client.msg.delete(this.queueName, msgId)
  }

  async init() {
    if (!this.client) {
      const conn = parseDatabaseUrl(Bun.env.PG_QUEUE_URL)
      const queueConn = await Pgmq.new(conn)
      let queueCreated = false
      for await (const e of await queueConn.queue.list()) {
        if (e === this.queueName) queueCreated = true
      }

      if (!queueCreated) {
        logger.info(` - queue '${this.queueName}' is created`)
        await queueConn.queue.create(this.queueName)
      }

      this.client = queueConn
    }
    return this
  }

  // ประมวลผลข้อความแบบ auto (อ่าน -> ประมวลผล -> ลบ/เก็บ)
  async process(handler, options = {}) {
    const { autoDelete = true, limit = 10 } = options

    try {
      const message = await this.read(limit)
      if (!message) return null

      const result = await handler(message)

      if (autoDelete) {
        await this.delete(message.msgId)
      }

      return { message, result }
    } catch (error) {
      logger.error('Queue processing error:', error.message)
      throw error
    }
  }

  // อ่านข้อความจาก queue
  async read(limit = 10) {
    await this.init()
    const message = await this.client.msg.read(this.queueName, limit)
    if (message) logger.info(`[queue:messaged] Id: ${message.msgId}`)
    return message
  }

  // ส่งข้อความไปยัง queue
  async send(data, messages = []) {
    await this.init()
    const msgId = await this.client.msg.send(this.queueName, { ...data, messages })
    logger.info(`[ queue:sended ] Id: ${msgId}`)
    return msgId
  }
}

const db = new QueueManager()

export default db
