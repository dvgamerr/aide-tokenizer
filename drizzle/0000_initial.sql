CREATE SCHEMA "stash";
--> statement-breakpoint
CREATE TYPE "public"."manga_lang" AS ENUM('TH', 'EN', 'CH', 'JP', 'KR');--> statement-breakpoint
CREATE TYPE "public"."manga_type" AS ENUM('manga', 'manhwa', 'doujin');--> statement-breakpoint
CREATE TYPE "public"."t_lang" AS ENUM('TH', 'EN', 'NA');--> statement-breakpoint
CREATE TABLE "stash"."cinema_showing" (
	"s_bind" varchar(200),
	"s_name_en" text NOT NULL,
	"s_name_th" text NOT NULL,
	"s_display" text NOT NULL,
	"t_release" timestamp with time zone NOT NULL,
	"s_genre" varchar(40) NOT NULL,
	"n_week" integer NOT NULL,
	"n_year" integer NOT NULL,
	"n_time" integer DEFAULT 0 NOT NULL,
	"s_url" text NOT NULL,
	"s_cover" text NOT NULL,
	"o_theater" jsonb DEFAULT '[]' NOT NULL,
	CONSTRAINT "uq_cinema_name" UNIQUE("s_bind","n_week","n_year")
);
--> statement-breakpoint
CREATE TABLE "stash"."gold" (
	"tin" numeric DEFAULT '0',
	"tout" numeric DEFAULT '0',
	"tin_ico" varchar(4),
	"tout_ico" varchar(4),
	"usd_sale" numeric DEFAULT '0',
	"usd_buy" numeric DEFAULT '0',
	"update_at" timestamp with time zone DEFAULT now()
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
	"profile" jsonb DEFAULT '{}',
	"language" "t_lang" DEFAULT 'NA' NOT NULL,
	CONSTRAINT "line_users_chat_id_notice_name_pk" PRIMARY KEY("chat_id","notice_name")
);
--> statement-breakpoint
CREATE TABLE "stash"."manga_collection" (
	"s_name" varchar(255) NOT NULL,
	"s_title" text NOT NULL,
	"s_url" text NOT NULL,
	"s_thumbnail" varchar(200) NOT NULL,
	"b_translate" boolean DEFAULT false NOT NULL,
	"e_type" "manga_type" DEFAULT 'manga' NOT NULL,
	"e_lang" "manga_lang" DEFAULT 'TH' NOT NULL,
	"n_total" integer DEFAULT 0 NOT NULL,
	"o_image" jsonb DEFAULT '[]' NOT NULL,
	CONSTRAINT "uq_manga_url" UNIQUE("s_url")
);
--> statement-breakpoint
CREATE TABLE "reminder" (
	"name" varchar(20) PRIMARY KEY NOT NULL,
	"note" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "line_sessions" ADD CONSTRAINT "line_sessions_notice_name_line_notice_name_fk" FOREIGN KEY ("notice_name") REFERENCES "public"."line_notice"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_users" ADD CONSTRAINT "line_users_notice_name_line_notice_name_fk" FOREIGN KEY ("notice_name") REFERENCES "public"."line_notice"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "uq_update_at" ON "stash"."gold" USING btree ("update_at");--> statement-breakpoint
CREATE INDEX "line_users_api_key_unique" ON "line_users" USING btree ("api_key");