-- +goose Up
-- +goose StatementBegin
CREATE TYPE "t_lang" AS ENUM('TH', 'EN', 'NA');
CREATE TABLE IF NOT EXISTS "public"."line_notice" (
  "name" varchar(20) NOT NULL,
  "provider" varchar(10) NOT NULL,
  "access_token" varchar(200) NOT NULL,
  "client_secret" varchar(50),
  "proxy" json,
  PRIMARY KEY ("name")
);
CREATE TABLE IF NOT EXISTS "public"."line_sessions" (
  "chat_id" varchar(36) NOT NULL,
  "notice_name" varchar(20) NOT NULL,
  "session_id" uuid DEFAULT gen_random_uuid(),
  "created_at" timestamptz DEFAULT now(),
  CONSTRAINT "line_sessions_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."line_notice"("name"),
  PRIMARY KEY ("chat_id", "notice_name")
);
CREATE TABLE IF NOT EXISTS "public"."line_users" (
  "chat_id" varchar(36) NOT NULL,
  "notice_name" varchar(20) NOT NULL,
  "api_key" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "active" bool NOT NULL DEFAULT false,
  "admin" bool NOT NULL DEFAULT false,
  "profile" json DEFAULT '{}'::json,
  "language" "public"."t_lang" NOT NULL DEFAULT 'NA'::t_lang,
  CONSTRAINT "line_users_notice_name_fkey" FOREIGN KEY ("notice_name") REFERENCES "public"."line_notice"("name"),
  PRIMARY KEY ("chat_id", "notice_name")
);
CREATE INDEX IF NOT EXISTS "line_users_api_key_unique" ON "public"."line_users" ("api_key");
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS "public"."line_users_api_key_unique";
DROP TABLE IF EXISTS "public"."line_sessions";
DROP TABLE IF EXISTS "public"."line_users";
DROP TABLE IF EXISTS "public"."line_notice";
DROP TYPE IF EXISTS "public"."t_lang";
-- +goose StatementEnd