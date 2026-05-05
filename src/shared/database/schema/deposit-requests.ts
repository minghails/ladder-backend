import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const depositRequests = pgTable('deposit_requests', {
  id: serial('id').primaryKey(),
  requestId: text('request_id').notNull().unique(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  user: varchar('user', { length: 42 }).notNull(),
  receiver: varchar('receiver', { length: 42 }).notNull(),
  asSenior: boolean('as_senior').notNull(),
  tokenIn: varchar('token_in', { length: 42 }).notNull(),
  amountIn: text('amount_in').notNull(),
  minYtOut: text('min_yt_out').notNull(),
  status: varchar('status', { length: 32 }).notNull().default('requested'),
  adaptorRequestId: text('adaptor_request_id'),
  reasonCode: text('reason_code'),
  txHash: varchar('tx_hash', { length: 66 }),
  pulledTxHash: varchar('pulled_tx_hash', { length: 66 }),
  linkedTxHash: varchar('linked_tx_hash', { length: 66 }),
  settledTxHash: varchar('settled_tx_hash', { length: 66 }),
  rejectedTxHash: varchar('rejected_tx_hash', { length: 66 }),
  refundedTxHash: varchar('refunded_tx_hash', { length: 66 }),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
