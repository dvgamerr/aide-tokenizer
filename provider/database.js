import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { logger, parseDatabaseUrl } from './helper'
import * as schema from './schema'

class DatabaseManager {
  constructor() {
    this.client = null
    this.db = null
    this.connString = Bun.env.PG_MAIN_URL
    if (!this.connString) {
      throw new Error('PG_MAIN_URL environment variable is required')
    }
  }

  async connect() {
    if (this.db) return this.db

    try {
      this.client = postgres(this.connString)
      this.db = drizzle({ client: this.client }, { schema })
      await this.db.execute('SELECT 1')
      logger.info(` - database '${parseDatabaseUrl(this.connString).database}' connected`)
      return this.db
    } catch (ex) {
      logger.error(`Database connection failed: ${ex}`)
      process.exit(1)
    }
  }

  async disconnect() {
    if (!this.client) return
    await this.client.end()
    this.client = this.db = null
    logger.info('Database disconnected')
  }

  status() {
    return !!this.db
  }
}

export default new DatabaseManager()
export { DatabaseManager }
