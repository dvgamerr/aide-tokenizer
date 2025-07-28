import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { logger, parseDatabaseUrl } from './helper'
import * as schema from './schema'

class DatabaseManager {
  constructor() {
    this.db = null
    this.queryClient = null
    this.isConnected = false
    this.connectionUrl = Bun.env.PG_MAIN_URL
  }

  async connect() {
    if (this.isConnected && this.db) {
      return this.db
    }

    const pgConn = parseDatabaseUrl(this.connectionUrl)
    try {
      this.queryClient = postgres(this.connectionUrl)
      this.db = drizzle({ client: this.queryClient }, { schema })

      await this.db.execute('SELECT 1')
      this.isConnected = true
      logger.info(` - database '${pgConn.database}' connected successfully`)

      return this.db
    } catch (err) {
      logger.error('Database connection failed:', err.message)
      this.isConnected = false
      throw err
    }
  }

  async disconnect() {
    if (this.queryClient) {
      await this.queryClient.end()
      this.queryClient = null
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
