CREATE TYPE "public"."account_classification" AS ENUM('asset', 'liability');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'cash', 'credit_card', 'loan', 'investment', 'other');--> statement-breakpoint
CREATE TYPE "public"."category_kind" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."transaction_kind" AS ENUM('standard', 'transfer', 'opening');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'cleared', 'reconciled');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"classification" "account_classification" NOT NULL,
	"currency" char(3) NOT NULL,
	"institution" text,
	"account_number" text,
	"color" text,
	"icon" text,
	"notes" text,
	"counts_in_spending" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text NOT NULL,
	"month" date NOT NULL,
	"currency" char(3) NOT NULL,
	"amount_minor" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"group_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "category_kind" NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"code" char(3) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"minor_units" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"user_id" text NOT NULL,
	"base" char(3) NOT NULL,
	"quote" char(3) NOT NULL,
	"date" date NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_rates_user_id_base_quote_date_pk" PRIMARY KEY("user_id","base","quote","date")
);
--> statement-breakpoint
CREATE TABLE "payees" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"default_category_id" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"pattern" text NOT NULL,
	"category_id" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"category_id" text,
	"payee_id" text,
	"amount_minor" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"date" date NOT NULL,
	"kind" "transaction_kind" DEFAULT 'standard' NOT NULL,
	"transfer_id" text,
	"status" "transaction_status" DEFAULT 'cleared' NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"excluded" boolean DEFAULT false NOT NULL,
	"memo" text DEFAULT '' NOT NULL,
	"import_id" text,
	"original_payee" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_category_kind_check" CHECK ("transactions"."kind" = 'standard' OR "transactions"."category_id" IS NULL),
	CONSTRAINT "transactions_transfer_kind_check" CHECK (("transactions"."kind" = 'transfer') = ("transactions"."transfer_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"primary_currency" char(3) NOT NULL,
	"locale" text DEFAULT 'en-US' NOT NULL,
	"seeded_version" integer,
	"show_converted_totals" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_id_category_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."category_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_base_currencies_code_fk" FOREIGN KEY ("base") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_quote_currencies_code_fk" FOREIGN KEY ("quote") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payees" ADD CONSTRAINT "payees_default_category_id_categories_id_fk" FOREIGN KEY ("default_category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_primary_currency_currencies_code_fk" FOREIGN KEY ("primary_currency") REFERENCES "public"."currencies"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_category_month_currency_key" ON "budgets" USING btree ("category_id","month","currency");--> statement-breakpoint
CREATE INDEX "budgets_user_month_idx" ON "budgets" USING btree ("user_id","month");--> statement-breakpoint
CREATE INDEX "categories_user_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_group_idx" ON "categories" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "category_groups_user_idx" ON "category_groups" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payees_user_name_key" ON "payees" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "rules_user_idx" ON "rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "transactions_account_date_idx" ON "transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "transactions_user_category_idx" ON "transactions" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "transactions_transfer_idx" ON "transactions" USING btree ("transfer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_account_import_key" ON "transactions" USING btree ("account_id","import_id") WHERE "transactions"."import_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "currencies" ("code","name","symbol","minor_units") VALUES
('EUR','Euro','€',2),('USD','US Dollar','$',2),('GBP','British Pound','£',2),('JPY','Japanese Yen','¥',0),
('CHF','Swiss Franc','CHF',2),('CAD','Canadian Dollar','CA$',2),('AUD','Australian Dollar','A$',2),('CNY','Chinese Yuan','¥',2),
('HKD','Hong Kong Dollar','HK$',2),('INR','Indian Rupee','₹',2),('MXN','Mexican Peso','MX$',2),('BRL','Brazilian Real','R$',2),
('ARS','Argentine Peso','AR$',2),('CLP','Chilean Peso','CLP$',0),('COP','Colombian Peso','COL$',2),('SEK','Swedish Krona','kr',2),
('NOK','Norwegian Krone','kr',2),('DKK','Danish Krone','kr',2),('PLN','Polish Zloty','zł',2),('CZK','Czech Koruna','Kč',2),
('KRW','South Korean Won','₩',0),('SGD','Singapore Dollar','S$',2),('NZD','New Zealand Dollar','NZ$',2),('ZAR','South African Rand','R',2),
('TRY','Turkish Lira','₺',2),('KWD','Kuwaiti Dinar','KD',3),('BHD','Bahraini Dinar','BD',3)
ON CONFLICT DO NOTHING;--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public."Account"') IS NOT NULL THEN
    INSERT INTO "accounts" ("id","user_id","name","type","classification","currency","institution","account_number","color","icon","notes","deleted_at","created_at","updated_at")
    SELECT "id","userId","name",
      CASE "type"::text WHEN 'CHECKING' THEN 'checking' WHEN 'SAVINGS' THEN 'savings' WHEN 'CREDIT_CARD' THEN 'credit_card' WHEN 'CASH' THEN 'cash' WHEN 'INVESTMENT' THEN 'investment' ELSE 'other' END::account_type,
      CASE "type"::text WHEN 'CREDIT_CARD' THEN 'liability' ELSE 'asset' END::account_classification,
      'EUR',"institution","accountNumber","color","icon","notes",
      CASE WHEN "isDeleted" THEN COALESCE("deletedAt", now()) END,"createdAt","updatedAt"
    FROM "Account";
    INSERT INTO "user_settings" ("user_id","primary_currency")
    SELECT DISTINCT "userId",'EUR' FROM "Account" ON CONFLICT DO NOTHING;
  END IF;
  IF to_regclass('public."Payee"') IS NOT NULL THEN
    INSERT INTO "payees" ("id","user_id","name","archived_at","created_at","updated_at")
    SELECT "id","userId","name",CASE WHEN "isDeleted" THEN COALESCE("deletedAt", now()) END,"createdAt","updatedAt" FROM "Payee";
  END IF;
  IF to_regclass('public."Transaction"') IS NOT NULL THEN
    -- Legacy category slugs pointed at hard-coded constants; rows are flagged for review so they can be re-categorised.
    INSERT INTO "transactions" ("id","user_id","account_id","payee_id","amount_minor","currency","date","kind","status","needs_review","memo","deleted_at","created_at","updated_at")
    SELECT "id","userId","accountId","payeeId",
      (round("amount"*100))::bigint * CASE "type"::text WHEN 'EXPENSE' THEN -1 ELSE 1 END,
      'EUR',("date" AT TIME ZONE 'UTC')::date,'standard','cleared',true,"description",
      CASE WHEN "isDeleted" THEN COALESCE("deletedAt", now()) END,"createdAt","updatedAt"
    FROM "Transaction";
  END IF;
END $$;--> statement-breakpoint
DROP TABLE IF EXISTS "MonthlyCategoryGroupHistory";--> statement-breakpoint
DROP TABLE IF EXISTS "MonthlyHistory";--> statement-breakpoint
DROP TABLE IF EXISTS "Transaction";--> statement-breakpoint
DROP TABLE IF EXISTS "Payee";--> statement-breakpoint
DROP TABLE IF EXISTS "Account";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."AccountType";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."TransactionType";
