CREATE TYPE "public"."AccountType" AS ENUM('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."TransactionType" AS ENUM('EXPENSE', 'INCOME');--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"type" "AccountType" NOT NULL,
	"balance" double precision DEFAULT 0 NOT NULL,
	"institution" text,
	"accountNumber" text,
	"color" text,
	"icon" text,
	"notes" text,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"deletedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MonthlyCategoryGroupHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"categoryGroupId" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"income" double precision DEFAULT 0 NOT NULL,
	"expense" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MonthlyHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"income" double precision DEFAULT 0 NOT NULL,
	"expense" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Payee" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"categoryId" text,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"deletedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "Transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"categoryId" text,
	"categoryGroupId" text,
	"payeeId" text,
	"amount" double precision NOT NULL,
	"description" text NOT NULL,
	"date" timestamp (3) NOT NULL,
	"type" "TransactionType" NOT NULL,
	"isTransfer" boolean DEFAULT false NOT NULL,
	"transferId" text,
	"linkedAccountId" text,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"deletedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "public"."Payee"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "public"."Transaction"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "public"."Account"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "Account_userId_idx" ON "Account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Account_userId_isDeleted_idx" ON "Account" USING btree ("userId","isDeleted");--> statement-breakpoint
CREATE UNIQUE INDEX "MonthlyCategoryGroupHistory_userId_categoryGroupId_month_year_key" ON "MonthlyCategoryGroupHistory" USING btree ("userId","categoryGroupId","month","year");--> statement-breakpoint
CREATE INDEX "MonthlyCategoryGroupHistory_userId_year_month_idx" ON "MonthlyCategoryGroupHistory" USING btree ("userId","year","month");--> statement-breakpoint
CREATE INDEX "MonthlyCategoryGroupHistory_categoryGroupId_idx" ON "MonthlyCategoryGroupHistory" USING btree ("categoryGroupId");--> statement-breakpoint
CREATE UNIQUE INDEX "MonthlyHistory_userId_month_year_key" ON "MonthlyHistory" USING btree ("userId","month","year");--> statement-breakpoint
CREATE INDEX "MonthlyHistory_userId_year_month_idx" ON "MonthlyHistory" USING btree ("userId","year","month");--> statement-breakpoint
CREATE UNIQUE INDEX "Payee_userId_name_key" ON "Payee" USING btree ("userId","name");--> statement-breakpoint
CREATE INDEX "Payee_userId_idx" ON "Payee" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Transaction_transferId_key" ON "Transaction" USING btree ("transferId");--> statement-breakpoint
CREATE INDEX "Transaction_userId_idx" ON "Transaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Transaction_accountId_idx" ON "Transaction" USING btree ("accountId");--> statement-breakpoint
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "Transaction_date_idx" ON "Transaction" USING btree ("date");--> statement-breakpoint
CREATE INDEX "Transaction_userId_isDeleted_idx" ON "Transaction" USING btree ("userId","isDeleted");--> statement-breakpoint
CREATE INDEX "Transaction_transferId_idx" ON "Transaction" USING btree ("transferId");