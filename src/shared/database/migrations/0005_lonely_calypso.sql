CREATE TABLE "portfolio_cashflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"tranche" varchar(16) NOT NULL,
	"type" varchar(16) NOT NULL,
	"shares_delta" text NOT NULL,
	"assets_delta" text NOT NULL,
	"value_delta" text NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"log_index" text NOT NULL,
	"block_number" text NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"source_event_name" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_cashflows_chain_market_tx_log_unique" UNIQUE("chain_id","market_address","tx_hash","log_index")
);
--> statement-breakpoint
CREATE TABLE "portfolio_cost_basis" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"tranche" varchar(16) NOT NULL,
	"open_shares" text DEFAULT '0' NOT NULL,
	"open_cost_basis" text DEFAULT '0' NOT NULL,
	"realized_pnl" text DEFAULT '0' NOT NULL,
	"deposited_value" text DEFAULT '0' NOT NULL,
	"withdrawn_value" text DEFAULT '0' NOT NULL,
	"last_processed_block" text DEFAULT '0' NOT NULL,
	"data_quality" varchar(16) DEFAULT 'full' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_cost_basis_wallet_market_tranche_unique" UNIQUE("wallet_address","market_address","tranche")
);
--> statement-breakpoint
ALTER TABLE "portfolio_cashflows" ADD CONSTRAINT "portfolio_cashflows_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_cost_basis" ADD CONSTRAINT "portfolio_cost_basis_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;