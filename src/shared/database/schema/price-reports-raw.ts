import { pgTable, serial, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const priceReportsRaw = pgTable('price_reports_raw', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  source: varchar('source', { length: 32 }).notNull(),
  rawPrice: text('raw_price').notNull(),
  oracleTimestamp: text('oracle_timestamp').notNull(),
  metadata: jsonb('metadata'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});
