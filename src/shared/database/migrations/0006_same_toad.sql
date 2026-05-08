ALTER TABLE "market_snapshots" ADD COLUMN "st_share_price" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "jt_share_price" text DEFAULT '0' NOT NULL;