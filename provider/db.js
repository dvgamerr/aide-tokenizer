import { Pgmq } from 'pgmq-js'
import { Client } from 'pg'
import { logger } from './logger'

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

export const pgClient = async () => {
  logger.info(` - database '${PG_DB}' connecting...`)
  const clientConn = new Client(pgConn)
  await clientConn.connect()
  connClient = true

  clientConn.on('error', (err) => {
    logger.error('something bad has happened!', err.stack)
    connClient = false
  })

  await clientConn.query(`
    CREATE TABLE IF NOT EXISTS "public"."users" (
      "chat_id" varchar(36) NOT NULL,
      "notice_name" varchar(20) NOT NULL,
      "api_key" uuid NOT NULL DEFAULT gen_random_uuid(),
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "active" bool NOT NULL DEFAULT false,
      "admin" bool NOT NULL DEFAULT false,
      CONSTRAINT "users_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."notice"("name"),
      PRIMARY KEY ("chat_id","notice_name")
    );

    CREATE TABLE IF NOT EXISTS "public"."sessions" (
      "chat_id" varchar(36) NOT NULL,
      "notice_name" varchar(20) NOT NULL,
      "session_id" uuid DEFAULT gen_random_uuid(),
      "created_at" timestamptz DEFAULT now(),
      CONSTRAINT "sessions_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."notice"("name"),
      PRIMARY KEY ("chat_id","notice_name")
    );
      
    CREATE TABLE IF NOT EXISTS "public"."users" (
      "chat_id" varchar(36) NOT NULL,
      "notice_name" varchar(20) NOT NULL,
      "api_key" uuid NOT NULL DEFAULT gen_random_uuid(),
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "active" bool NOT NULL DEFAULT false,
      "admin" bool NOT NULL DEFAULT false,
      "profile" json DEFAULT '{}'::json,
      CONSTRAINT "users_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."notice"("name"),
      PRIMARY KEY ("chat_id","notice_name")
    );
  `)

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
