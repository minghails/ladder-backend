import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { marketEvents } from './market-events';
import { marketSnapshots } from './market-snapshots';
import { priceUpdates } from './price-updates';
import { projectorCursors } from './projector-cursors';
import { depositRequests } from './deposit-requests';
import { portfolioCashflows, portfolioCostBasis } from './index';

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

  it('should define source identity fields and idempotency for market snapshots', () => {
    const config = getTableConfig(marketSnapshots);
    const columns = Object.fromEntries(
      config.columns.map((column) => [column.name, column]),
    );

    expect(columns['chain_id']?.notNull).toBe(true);
    expect(columns['block_hash']?.notNull).toBe(true);
    expect(columns['source_tx_hash']?.notNull).toBe(true);
    expect(columns['source_log_index']?.notNull).toBe(true);
    expect(columns['yt_price']?.notNull).toBe(true);
    expect(columns['st_share_price']?.notNull).toBe(true);
    expect(columns['jt_share_price']?.notNull).toBe(true);
    expect(columns['jt_st_ratio']?.notNull).toBe(true);
    expect(columns['max_st_jt_ratio']?.notNull).toBe(true);
    expect(columnNamesForUniqueConstraints(marketSnapshots)).toContainEqual([
      'chain_id',
      'market_address',
      'source_tx_hash',
      'source_log_index',
    ]);
  });

  it('should define source identity fields and idempotency for price updates', () => {
    const config = getTableConfig(priceUpdates);
    const columns = Object.fromEntries(
      config.columns.map((column) => [column.name, column]),
    );

    expect(columns['tx_hash']?.notNull).toBe(true);
    expect(columns['log_index']?.notNull).toBe(true);
    expect(columns['block_number']?.notNull).toBe(true);
    expect(columns['block_hash']?.notNull).toBe(true);
    expect(columnNamesForUniqueConstraints(priceUpdates)).toContainEqual([
      'market_address',
      'tx_hash',
      'log_index',
    ]);
  });

  it('should define nullable async deposit request lifecycle projection fields', () => {
    const config = getTableConfig(depositRequests);
    const columns = Object.fromEntries(
      config.columns.map((column) => [column.name, column]),
    );

    expect(columns['adaptor_request_id']?.notNull).toBe(false);
    expect(columns['pulled_tx_hash']?.notNull).toBe(false);
    expect(columns['linked_tx_hash']?.notNull).toBe(false);
    expect(columns['settled_tx_hash']?.notNull).toBe(false);
    expect(columns['rejected_tx_hash']?.notNull).toBe(false);
    expect(columns['refunded_tx_hash']?.notNull).toBe(false);
    expect(columns['settled_at']?.notNull).toBe(false);
    expect(columns['rejected_at']?.notNull).toBe(false);
    expect(columns['refunded_at']?.notNull).toBe(false);
  });

  it('exports portfolio accounting tables', () => {
    expect(portfolioCashflows).toBeDefined();
    expect(portfolioCostBasis).toBeDefined();
  });
});
