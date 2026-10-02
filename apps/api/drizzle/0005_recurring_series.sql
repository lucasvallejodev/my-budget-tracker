SET LOCAL lock_timeout = '5s';--> statement-breakpoint
CREATE TYPE "public"."recurring_cadence" AS ENUM('weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."recurring_kind" AS ENUM('bill', 'subscription', 'income', 'other');--> statement-breakpoint
CREATE TYPE "public"."recurring_record_mode" AS ENUM('match_only', 'create_pending');--> statement-breakpoint
CREATE TYPE "public"."recurring_source" AS ENUM('manual', 'detected');--> statement-breakpoint
CREATE TYPE "public"."recurring_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TABLE "recurring_series" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "recurring_kind" DEFAULT 'bill' NOT NULL,
	"account_id" text NOT NULL,
	"payee_id" text,
	"category_id" text,
	"currency" char(3) NOT NULL,
	"amount_minor" bigint NOT NULL,
	"amount_min_minor" bigint,
	"amount_max_minor" bigint,
	"cadence" "recurring_cadence" DEFAULT 'monthly' NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"anchor_date" date NOT NULL,
	"end_date" date,
	"match_window_days" integer DEFAULT 3 NOT NULL,
	"record_mode" "recurring_record_mode" DEFAULT 'match_only' NOT NULL,
	"source" "recurring_source" DEFAULT 'manual' NOT NULL,
	"status" "recurring_status" DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_series_amount_check" CHECK ("recurring_series"."amount_minor" <> 0),
	CONSTRAINT "recurring_series_interval_check" CHECK ("recurring_series"."interval" >= 1),
	CONSTRAINT "recurring_series_window_check" CHECK ("recurring_series"."match_window_days" >= 0)
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "recurring_series_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "recurring_due_on" date;--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_series_user_idx" ON "recurring_series" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_series_id_recurring_series_id_fk" FOREIGN KEY ("recurring_series_id") REFERENCES "public"."recurring_series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_recurring_occurrence_key" ON "transactions" USING btree ("recurring_series_id","recurring_due_on") WHERE "transactions"."recurring_series_id" IS NOT NULL AND "transactions"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_pair_check" CHECK (("transactions"."recurring_series_id" IS NULL) = ("transactions"."recurring_due_on" IS NULL)) NOT VALID;