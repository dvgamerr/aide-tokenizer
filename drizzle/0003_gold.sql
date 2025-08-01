CREATE TABLE "stash"."gold" (
	"tin" numeric DEFAULT '0',
	"tin_ico" varchar(4),
	"tout" numeric DEFAULT '0',
	"tout_ico" varchar(4),
	"usd_buy" numeric DEFAULT '0',
	"usd_sale" numeric DEFAULT '0',
	"update_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "uq_update_at" ON "stash"."gold" USING btree ("update_at");