import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const portfolioPositions = pgTable('portfolio_positions', {
  id: serial('id').primaryKey(),
  userAddress: varchar('user_address', { length: 42 }).notNull(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  seniorShares: text('senior_shares').notNull().default('0'),
  juniorShares: text('junior_shares').notNull().default('0'),
  lastUpdatedBlock: text('last_updated_block').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
