CREATE SCHEMA "stash";
--> statement-breakpoint
CREATE TABLE "stash"."cinema_showing" (
	"s_bind" varchar(200),
	"s_display" text NOT NULL,
	"s_name_en" text NOT NULL,
	"s_name_th" text NOT NULL,
	"s_url" text NOT NULL,
	"n_time" integer DEFAULT 0 NOT NULL,
	"n_week" integer NOT NULL,
	"n_year" integer NOT NULL,
	"o_theater" jsonb DEFAULT '[]' NOT NULL,
	"s_cover" text NOT NULL,
	"s_genre" varchar(40) NOT NULL,
	"t_release" timestamp with time zone NOT NULL,
	CONSTRAINT "uq_cinema_name" UNIQUE("s_bind","n_week","n_year")
);
