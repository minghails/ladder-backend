import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const priceUpdates = pgTable('price_updates', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  newPrice: text('new_price').notNull(),
  oracleTimestamp: text('oracle_timestamp').notNull(),
  navAfter: text('nav_after').notNull(),
  navStAfter: text('nav_st_after').notNull(),
  navJtAfter: text('nav_jt_after').notNull(),
  jtStRatioAfter: text('jt_st_ratio_after').notNull(),
  halted: boolean('halted').notNull().default(false),
  txHash: varchar('tx_hash', { length: 66 }),
  blockNumber: text('block_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
