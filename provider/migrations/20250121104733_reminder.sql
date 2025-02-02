-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS "public"."reminder" (
  "name" varchar(20) NOT NULL,
  "note" json NOT NULL DEFAULT '{}',
  PRIMARY KEY ("name")
);
-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE "public"."reminder";
-- +goose StatementEnd