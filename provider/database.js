import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { logger, parseDatabaseUrl } from './helper'
import * as schema from './schema'

class DatabaseManager {
  constructor() {
    this.db = null
    this.client = null
    this.isConnected = false
    this.connString = Bun.env.PG_MAIN_URL
  }

  async connect() {
    if (this.isConnected && this.db) {
      return this.db
    }

    try {
      this.client = postgres(this.connString)
      this.db = drizzle({ client: this.client }, { schema })

      await this.db.execute('SELECT 1')
      this.isConnected = true
      logger.info(` - database '${parseDatabaseUrl(this.connString).database}' connected`)

      return this.db
    } catch (err) {
      logger.error('Database connection failed:', err.message)
      this.isConnected = false
      throw err
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end()
      this.client = null
      this.db = null
      this.isConnected = false
      logger.info('Database disconnected')
    }
  }

  status() {
    return this.isConnected
  }
}

const db = new DatabaseManager()

export { DatabaseManager }
export default db
