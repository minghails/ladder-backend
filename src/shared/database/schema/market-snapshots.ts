import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  unique,
} from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const marketSnapshots = pgTable(
  'market_snapshots',
  {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id').notNull(),
    marketAddress: varchar('market_address', { length: 42 })
      .notNull()
      .references(() => markets.address),
    nav: text('nav').notNull(),
    navSt: text('nav_st').notNull(),
    navJt: text('nav_jt').notNull(),
    jtStRatio: text('jt_st_ratio').notNull(),
    ytPrice: text('yt_price').notNull(),
    halted: text('halted').notNull(),
    blockNumber: text('block_number').notNull(),
    blockHash: varchar('block_hash', { length: 66 }).notNull(),
    sourceTxHash: varchar('source_tx_hash', { length: 66 }).notNull(),
    sourceLogIndex: text('source_log_index').notNull(),
    snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('market_snapshots_chain_market_source_unique').on(
      table.chainId,
      table.marketAddress,
      table.sourceTxHash,
      table.sourceLogIndex,
    ),
  ],
);
