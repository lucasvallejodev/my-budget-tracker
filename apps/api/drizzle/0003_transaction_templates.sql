CREATE TABLE "transaction_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "transaction_kind" DEFAULT 'standard' NOT NULL,
	"account_id" text,
	"transfer_account_id" text,
	"category_id" text,
	"payee_id" text,
	"amount_minor" bigint,
	"memo" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_templates_kind_check" CHECK ("transaction_templates"."kind" IN ('standard', 'transfer')),
	CONSTRAINT "transaction_templates_category_kind_check" CHECK ("transaction_templates"."kind" = 'standard' OR "transaction_templates"."category_id" IS NULL),
	CONSTRAINT "transaction_templates_transfer_account_check" CHECK (("transaction_templates"."kind" = 'transfer') OR "transaction_templates"."transfer_account_id" IS NULL),
	CONSTRAINT "transaction_templates_amount_account_check" CHECK ("transaction_templates"."amount_minor" IS NULL OR "transaction_templates"."account_id" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_transfer_account_id_accounts_id_fk" FOREIGN KEY ("transfer_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_templates_user_idx" ON "transaction_templates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_templates_user_name_key" ON "transaction_templates" USING btree ("user_id","name") WHERE "transaction_templates"."deleted_at" IS NULL;