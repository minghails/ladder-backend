import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const riskAlerts = pgTable('risk_alerts', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  alertType: varchar('alert_type', { length: 64 }).notNull(),
  severity: varchar('severity', { length: 16 }).notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'),
  acknowledged: boolean('acknowledged').notNull().default(false),
  acknowledgedBy: varchar('acknowledged_by', { length: 42 }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
