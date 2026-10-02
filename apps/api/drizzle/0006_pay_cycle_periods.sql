SET LOCAL lock_timeout = '5s';--> statement-breakpoint
CREATE TABLE "budget_period_starts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"period_key" text NOT NULL,
	"starts_on" date NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "period_rule" jsonb DEFAULT '{"kind":"calendar"}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "weekend_days" integer[] DEFAULT '{0,6}' NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_period_starts" ADD CONSTRAINT "budget_period_starts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budget_period_starts_user_key" ON "budget_period_starts" USING btree ("user_id","period_key") WHERE "budget_period_starts"."deleted_at" IS NULL;