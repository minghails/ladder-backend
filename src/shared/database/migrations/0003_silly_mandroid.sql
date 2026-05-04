DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "price_updates" LIMIT 1) THEN
		RAISE EXCEPTION 'Cannot add price update source identity columns while price_updates contains rows. Reset dev DB or backfill tx_hash, block_number, log_index, and block_hash from chain data first.';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "price_updates" ALTER COLUMN "tx_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "price_updates" ALTER COLUMN "block_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "price_updates" ADD COLUMN "log_index" text NOT NULL;--> statement-breakpoint
ALTER TABLE "price_updates" ADD COLUMN "block_hash" varchar(66) NOT NULL;--> statement-breakpoint
ALTER TABLE "price_updates" ADD CONSTRAINT "price_updates_market_tx_log_unique" UNIQUE("market_address","tx_hash","log_index");
