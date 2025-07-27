-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."manga_lang" AS ENUM('TH', 'EN', 'CH', 'JP', 'KR');--> statement-breakpoint
CREATE TYPE "public"."manga_type" AS ENUM('manga', 'manhwa', 'doujin');--> statement-breakpoint
CREATE TYPE "public"."t_lang" AS ENUM('TH', 'EN', 'NA');--> statement-breakpoint
CREATE TABLE "reminder" (
	"name" varchar(20) PRIMARY KEY NOT NULL,
	"note" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_notice" (
	"name" varchar(20) PRIMARY KEY NOT NULL,
	"provider" varchar(10) NOT NULL,
	"access_token" varchar(200) NOT NULL,
	"client_secret" varchar(50),
	"proxy" jsonb
);
--> statement-breakpoint
CREATE TABLE "line_sessions" (
	"chat_id" varchar(36) NOT NULL,
	"notice_name" varchar(20) NOT NULL,
	"session_id" uuid DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "line_sessions_chat_id_notice_name_pk" PRIMARY KEY("chat_id","notice_name")
);
--> statement-breakpoint
CREATE TABLE "line_users" (
	"chat_id" varchar(36) NOT NULL,
	"notice_name" varchar(20) NOT NULL,
	"api_key" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"profile" jsonb DEFAULT '{}'::jsonb,
	"language" "t_lang" DEFAULT 'NA' NOT NULL,
	CONSTRAINT "line_users_chat_id_notice_name_pk" PRIMARY KEY("chat_id","notice_name")
);
--> statement-breakpoint
ALTER TABLE "line_sessions" ADD CONSTRAINT "line_sessions_notice_name_line_notice_name_fk" FOREIGN KEY ("notice_name") REFERENCES "public"."line_notice"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_users" ADD CONSTRAINT "line_users_notice_name_line_notice_name_fk" FOREIGN KEY ("notice_name") REFERENCES "public"."line_notice"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "line_users_api_key_unique" ON "line_users" USING btree ("api_key" uuid_ops);
*/