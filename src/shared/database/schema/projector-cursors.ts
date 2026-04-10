import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const projectorCursors = pgTable('projector_cursors', {
  id: varchar('id', { length: 128 }).primaryKey(),
  lastBlockNumber: text('last_block_number').notNull(),
  lastLogIndex: text('last_log_index').notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
