SET LOCAL lock_timeout = '5s';--> statement-breakpoint
ALTER TABLE "payees" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "payees" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "allow_emoji" boolean DEFAULT false NOT NULL;
