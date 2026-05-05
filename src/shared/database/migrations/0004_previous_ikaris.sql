ALTER TABLE "deposit_requests" ADD COLUMN "adaptor_request_id" text;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "pulled_tx_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "linked_tx_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "settled_tx_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "rejected_tx_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "refunded_tx_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "settled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deposit_requests" ADD COLUMN "refunded_at" timestamp with time zone;