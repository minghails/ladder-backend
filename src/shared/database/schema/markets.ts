import { pgTable, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const markets = pgTable('markets', {
  address: varchar('address', { length: 42 }).primaryKey(),
  name: text('name').notNull(),
  ytTokenAddress: varchar('yt_token_address', { length: 42 }).notNull(),
  baseTokenAddress: varchar('base_token_address', { length: 42 }).notNull(),
  seniorTrancheAddress: varchar('senior_tranche_address', { length: 42 }).notNull(),
  juniorTrancheAddress: varchar('junior_tranche_address', { length: 42 }).notNull(),
  halted: boolean('halted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
