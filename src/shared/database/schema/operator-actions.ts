import { pgTable, serial, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const operatorActions = pgTable('operator_actions', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 64 }).notNull(),
  operatorAddress: varchar('operator_address', { length: 42 }).notNull(),
  marketAddress: varchar('market_address', { length: 42 }),
  txHash: varchar('tx_hash', { length: 66 }),
  params: jsonb('params'),
  result: jsonb('result'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
