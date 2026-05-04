import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  unique,
} from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const marketEvents = pgTable(
  'market_events',
  {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id').notNull(),
    marketAddress: varchar('market_address', { length: 42 })
      .notNull()
      .references(() => markets.address),
    eventName: varchar('event_name', { length: 64 }).notNull(),
    blockNumber: text('block_number').notNull(),
    blockHash: varchar('block_hash', { length: 66 }).notNull(),
    blockTimestamp: timestamp('block_timestamp', {
      withTimezone: true,
    }).notNull(),
    txHash: varchar('tx_hash', { length: 66 }).notNull(),
    logIndex: text('log_index').notNull(),
    args: jsonb('args').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('market_events_chain_market_tx_log_unique').on(
      table.chainId,
      table.marketAddress,
      table.txHash,
      table.logIndex,
    ),
  ],
);
