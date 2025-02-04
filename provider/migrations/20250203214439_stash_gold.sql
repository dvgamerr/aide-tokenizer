-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS "stash"."gold" (
  "tin" numeric DEFAULT 0,
  "tout" numeric DEFAULT 0,
  "tin_ico" varchar(4),
  "tout_ico" varchar(4),
  "usd_sale" numeric DEFAULT 0,
  "usd_buy" numeric DEFAULT 0,
  "update_at" timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX uq_update_at ON stash.gold USING btree (update_at);
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE "stash"."gold";
-- +goose StatementEnd