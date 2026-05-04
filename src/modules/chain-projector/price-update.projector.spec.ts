import { describe, expect, it, vi } from 'vitest';
import { priceUpdates } from '@shared/database/schema';
import { PriceUpdateProjector } from './price-update.projector';

const MARKET = '0x3ada769dc813e3376fcd40d05bea12263048a487';
const BLOCK_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000100';
const TX_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000200';

function priceUpdatedEvent(overrides: Partial<typeof priceUpdates.$inferInsert> = {}) {
  return {
    chainId: 84532,
    marketAddress: MARKET,
    eventName: 'PriceUpdated',
    blockNumber: '100',
    blockHash: BLOCK_HASH,
    blockTimestamp: new Date('2026-05-04T00:00:00.000Z'),
    txHash: TX_HASH,
    logIndex: '7',
    args: {
      newPrice: '1000000000000000000',
      oracleTimestamp: '1777852800',
      navAfter: '10',
      navStAfter: '6',
      navJtAfter: '4',
      stJtRatioAfter: '1500000000000000000',
      halted: false,
    },
    ...overrides,
  };
}

function createProjector() {
  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn().mockReturnValue({ onConflictDoNothing });
  const db = {
    insert: vi.fn((table) => {
      if (table === priceUpdates) {
        return { values };
      }
      throw new Error('unexpected table');
    }),
  };

  return {
    projector: new PriceUpdateProjector(
      db as unknown as ConstructorParameters<typeof PriceUpdateProjector>[0],
    ),
    values,
    onConflictDoNothing,
  };
}

describe('PriceUpdateProjector', () => {
  it('inserts PriceUpdated facts with semantic ST/JT ratio mapping', async () => {
    const { projector, values } = createProjector();

    await projector.projectEvents([priceUpdatedEvent()]);

    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({
        marketAddress: MARKET,
        newPrice: '1000000000000000000',
        oracleTimestamp: '1777852800',
        navAfter: '10',
        navStAfter: '6',
        navJtAfter: '4',
        jtStRatioAfter: '1500000000000000000',
        halted: false,
        txHash: TX_HASH,
        logIndex: '7',
        blockNumber: '100',
        blockHash: BLOCK_HASH,
      }),
    ]);
  });

  it('ignores non-price events', async () => {
    const { projector, values } = createProjector();

    await projector.projectEvents([
      { ...priceUpdatedEvent(), eventName: 'DepositYT' },
    ]);

    expect(values).not.toHaveBeenCalled();
  });

  it('uses idempotent insert for duplicate replay', async () => {
    const event = priceUpdatedEvent();
    const { projector, values, onConflictDoNothing } = createProjector();

    await projector.projectEvents([event, event]);

    expect(values).toHaveBeenCalledWith([
      expect.any(Object),
      expect.any(Object),
    ]);
    expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
  });
});
