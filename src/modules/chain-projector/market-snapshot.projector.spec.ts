import { describe, expect, it, vi } from 'vitest';
import { ContractReaderService } from '@shared/blockchain/contract-reader.service';
import { marketSnapshots } from '@shared/database/schema';
import { MarketSnapshotProjector } from './market-snapshot.projector';

const MARKET = '0x3ada769dc813e3376fcd40d05bea12263048a487';
const BLOCK_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000100';
const TX_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000200';

function event(
  eventName: 'PriceUpdated' | 'DepositYT' | 'WithdrawYT' | 'DepositSettled',
  overrides: Partial<{
    blockNumber: string;
    txHash: string;
    logIndex: string;
    args: Record<string, unknown>;
  }> = {},
) {
  return {
    chainId: 84532,
    marketAddress: MARKET,
    eventName,
    blockNumber: overrides.blockNumber ?? '100',
    blockHash: BLOCK_HASH,
    blockTimestamp: new Date('2026-05-04T00:00:00.000Z'),
    txHash: overrides.txHash ?? TX_HASH,
    logIndex: overrides.logIndex ?? '7',
    args: {
      newPrice: '1000000000000000000',
      oracleTimestamp: '1777852800',
      navAfter: '10',
      navStAfter: '6',
      navJtAfter: '4',
      stJtRatioAfter: '1500000000000000000',
      halted: false,
      ...overrides.args,
    },
  };
}

function previousSnapshot(overrides: Partial<typeof marketSnapshots.$inferSelect> = {}) {
  return {
    id: 1,
    chainId: 84532,
    marketAddress: MARKET,
    nav: '1',
    navSt: '1',
    navJt: '1',
    jtStRatio: '1',
    ytPrice: '999',
    stSharePrice: '1000000000000000000',
    jtSharePrice: '1000000000000000000',
    halted: 'false',
    blockNumber: '99',
    blockHash: BLOCK_HASH,
    sourceTxHash: TX_HASH,
    sourceLogIndex: '1',
    snapshotAt: new Date('2026-05-03T00:00:00.000Z'),
    createdAt: new Date('2026-05-03T00:00:00.000Z'),
    ...overrides,
  };
}

function createProjector({
  existingSnapshots = [],
}: {
  existingSnapshots?: Array<typeof marketSnapshots.$inferSelect>;
} = {}) {
  const snapshotOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const snapshotValues = vi.fn().mockReturnValue({
    onConflictDoNothing: snapshotOnConflictDoNothing,
  });
  const db = {
    query: {
      marketSnapshots: {
        findMany: vi.fn().mockResolvedValue(existingSnapshots),
      },
    },
    insert: vi.fn((table) => {
      if (table === marketSnapshots) {
        return { values: snapshotValues };
      }
      throw new Error('unexpected table');
    }),
  };
  const contractReader = {
    getMarketState: vi.fn().mockResolvedValue({
      latestYtPrice: '1234',
      halted: true,
    }),
    getMarketTrancheSharePrices: vi.fn().mockResolvedValue({
      stSharePrice: '1000000000000000000',
      jtSharePrice: '2000000000000000000',
    }),
  };

  return {
    projector: new MarketSnapshotProjector(
      contractReader as unknown as ContractReaderService,
      db as unknown as ConstructorParameters<typeof MarketSnapshotProjector>[1],
    ),
    db,
    contractReader,
    snapshotValues,
    snapshotOnConflictDoNothing,
  };
}

describe('MarketSnapshotProjector', () => {
  it('creates a PriceUpdated snapshot with event price and semantic ST/JT ratio', async () => {
    const { projector, snapshotValues } = createProjector();

    await projector.projectEvents([event('PriceUpdated')]);

    expect(snapshotValues).toHaveBeenCalledWith([
      expect.objectContaining({
        chainId: 84532,
        marketAddress: MARKET,
        nav: '10',
        navSt: '6',
        navJt: '4',
        jtStRatio: '1500000000000000000',
        ytPrice: '1000000000000000000',
        stSharePrice: '1000000000000000000',
        jtSharePrice: '2000000000000000000',
        halted: 'false',
        blockNumber: '100',
        blockHash: BLOCK_HASH,
        sourceTxHash: TX_HASH,
        sourceLogIndex: '7',
        snapshotAt: new Date('2026-05-04T00:00:00.000Z'),
      }),
    ]);
  });

  it.each(['DepositYT', 'WithdrawYT', 'DepositSettled'] as const)(
    'creates a %s snapshot using carried price',
    async (eventName) => {
      const { projector, snapshotValues } = createProjector({
        existingSnapshots: [previousSnapshot({ ytPrice: '888', halted: 'false' })],
      });

      await projector.projectEvents([event(eventName)]);

      expect(snapshotValues).toHaveBeenCalledWith([
        expect.objectContaining({
          nav: '10',
          navSt: '6',
          navJt: '4',
          jtStRatio: '1500000000000000000',
          ytPrice: '888',
          halted: 'false',
        }),
      ]);
    },
  );

  it('uses batch-created prior price for later non-price events', async () => {
    const { projector, snapshotValues } = createProjector();

    await projector.projectEvents([
      event('PriceUpdated', { logIndex: '1', args: { newPrice: '777' } }),
      event('DepositYT', { logIndex: '2' }),
    ]);

    const rows = snapshotValues.mock.calls[0]?.[0] as
      | Array<typeof marketSnapshots.$inferInsert>
      | undefined;
    expect(rows?.[1]).toMatchObject({
      ytPrice: '777',
    });
  });

  it('does not carry forward future snapshot price during older replay', async () => {
    const { projector, snapshotValues } = createProjector({
      existingSnapshots: [
        previousSnapshot({
          blockNumber: '101',
          sourceLogIndex: '1',
          ytPrice: 'future-price',
        }),
      ],
    });

    await projector.projectEvents([
      event('DepositYT', {
        blockNumber: '100',
        logIndex: '9',
      }),
    ]);

    expect(snapshotValues).toHaveBeenCalledWith([
      expect.objectContaining({
        ytPrice: '1234',
        halted: 'true',
      }),
    ]);
  });

  it('uses live latestYtPrice fallback when no prior snapshot price exists', async () => {
    const { projector, contractReader, snapshotValues } = createProjector();

    await projector.projectEvents([event('DepositYT')]);

    expect(contractReader.getMarketState).toHaveBeenCalledTimes(1);
    expect(snapshotValues).toHaveBeenCalledWith([
      expect.objectContaining({
        ytPrice: '1234',
        halted: 'true',
      }),
    ]);
  });
});
