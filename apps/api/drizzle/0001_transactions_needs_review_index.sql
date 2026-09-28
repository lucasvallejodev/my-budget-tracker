SET LOCAL lock_timeout = '5s';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_needs_review_idx" ON "transactions" USING btree ("user_id") WHERE "transactions"."needs_review" AND "transactions"."deleted_at" IS NULL;
