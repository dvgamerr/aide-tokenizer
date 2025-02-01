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
    
    -- CREATE TYPE "t_lang" AS ENUM('TH', 'EN', 'NA');
    
    CREATE TABLE IF NOT EXISTS "public"."users" (
      "chat_id" varchar(36) NOT NULL,
      "notice_name" varchar(20) NOT NULL,
      "api_key" uuid NOT NULL DEFAULT gen_random_uuid(),
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "active" bool NOT NULL DEFAULT false,
      "admin" bool NOT NULL DEFAULT false,
      "profile" json DEFAULT '{}'::json,
      "language" "public"."t_lang" NOT NULL DEFAULT 'NA'::t_lang,
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
      
    CREATE TABLE IF NOT EXISTS "public"."notice" (
      "name" varchar(20) NOT NULL,
      "provider" varchar(10) NOT NULL,
      "access_token" varchar(200) NOT NULL,
      "client_secret" varchar(50),
      "proxy" json,
      PRIMARY KEY ("name")
    );

    CREATE INDEX IF NOT EXISTS "users_api_key_unique" ON "public"."users" ("api_key");

    CREATE TABLE IF NOT EXISTS "public"."reminder" (
      "name" varchar(20) NOT NULL,
      "note" json NOT NULL DEFAULT '{}',
      PRIMARY KEY ("name")
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
