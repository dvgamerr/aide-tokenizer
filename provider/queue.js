import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { logger, parseDatabaseUrl } from './config'

export class QueueManager {
  constructor() {
    this.queueName = Bun.env.PG_QUEUE_NAME || 'notice'
    this.connString = Bun.env.PG_QUEUE_URL
  }

  async archive(traceId, msgId) {
    await this.init()
    await this.db.execute(sql`SELECT pgmq.archive(${this.queueName}, ${msgId}::int)`)
    logger.info(`Archived message ${msgId} [${traceId}]`)
  }

  async delete(traceId, msgId) {
    await this.init()
    await this.db.execute(sql`SELECT pgmq.delete(${this.queueName}, ${msgId}::int)`)
    logger.info(`Deleted message ${msgId} [${traceId}]`)
  }

  async init() {
    if (!this.db) {
      this.client = postgres(this.connString)
      this.db = drizzle({ client: this.client })

      const queues = await this.db.execute(sql`SELECT * FROM pgmq.list_queues() WHERE queue_name = ${this.queueName}`)
      if (!queues.length) {
        await this.db.execute(sql`SELECT * FROM pgmq.create(${this.queueName})`)
        logger.info(`Queue '${this.queueName}' created`)
      }
      logger.info(`Database '${parseDatabaseUrl(this.connString).database}' connected`)
    }
  }

  async process(handler, options = {}) {
    const { invisible = 10, limit = 10 } = options
    const message = await this.read(limit, invisible)

    if (!message) return {}

    const result = await handler(message)

    if (message.headers?.archive) {
      await this.archive(message.headers.traceId, message.msg_id)
    } else {
      await this.delete(message.headers?.traceId, message.msg_id)
    }

    return { message, result }
  }

  async read(limit = 1, invisible = 1) {
    await this.init()
    const [result] = await this.db.execute(sql`SELECT * FROM pgmq.read(${this.queueName}, ${invisible}::int, ${limit}::int)`)
    if (result) logger.info(`Read message ${result.msg_id} [${result.headers?.traceId}]`)
    return result
  }

  async send(msg = [], headers = {}) {
    await this.init()
    const [result] = await this.db.execute(
      sql`SELECT pgmq.send(${this.queueName}, ${JSON.stringify(msg)}::jsonb, ${JSON.stringify(headers)}::jsonb)`,
    )
    logger.info(`Sent message ${result.send} [${headers?.traceId}]`)
    return result.send
  }
}

const db = new QueueManager()

export default db
