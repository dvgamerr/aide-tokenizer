import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { logger, parseDatabaseUrl } from './helper'

// Queue Manager Class for easier usage
export class QueueManager {
  constructor() {
    this.db = null
    this.client = null
    this.queueName = Bun.env.PG_QUEUE_NAME || 'notice'
    this.connString = Bun.env.PG_QUEUE_URL
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
      this.client = postgres(this.connString)
      this.db = drizzle({ client: this.client })

      const list = await this.db.execute(sql`SELECT * FROM pgmq.list_queues() WHERE queue_name = ${this.queueName}`)
      if (!list.length) {
        logger.info(` - queue '${this.queueName}' is created`)
        await this.db.execute(sql`SELECT * FROM pgmq.create(${this.queueName})`)
      }
      logger.info(` - queue '${parseDatabaseUrl(this.connString).database}' connected.`)
    }
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
    const [result] = await this.db.execute(sql`SELECT pgmq.send(${this.queueName}, ${JSON.stringify({ ...data, messages })})`)
    return result.send
  }
}

const db = new QueueManager()

export default db
