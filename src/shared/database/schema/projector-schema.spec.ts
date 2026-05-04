import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { marketEvents } from './market-events';
import { projectorCursors } from './projector-cursors';

function columnNamesForUniqueConstraints(table: Parameters<typeof getTableConfig>[0]) {
  return getTableConfig(table).uniqueConstraints.map((constraint) =>
    constraint.columns.map((column) => column.name),
  );
}

describe('projector schema', () => {
  it('should define source identity fields and idempotency for market events', () => {
    const config = getTableConfig(marketEvents);
    const columns = Object.fromEntries(
      config.columns.map((column) => [column.name, column]),
    );

    expect(columns['chain_id']?.notNull).toBe(true);
    expect(columns['block_hash']?.notNull).toBe(true);
    expect(columns['block_timestamp']?.notNull).toBe(true);
    expect(columnNamesForUniqueConstraints(marketEvents)).toContainEqual([
      'chain_id',
      'market_address',
      'tx_hash',
      'log_index',
    ]);
  });

  it('should define per-chain market cursor identity fields', () => {
    const config = getTableConfig(projectorCursors);
    const columns = Object.fromEntries(
      config.columns.map((column) => [column.name, column]),
    );

    expect(columns['chain_id']?.notNull).toBe(true);
    expect(columns['market_address']?.notNull).toBe(true);
    expect(columns['last_block_hash']?.notNull).toBe(false);
  });
});
