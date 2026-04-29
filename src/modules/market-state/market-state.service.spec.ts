import { NotFoundException } from '@nestjs/common';
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { MarketStateService } from './market-state.service';

type MarketRow = {
  address: string;
  name: string;
  ytTokenAddress: string;
  baseTokenAddress: string;
  seniorTrancheAddress: string;
  juniorTrancheAddress: string;
  halted: boolean;
};

type SnapshotRow = {
  marketAddress: string;
  nav: string;
  navSt: string;
  navJt: string;
  jtStRatio: string;
  ytPrice: string;
  halted: string;
  blockNumber: string;
  snapshotAt: Date;
};

type FakeDb = {
  marketRows: MarketRow[];
  snapshotRows: SnapshotRow[];
};

describe('MarketStateService', () => {
  async function createService(fakeDb?: FakeDb) {
    const module = await Test.createTestingModule({
      providers: [
        MarketStateService,
        {
          provide: DRIZZLE_DB,
          useValue: fakeDb,
        },
      ],
    }).compile();

    return module.get(MarketStateService);
  }

  it('lists FE-ready fallback markets for table and card views when DB has no rows', async () => {
    const service = await createService({ marketRows: [], snapshotRows: [] });

    const response = await service.listMarkets();

    expect(response.markets).toHaveLength(4);
    expect(response.markets[0]).toMatchObject({
      symbol: 'mEDGE',
      totalTvl: '40000000',
      senior: {
        apy: '0.0500',
        tvl: '30000000',
      },
      junior: {
        apy: '0.2080',
        tvl: '10000000',
      },
      ratio: {
        display: '4:1',
        stJtRatio: '4.0',
      },
      status: {
        halted: false,
        stalePrice: false,
        warnings: [],
      },
    });
  });

  it('maps DB markets with their latest snapshots into FE-ready market rows', async () => {
    const service = await createService({
      marketRows: [
        {
          address: '0x00000000000000000000000000000000000000f1',
          name: 'DB Market',
          ytTokenAddress: '0x00000000000000000000000000000000000000a1',
          baseTokenAddress: '0x00000000000000000000000000000000000000b1',
          seniorTrancheAddress: '0x00000000000000000000000000000000000000c1',
          juniorTrancheAddress: '0x00000000000000000000000000000000000000d1',
          halted: false,
        },
      ],
      snapshotRows: [
        {
          marketAddress: '0x00000000000000000000000000000000000000f1',
          nav: '123000000',
          navSt: '100000000',
          navJt: '23000000',
          jtStRatio: '4.3478',
          ytPrice: '1000000000000000000',
          halted: 'false',
          blockNumber: '101',
          snapshotAt: new Date('2026-04-28T00:00:00.000Z'),
        },
        {
          marketAddress: '0x00000000000000000000000000000000000000f1',
          nav: '125000000',
          navSt: '101000000',
          navJt: '24000000',
          jtStRatio: '4.2083',
          ytPrice: '1005000000000000000',
          halted: 'false',
          blockNumber: '102',
          snapshotAt: new Date('2026-04-29T00:00:00.000Z'),
        },
      ],
    });

    const response = await service.listMarkets();

    expect(response.markets).toHaveLength(1);
    expect(response.markets[0]).toMatchObject({
      address: '0x00000000000000000000000000000000000000f1',
      symbol: 'DB Market',
      totalTvl: '125000000',
      senior: {
        tvl: '101000000',
      },
      junior: {
        tvl: '24000000',
      },
      ratio: {
        display: '4.2083:1',
        stJtRatio: '4.2083',
      },
      status: {
        halted: false,
        stalePrice: false,
        warnings: [],
      },
    });
  });

  it('returns DB-backed market detail by address case-insensitively', async () => {
    const service = await createService({
      marketRows: [
        {
          address: '0x00000000000000000000000000000000000000f1',
          name: 'DB Market',
          ytTokenAddress: '0x00000000000000000000000000000000000000a1',
          baseTokenAddress: '0x00000000000000000000000000000000000000b1',
          seniorTrancheAddress: '0x00000000000000000000000000000000000000c1',
          juniorTrancheAddress: '0x00000000000000000000000000000000000000d1',
          halted: true,
        },
      ],
      snapshotRows: [
        {
          marketAddress: '0x00000000000000000000000000000000000000f1',
          nav: '125000000',
          navSt: '101000000',
          navJt: '24000000',
          jtStRatio: '4.2083',
          ytPrice: '1005000000000000000',
          halted: 'true',
          blockNumber: '102',
          snapshotAt: new Date('2026-04-29T00:00:00.000Z'),
        },
      ],
    });

    const detail = await service.getMarket('0X00000000000000000000000000000000000000F1');

    expect(detail).toMatchObject({
      address: '0x00000000000000000000000000000000000000f1',
      name: 'DB Market',
      totalTvl: '125000000',
      nav: {
        total: '125000000',
        senior: '101000000',
        junior: '24000000',
      },
      underlying: {
        symbol: 'DB Market',
        address: '0x00000000000000000000000000000000000000a1',
        baseToken: {
          symbol: 'USDC',
          address: '0x00000000000000000000000000000000000000b1',
          decimals: 6,
        },
      },
      price: {
        lastUpdatedAt: '2026-04-29T00:00:00.000Z',
        stale: false,
      },
      status: {
        halted: true,
      },
    });
  });

  it('falls back to fixture detail when DB has no rows', async () => {
    const service = await createService({ marketRows: [], snapshotRows: [] });
    const [firstMarket] = (await service.listMarkets()).markets;

    const detail = await service.getMarket(firstMarket.address.toUpperCase());

    expect(detail.address).toBe(firstMarket.address);
    expect(detail.description).toContain('Edge Capital');
    expect(detail.nav).toEqual({
      total: '40000000',
      senior: '30000000',
      junior: '10000000',
    });
    expect(detail.capabilities.depositBaseInstant).toBe(true);
    expect(detail.capabilities.withdrawBaseAsync).toBe(false);
  });

  it('throws NotFoundException when market is unknown', async () => {
    const service = await createService({ marketRows: [], snapshotRows: [] });

    await expect(
      service.getMarket('0x0000000000000000000000000000000000000999'),
    ).rejects.toThrow(NotFoundException);
  });
});
