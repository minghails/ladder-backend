import { pgTable, serial, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const portfolioCostBasis = pgTable(
  'portfolio_cost_basis',
  {
    id: serial('id').primaryKey(),
    walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
    marketAddress: varchar('market_address', { length: 42 })
      .notNull()
      .references(() => markets.address),
    tranche: varchar('tranche', { length: 16 }).notNull(),
    openShares: text('open_shares').notNull().default('0'),
    openCostBasis: text('open_cost_basis').notNull().default('0'),
    realizedPnl: text('realized_pnl').notNull().default('0'),
    depositedValue: text('deposited_value').notNull().default('0'),
    withdrawnValue: text('withdrawn_value').notNull().default('0'),
    lastProcessedBlock: text('last_processed_block').notNull().default('0'),
    dataQuality: varchar('data_quality', { length: 16 }).notNull().default('full'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('portfolio_cost_basis_wallet_market_tranche_unique').on(
      table.walletAddress,
      table.marketAddress,
      table.tranche,
    ),
  ],
);
