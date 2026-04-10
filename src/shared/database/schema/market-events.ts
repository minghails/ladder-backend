import { pgTable, serial, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const marketEvents = pgTable('market_events', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  eventName: varchar('event_name', { length: 64 }).notNull(),
  blockNumber: text('block_number').notNull(),
  txHash: varchar('tx_hash', { length: 66 }).notNull(),
  logIndex: text('log_index').notNull(),
  args: jsonb('args').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
});
