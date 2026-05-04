import { pgTable, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const projectorCursors = pgTable('projector_cursors', {
  id: varchar('id', { length: 128 }).primaryKey(),
  chainId: integer('chain_id').notNull(),
  marketAddress: varchar('market_address', { length: 42 }).notNull(),
  lastBlockNumber: text('last_block_number').notNull(),
  lastLogIndex: text('last_log_index').notNull().default('0'),
  lastBlockHash: varchar('last_block_hash', { length: 66 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
