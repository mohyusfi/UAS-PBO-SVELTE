CREATE TYPE "public"."borrow_status" AS ENUM('borrowed', 'returned', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."fine_status" AS ENUM('none', 'unpaid', 'paid');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer', 'ewallet');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"isbn" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"borrowed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_price_nonnegative" CHECK ("books"."price" >= 0),
	CONSTRAINT "books_stock_nonnegative" CHECK ("books"."stock" >= 0),
	CONSTRAINT "books_borrowed_count_nonnegative" CHECK ("books"."borrowed_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "borrow_records" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text,
	"book_title" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"borrow_date" date NOT NULL,
	"return_date" date,
	"due_date" date NOT NULL,
	"late_days" integer DEFAULT 0 NOT NULL,
	"fine_amount" integer DEFAULT 0 NOT NULL,
	"fine_status" "fine_status" DEFAULT 'none' NOT NULL,
	"borrow_price" integer DEFAULT 0 NOT NULL,
	"payment_id" text,
	"payment_method" "payment_method" DEFAULT 'cash' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'paid' NOT NULL,
	"paid_at" date,
	"status" "borrow_status" DEFAULT 'borrowed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "borrow_records_late_days_nonnegative" CHECK ("borrow_records"."late_days" >= 0),
	CONSTRAINT "borrow_records_fine_amount_nonnegative" CHECK ("borrow_records"."fine_amount" >= 0),
	CONSTRAINT "borrow_records_borrow_price_nonnegative" CHECK ("borrow_records"."borrow_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"email" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "borrow_records" ADD CONSTRAINT "borrow_records_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "books_isbn_unique" ON "books" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "books_title_idx" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "books_category_idx" ON "books" USING btree ("category");--> statement-breakpoint
CREATE INDEX "borrow_records_book_id_idx" ON "borrow_records" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "borrow_records_customer_email_idx" ON "borrow_records" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "borrow_records_status_idx" ON "borrow_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "borrow_records_active_idx" ON "borrow_records" USING btree ("due_date") WHERE "borrow_records"."status" in ('borrowed', 'overdue');--> statement-breakpoint
CREATE INDEX "customers_username_idx" ON "customers" USING btree ("username");