CREATE TABLE "stash"."lottery" (
	"back_three" varchar(3)[],
	"back_two" varchar(2)[],
	"created_at" timestamp with time zone DEFAULT now(),
	"draw" date PRIMARY KEY NOT NULL,
	"first_prize" varchar(6) NOT NULL,
	"front_three" varchar(3)[]
);
