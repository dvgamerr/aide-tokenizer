-- +goose Up
-- +goose StatementBegin
CREATE SCHEMA IF NOT EXISTS "stash";
CREATE TYPE manga_type AS ENUM ('manga', 'manhwa', 'doujin');
CREATE TYPE manga_lang AS ENUM ('TH', 'EN', 'CH', 'JP', 'KR');
CREATE TABLE IF NOT EXISTS "stash"."cinema_showing" (
  "s_name" varchar(120) NOT NULL,
  "s_bind" varchar(120),
  "s_display" varchar(200) NOT NULL,
  "t_release" timestamptz NOT NULL,
  "s_genre" varchar(40) NOT NULL,
  "n_week" int2 NOT NULL,
  "n_year" int4 NOT NULL,
  "n_time" int4 NOT NULL DEFAULT 0,
  "s_url" text NOT NULL,
  "s_cover" text NOT NULL,
  "o_theater" jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT uq_cinema_name UNIQUE ("s_name", "n_week", "n_year")
);
CREATE TABLE IF NOT EXISTS "stash"."manga_collection" (
  "s_name" varchar(255) NOT NULL,
  "s_title" text NOT NULL,
  "s_url" text NOT NULL,
  "s_thumbnail" varchar(200) NOT NULL,
  "b_translate" boolean NOT NULL DEFAULT 'f',
  "e_type" manga_type NOT NULL DEFAULT 'manga',
  "e_lang" manga_lang NOT NULL DEFAULT 'TH',
  "n_total" int4 NOT NULL DEFAULT 0,
  "o_image" jsonb NOT NULL DEFAULT '[]',
  CONSTRAINT uq_manga_url UNIQUE ("s_url")
);
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE "stash"."manga_collection";
DROP TABLE "stash"."cinema_showing";
DROP SCHEMA "stash";
DROP TYPE "manga_type";
DROP TYPE "manga_lang";
-- +goose StatementEnd