import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const portfolioCashflows = pgTable(
  'portfolio_cashflows',
  {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id').notNull(),
    marketAddress: varchar('market_address', { length: 42 })
      .notNull()
      .references(() => markets.address),
    walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
    tranche: varchar('tranche', { length: 16 }).notNull(),
    type: varchar('type', { length: 16 }).notNull(),
    sharesDelta: text('shares_delta').notNull(),
    assetsDelta: text('assets_delta').notNull(),
    valueDelta: text('value_delta').notNull(),
    txHash: varchar('tx_hash', { length: 66 }).notNull(),
    logIndex: text('log_index').notNull(),
    blockNumber: text('block_number').notNull(),
    blockTimestamp: timestamp('block_timestamp', { withTimezone: true }).notNull(),
    sourceEventName: varchar('source_event_name', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('portfolio_cashflows_chain_market_tx_log_unique').on(
      table.chainId,
      table.marketAddress,
      table.txHash,
      table.logIndex,
    ),
  ],
);
