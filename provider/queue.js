import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { logger, parseDatabaseUrl } from './helper'

export class QueueManager {
  constructor() {
    this.db = null
    this.client = null
    this.queueName = Bun.env.PG_QUEUE_NAME || 'notice'
    this.connString = Bun.env.PG_QUEUE_URL
  }

  async archive(traceId, msgId) {
    await this.init()
    await this.db.execute(sql`SELECT pgmq.archive(${this.queueName}, ${msgId}::int);`)
    logger.info(`[deleted:${traceId}] Id: ${msgId}`)
  }

  async delete(traceId, msgId) {
    await this.init()
    await this.db.execute(sql`SELECT pgmq.delete(${this.queueName}, ${msgId}::int);`)
    logger.info(`[deleted:${traceId}] Id: ${msgId}`)
    return
  }

  async init() {
    if (!this.client) {
      try {
        this.client = postgres(this.connString)
        this.db = drizzle({ client: this.client })

        const list = await this.db.execute(sql`SELECT * FROM pgmq.list_queues() WHERE queue_name = ${this.queueName}`)
        if (!list.length) {
          logger.info(` - queue '${this.queueName}' is created`)
          await this.db.execute(sql`SELECT * FROM pgmq.create(${this.queueName})`)
        }
        logger.info(` - queue '${parseDatabaseUrl(this.connString).database}' connected.`)
      } catch (ex) {
        logger.error(`Queue: ${ex}`)
        process.exit(1)
      }
    }
  }

  async process(handler, options = {}) {
    const { invisible = 10, limit = 10 } = options

    try {
      const payload = await this.read(limit, invisible)
      if (!payload) return {}

      const result = await handler(payload)

      if (!payload.headers.archive) {
        await this.delete(payload.headers?.traceId, payload.msg_id)
      } else {
        await this.archive(payload.headers?.traceId, payload.msg_id)
      }

      return { message: payload, result }
    } catch (ex) {
      logger.error(`Queue error: ${ex}`)
      process.exit(1)
    }
  }

  async read(limit = 1, invisible = 1) {
    await this.init()

    const [result] = await this.db.execute(
      sql`SELECT * FROM pgmq.read(queue_name => ${this.queueName}, vt => ${invisible}::int, qty => ${limit}::int)`,
    )
    if (result) logger.info(`[  queue:${result.headers?.traceId}] Id: ${result.msg_id}`)
    return result
  }

  async send(msg = [], headers = {}) {
    await this.init()
    const [result] = await this.db.execute(
      sql`SELECT pgmq.send(queue_name => ${this.queueName}, msg => ${JSON.stringify(msg)}::jsonb, headers => ${JSON.stringify(headers)}::jsonb)`,
    )
    logger.info(`[ sended:${headers?.traceId}] Id: ${result.send}`)
    return result.send
  }
}

const db = new QueueManager()

export default db
