CREATE TABLE "deposit_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"user" varchar(42) NOT NULL,
	"receiver" varchar(42) NOT NULL,
	"as_senior" boolean NOT NULL,
	"token_in" varchar(42) NOT NULL,
	"amount_in" text NOT NULL,
	"min_yt_out" text NOT NULL,
	"status" varchar(32) DEFAULT 'requested' NOT NULL,
	"reason_code" text,
	"tx_hash" varchar(66),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deposit_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "market_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"event_name" varchar(64) NOT NULL,
	"block_number" text NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"log_index" text NOT NULL,
	"args" jsonb NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"nav" text NOT NULL,
	"nav_st" text NOT NULL,
	"nav_jt" text NOT NULL,
	"jt_st_ratio" text NOT NULL,
	"yt_price" text NOT NULL,
	"halted" text NOT NULL,
	"block_number" text NOT NULL,
	"snapshot_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"address" varchar(42) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"yt_token_address" varchar(42) NOT NULL,
	"base_token_address" varchar(42) NOT NULL,
	"senior_tranche_address" varchar(42) NOT NULL,
	"junior_tranche_address" varchar(42) NOT NULL,
	"halted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(64) NOT NULL,
	"operator_address" varchar(42) NOT NULL,
	"market_address" varchar(42),
	"tx_hash" varchar(66),
	"params" jsonb,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"senior_shares" text DEFAULT '0' NOT NULL,
	"junior_shares" text DEFAULT '0' NOT NULL,
	"last_updated_block" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_reports_raw" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"source" varchar(32) NOT NULL,
	"raw_price" text NOT NULL,
	"oracle_timestamp" text NOT NULL,
	"metadata" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"new_price" text NOT NULL,
	"oracle_timestamp" text NOT NULL,
	"nav_after" text NOT NULL,
	"nav_st_after" text NOT NULL,
	"nav_jt_after" text NOT NULL,
	"jt_st_ratio_after" text NOT NULL,
	"halted" boolean DEFAULT false NOT NULL,
	"tx_hash" varchar(66),
	"block_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projector_cursors" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"last_block_number" text NOT NULL,
	"last_log_index" text DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_address" varchar(42) NOT NULL,
	"alert_type" varchar(64) NOT NULL,
	"severity" varchar(16) NOT NULL,
	"message" text NOT NULL,
	"metadata" text,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_by" varchar(42),
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD CONSTRAINT "deposit_requests_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_events" ADD CONSTRAINT "market_events_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_reports_raw" ADD CONSTRAINT "price_reports_raw_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_updates" ADD CONSTRAINT "price_updates_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_market_address_markets_address_fk" FOREIGN KEY ("market_address") REFERENCES "public"."markets"("address") ON DELETE no action ON UPDATE no action;