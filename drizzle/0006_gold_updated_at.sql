ALTER TABLE "stash"."gold" RENAME COLUMN "update_at" TO "updated_at";--> statement-breakpoint
DROP INDEX "stash"."uq_update_at";--> statement-breakpoint
CREATE INDEX "uq_updated_at" ON "stash"."gold" USING btree ("updated_at");