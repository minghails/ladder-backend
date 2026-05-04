DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "market_events" LIMIT 1) THEN
		RAISE EXCEPTION 'Cannot add projector source identity columns while market_events contains rows. Reset dev DB or backfill chain_id, block_hash, and block_timestamp from chain data first.';
	END IF;

	IF EXISTS (SELECT 1 FROM "projector_cursors" LIMIT 1) THEN
		RAISE EXCEPTION 'Cannot add projector cursor identity columns while projector_cursors contains rows. Reset dev DB or backfill chain_id and market_address first.';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "market_events" ADD COLUMN "chain_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "market_events" ADD COLUMN "block_hash" varchar(66) NOT NULL;--> statement-breakpoint
ALTER TABLE "market_events" ADD COLUMN "block_timestamp" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "projector_cursors" ADD COLUMN "chain_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "projector_cursors" ADD COLUMN "market_address" varchar(42) NOT NULL;--> statement-breakpoint
ALTER TABLE "projector_cursors" ADD COLUMN "last_block_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "market_events" ADD CONSTRAINT "market_events_chain_market_tx_log_unique" UNIQUE("chain_id","market_address","tx_hash","log_index");
