DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "market_snapshots" LIMIT 1) THEN
		RAISE EXCEPTION 'Cannot add snapshot source identity columns while market_snapshots contains rows. Reset dev DB or backfill chain_id, block_hash, source_tx_hash, and source_log_index from chain data first.';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "chain_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "block_hash" varchar(66) NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "source_tx_hash" varchar(66) NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD COLUMN "source_log_index" text NOT NULL;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_chain_market_source_unique" UNIQUE("chain_id","market_address","source_tx_hash","source_log_index");
