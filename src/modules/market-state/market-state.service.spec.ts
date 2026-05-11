import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketSnapshots } from '@shared/database/schema';
import { MarketApyService } from './market-apy.service';
import { MarketFactsheetService } from './market-factsheet.service';
import { MARKET_CHART_CONFIG } from './market-metadata.config';
import { MarketStateService } from './market-state.service';

const LIVE_MARKET: LiveMarketState = {
  address: '0x3aDa769dC813e3376fCD40d05bEA12263048A487',
  ytTokenAddress: '0x00000000000000000000000000000000000000b1',
  baseTokenAddress: '0x00000000000000000000000000000000000000a0',
  seniorTrancheAddress: '0x00000000000000000000000000000000000000c1',
  juniorTrancheAddress: '0x00000000000000000000000000000000000000d1',
  seniorSymbol: 'st-mEDGE',
  juniorSymbol: 'jt-mEDGE',
  nav: '40000000000000000000000000',
  navSt: '30000000000000000000000000',
  navJt: '10000000000000000000000000',
  currentStJtRatio: '3000000000000000000',
  maxStJtRatio: '6000000000000000000',
  latestYtPrice: '1000000000000000000',
  lastUpdatedTime: '1777507200',
  halted: false,
  capabilities: {
    depositBaseInstant: true,
    depositBaseRequest: true,
    withdrawBaseAsync: false,
    withdrawBaseInstant: false,
  },
};

describe('MarketStateService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-30T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function snapshotRow(overrides: Partial<typeof marketSnapshots.$inferSelect> = {}) {
    return {
      id: 1,
      chainId: 84532,
      marketAddress: LIVE_MARKET.address.toLowerCase(),
      nav: '10',
      navSt: '6',
      navJt: '4',
      jtStRatio: '1500000000000000000',
      maxStJtRatio: '6000000000000000000',
      ytPrice: '1000000000000000000',
      stSharePrice: '1000000000000000000',
      jtSharePrice: '1000000000000000000',
      halted: 'false',
      blockNumber: '100',
      blockHash:
        '0x0000000000000000000000000000000000000000000000000000000000000100',
      sourceTxHash:
        '0x0000000000000000000000000000000000000000000000000000000000000200',
      sourceLogIndex: '7',
      snapshotAt: new Date('2026-05-04T00:00:00.000Z'),
      createdAt: new Date('2026-05-04T00:00:00.000Z'),
      ...overrides,
    };
  }

  async function createService(
    liveMarket: LiveMarketState = LIVE_MARKET,
    snapshots: Array<typeof marketSnapshots.$inferSelect> = [],
    tokenMetadata = { address: liveMarket.baseTokenAddress, symbol: 'USDC', decimals: 6 },
  ) {
    const contractReader = {
      getMarketState: vi.fn().mockResolvedValue(liveMarket),
      getTokenMetadata: vi.fn().mockResolvedValue(tokenMetadata),
    };
    const db = {
      query: {
        marketSnapshots: {
          findMany: vi.fn().mockResolvedValue(snapshots),
        },
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        MarketStateService,
        MarketApyService,
        MarketFactsheetService,
        {
          provide: ContractReaderService,
          useValue: contractReader,
        },
        {
          provide: DRIZZLE_DB,
          useValue: db,
        },
      ],
    }).compile();

    return {
      service: module.get(MarketStateService),
      contractReader,
      db,
    };
  }

  it('lists the configured live market from contract reads', async () => {
    const { service, contractReader } = await createService();

    const response = await service.listMarkets();

    expect(contractReader.getMarketState).toHaveBeenCalledTimes(1);
    expect(response.markets).toHaveLength(1);
    expect(response.markets[0]).toMatchObject({
      address: LIVE_MARKET.address,
      symbol: 'mEDGE',
      totalTvl: LIVE_MARKET.nav,
      senior: {
        symbol: 'st-mEDGE',
        tvl: LIVE_MARKET.navSt,
      },
      junior: {
        symbol: 'jt-mEDGE',
        tvl: LIVE_MARKET.navJt,
      },
      ratio: {
        display: '3:1',
        stJtRatio: '3',
        maxStJtRatio: '6',
      },
      status: {
        halted: false,
        stalePrice: false,
        warnings: [],
      },
    });
  });

  it('returns live market detail by address case-insensitively', async () => {
    const { service } = await createService();

    const detail = await service.getMarket(LIVE_MARKET.address.toUpperCase());

    expect(detail).toMatchObject({
      address: LIVE_MARKET.address,
      name: 'mEDGE',
      nav: {
        total: LIVE_MARKET.nav,
        senior: LIVE_MARKET.navSt,
        junior: LIVE_MARKET.navJt,
      },
      underlying: {
        symbol: 'mEDGE',
        address: LIVE_MARKET.ytTokenAddress,
        baseToken: {
          symbol: 'USDC',
          address: LIVE_MARKET.baseTokenAddress,
          decimals: 6,
        },
      },
      capabilities: {
        depositYt: true,
        withdrawYt: true,
        depositBaseInstant: true,
        depositBaseRequest: true,
        withdrawBaseAsync: false,
      },
    });
  });

  it('returns unavailable APY when fewer than two APY snapshots exist', async () => {
    const { service } = await createService(LIVE_MARKET, [snapshotRow()]);

    const detail = await service.getMarket(LIVE_MARKET.address);

    expect(detail.senior.apy).toBe('0');
    expect(detail.senior.apySource).toBe('unavailable');
    expect(detail.junior.apy).toBe('0');
    expect(detail.junior.apySource).toBe('unavailable');
  });

  it('returns indexed APY from tranche share-price snapshots', async () => {
    const { service } = await createService(LIVE_MARKET, [
      snapshotRow({
        stSharePrice: '1000000000000000000',
        jtSharePrice: '1000000000000000000',
        snapshotAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 2,
        blockNumber: '101',
        sourceLogIndex: '1',
        stSharePrice: '1010000000000000000',
        jtSharePrice: '1030000000000000000',
        snapshotAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
    ]);

    const detail = await service.getMarket(LIVE_MARKET.address);

    expect(detail.senior.apy).toBe('0.121666666666666666');
    expect(detail.senior.apySource).toBe('indexed_snapshots');
    expect(detail.junior.apy).toBe('0.365');
    expect(detail.junior.apySource).toBe('indexed_snapshots');
  });

  it('uses live ERC20 metadata for base token symbol and decimals', async () => {
    const { service, contractReader } = await createService(LIVE_MARKET, [], {
      address: LIVE_MARKET.baseTokenAddress,
      symbol: 'USDBC',
      decimals: 6,
    });

    const detail = await service.getMarket(LIVE_MARKET.address);

    expect(contractReader.getTokenMetadata).toHaveBeenCalledWith(LIVE_MARKET.baseTokenAddress);
    expect(detail.underlying.baseToken).toEqual({
      symbol: 'USDBC',
      address: LIVE_MARKET.baseTokenAddress,
      decimals: 6,
    });
  });

  it('throws NotFoundException when the address is not the configured live market', async () => {
    const { service } = await createService();

    await expect(
      service.getMarket('0x0000000000000000000000000000000000000999'),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not fall back to fixture markets when live reads fail', async () => {
    const contractReader = {
      getMarketState: vi.fn().mockRejectedValue(new Error('RPC unavailable')),
    };
    const module = await Test.createTestingModule({
      providers: [
        MarketStateService,
        MarketApyService,
        MarketFactsheetService,
        {
          provide: ContractReaderService,
          useValue: contractReader,
        },
      ],
    }).compile();
    const service = module.get(MarketStateService);

    await expect(service.listMarkets()).rejects.toThrow('RPC unavailable');
  });

  it('returns senior deposit limits from the canonical cap formula', async () => {
    const { service } = await createService();

    const limits = await service.getDepositLimits(LIVE_MARKET.address);

    expect(limits).toMatchObject({
      market: LIVE_MARKET.address,
      senior: {
        available: true,
        capacity: '30000000000000000000000000',
        reason: null,
        formula: 'D_max = J * L_max - S',
      },
      dataQuality: {
        sources: {
          nav: 'live_contract',
          limits: 'derived',
        },
      },
    });
  });

  it('marks senior deposits unavailable when capacity is exhausted', async () => {
    const { service } = await createService({
      ...LIVE_MARKET,
      navSt: '60000000000000000000000000',
    });

    const limits = await service.getDepositLimits(LIVE_MARKET.address);

    expect(limits.senior).toMatchObject({
      available: false,
      capacity: '0',
      reason: 'SENIOR_CAPACITY_EXHAUSTED',
    });
  });

  it('returns standalone price status using the market stale threshold', async () => {
    const { service } = await createService({
      ...LIVE_MARKET,
      lastUpdatedTime: '1777247999',
    });

    const status = await service.getPriceStatus(LIVE_MARKET.address);

    expect(status).toMatchObject({
      market: LIVE_MARKET.address,
      stale: true,
      staleAfterSeconds: 86400,
      warnings: ['STALE_PRICE'],
      dataQuality: {
        sources: {
          lastUpdatedTime: 'live_contract',
          staleStatus: 'derived',
        },
      },
    });
  });

  it('returns FE trade constraints with tokens, approvals, methods, capabilities, limits, and warnings', async () => {
    const { service } = await createService();

    const constraints = await service.getTradeConstraints(LIVE_MARKET.address);

    expect(constraints).toMatchObject({
      market: LIVE_MARKET.address,
      tokens: {
        yt: { symbol: 'mEDGE', address: LIVE_MARKET.ytTokenAddress, decimals: 18 },
        base: { symbol: 'USDC', address: LIVE_MARKET.baseTokenAddress, decimals: 6 },
        senior: { symbol: 'st-mEDGE', address: LIVE_MARKET.seniorTrancheAddress, decimals: 18 },
        junior: { symbol: 'jt-mEDGE', address: LIVE_MARKET.juniorTrancheAddress, decimals: 18 },
      },
      approvals: {
        depositYt: { token: LIVE_MARKET.ytTokenAddress, spender: LIVE_MARKET.address },
        depositBaseInstant: { token: LIVE_MARKET.baseTokenAddress, spender: LIVE_MARKET.address },
        withdrawSenior: { token: LIVE_MARKET.seniorTrancheAddress, spender: LIVE_MARKET.address },
        withdrawJunior: { token: LIVE_MARKET.juniorTrancheAddress, spender: LIVE_MARKET.address },
      },
      methods: {
        depositYt: 'depositYT',
        depositBaseInstant: 'depositInstant',
        withdrawYt: 'withdraw',
      },
      capabilities: {
        depositYt: true,
        withdrawYt: true,
        depositBaseInstant: true,
        depositBaseRequest: true,
        withdrawBaseAsync: false,
      },
      limits: {
        seniorDepositCapacity: '30000000000000000000000000',
        juniorWithdrawalCapacity: '5000000000000000000000000',
        seniorDepositCapacityYt: '30000000000000000000000000',
        juniorWithdrawalCapacityYt: '5000000000000000000000000',
        maxStJtRatio: LIVE_MARKET.maxStJtRatio,
        currentStJtRatio: LIVE_MARKET.currentStJtRatio,
      },
      settlement: {
        depositBaseInstant: 'Instant when adaptor liquidity is available',
        depositBaseRequest: 'Async request/settlement flow',
        withdrawYt: 'Direct YT withdrawal through tranche vault',
      },
      warnings: [],
      dataQuality: {
        sources: {
          tokens: 'config_address_live_metadata',
          approvals: 'derived',
          methods: 'contract_abi',
          capabilities: 'live_contract',
          limits: 'derived',
          settlement: 'config',
        },
      },
    });
    expect(constraints).not.toHaveProperty('walletConnected');
    expect(constraints).not.toHaveProperty('buttonLabel');
  });

  it('returns production factsheet rows with explicit source labels', async () => {
    const { service } = await createService();

    const factsheet = await service.getFactsheet(LIVE_MARKET.address);

    expect(factsheet.market).toBe(LIVE_MARKET.address);
    expect(factsheet.title).toBe('mEDGE Market Factsheet');
    expect(factsheet.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Market Address', value: LIVE_MARKET.address, source: 'live_contract' }),
        expect.objectContaining({ label: 'Network', value: 'Base Sepolia', source: 'config' }),
        expect.objectContaining({ label: 'Base Token', value: `USDC (${LIVE_MARKET.baseTokenAddress})`, source: 'config_address_live_metadata' }),
      ]),
    );
    expect(factsheet.rows.map((row) => row.source)).toContain('live_contract');
    expect(factsheet.rows.map((row) => row.source)).toContain('config');
    expect(factsheet.rows.map((row) => row.source)).toContain('config_address_live_metadata');
    expect(factsheet.rows.map((row) => row.label)).not.toContain('Carry Fee');
    expect(factsheet.dataQuality.sources.factsheet).toEqual({
      live: 'live_contract',
      config: 'config',
      unavailable: 'unavailable',
    });
  });

  it('keeps chart config metadata only without fixture data series', () => {
    expect(MARKET_CHART_CONFIG.tvl).toEqual({ label: 'TVL', unit: 'USD' });
    expect(MARKET_CHART_CONFIG.yield).not.toHaveProperty('values');
    expect(MARKET_CHART_CONFIG.utilization).not.toHaveProperty('value');
  });

  it('returns unavailable empty yield chart instead of mock fixtures', async () => {
    const { service } = await createService(LIVE_MARKET, []);

    const chart = await service.getChart(LIVE_MARKET.address, 'yield', '30d');

    expect(chart).toMatchObject({
      market: LIVE_MARKET.address,
      metric: 'yield',
      range: '30d',
      headline: {
        label: 'Yield APY',
        value: '0',
        unit: '%',
        source: 'unavailable',
      },
      series: [],
      dataQuality: {
        sources: {
          series: 'unavailable',
        },
      },
    });
  });

  it('returns unavailable empty yield chart when APY snapshots are insufficient', async () => {
    const { service } = await createService(LIVE_MARKET, [snapshotRow()]);

    const chart = await service.getChart(LIVE_MARKET.address, 'yield', '30d');

    expect(chart).toMatchObject({
      headline: {
        value: '0',
        source: 'unavailable',
      },
      series: [],
      dataQuality: {
        sources: {
          series: 'unavailable',
        },
      },
    });
  });

  it('returns yield chart from indexed APY snapshot rolling windows', async () => {
    const { service } = await createService(LIVE_MARKET, [
      snapshotRow({
        id: 1,
        blockNumber: '100',
        sourceLogIndex: '1',
        stSharePrice: '1000000000000000000',
        jtSharePrice: '1000000000000000000',
        snapshotAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 2,
        blockNumber: '101',
        sourceLogIndex: '1',
        stSharePrice: '1010000000000000000',
        jtSharePrice: '1030000000000000000',
        snapshotAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 3,
        blockNumber: '102',
        sourceLogIndex: '1',
        stSharePrice: '1020000000000000000',
        jtSharePrice: '1060000000000000000',
        snapshotAt: new Date('2026-05-31T00:00:00.000Z'),
      }),
    ]);

    const chart = await service.getChart(LIVE_MARKET.address, 'yield', '30d');

    expect(chart).toMatchObject({
      metric: 'yield',
      headline: {
        label: 'Yield APY',
        value: '0.354368932038834951',
        unit: '%',
        source: 'indexed_snapshots',
      },
      series: [
        {
          timestamp: '2026-05-01T00:00:00.000Z',
          value: '0.365',
          source: 'indexed_snapshots',
        },
        {
          timestamp: '2026-05-31T00:00:00.000Z',
          value: '0.354368932038834951',
          source: 'indexed_snapshots',
        },
      ],
      dataQuality: {
        sources: {
          charts: 'indexed_snapshots',
          series: 'indexed_snapshots',
        },
      },
    });
  });

  it('returns utilization chart from indexed snapshot ratio capacity', async () => {
    const { service } = await createService(LIVE_MARKET, [
      snapshotRow({
        blockNumber: '100',
        sourceLogIndex: '1',
        jtStRatio: '3000000000000000000',
        maxStJtRatio: '4000000000000000000',
        snapshotAt: new Date('2026-05-04T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 2,
        blockNumber: '99',
        sourceLogIndex: '1',
        jtStRatio: '1500000000000000000',
        maxStJtRatio: '6000000000000000000',
        snapshotAt: new Date('2026-05-03T00:00:00.000Z'),
      }),
    ]);

    const chart = await service.getChart(LIVE_MARKET.address, 'utilization', '30d');

    expect(chart).toMatchObject({
      headline: {
        value: '0.75',
        source: 'indexed_snapshots',
      },
      series: [
        {
          timestamp: '2026-05-03T00:00:00.000Z',
          value: '0.25',
          source: 'indexed_snapshots',
        },
        {
          timestamp: '2026-05-04T00:00:00.000Z',
          value: '0.75',
          source: 'indexed_snapshots',
        },
      ],
      dataQuality: {
        sources: {
          charts: 'indexed_snapshots',
          series: 'indexed_snapshots',
        },
      },
    });
  });

  it('does not fabricate utilization when snapshot max ratio is missing from backfilled rows', async () => {
    const { service } = await createService(LIVE_MARKET, [
      snapshotRow({
        blockNumber: '100',
        sourceLogIndex: '1',
        jtStRatio: '3000000000000000000',
        maxStJtRatio: '0',
        snapshotAt: new Date('2026-05-04T00:00:00.000Z'),
      }),
    ]);

    const chart = await service.getChart(LIVE_MARKET.address, 'utilization', '30d');

    expect(chart.headline.source).toBe('unavailable');
    expect(chart.series).toEqual([]);
    expect(chart.dataQuality.sources.charts).toBe('unavailable');
  });

  it.each([
    ['tvl', '10'],
    ['tokenPrice', '1000000000000000000'],
    ['ratio', '1500000000000000000'],
  ] as const)('returns %s chart from indexed snapshots', async (metric, value) => {
    const { service } = await createService(LIVE_MARKET, [
      snapshotRow({
        blockNumber: '100',
        sourceLogIndex: '1',
        nav: '10',
        ytPrice: '1000000000000000000',
        jtStRatio: '1500000000000000000',
        snapshotAt: new Date('2026-05-04T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 2,
        blockNumber: '99',
        sourceLogIndex: '1',
        nav: '9',
        ytPrice: '900000000000000000',
        jtStRatio: '1400000000000000000',
        snapshotAt: new Date('2026-05-03T00:00:00.000Z'),
      }),
    ]);

    const chart = await service.getChart(LIVE_MARKET.address, metric, '30d');

    expect(chart.headline).toMatchObject({
      value,
      source: 'indexed_snapshots',
    });
    expect(chart.series).toEqual([
      expect.objectContaining({
        timestamp: '2026-05-03T00:00:00.000Z',
        source: 'indexed_snapshots',
      }),
      expect.objectContaining({
        timestamp: '2026-05-04T00:00:00.000Z',
        value,
        source: 'indexed_snapshots',
      }),
    ]);
    expect(chart.dataQuality.sources.series).toBe('indexed_snapshots');
    expect(chart.dataQuality.sources.charts).toBe('indexed_snapshots');
  });

  it.each([
    ['7d', ['2026-05-24T00:00:00.000Z', '2026-05-31T00:00:00.000Z']],
    ['30d', ['2026-05-01T00:00:00.000Z', '2026-05-24T00:00:00.000Z', '2026-05-31T00:00:00.000Z']],
    ['90d', ['2026-03-02T00:00:00.000Z', '2026-05-01T00:00:00.000Z', '2026-05-24T00:00:00.000Z', '2026-05-31T00:00:00.000Z']],
    ['1y', ['2025-05-31T00:00:00.000Z', '2026-03-02T00:00:00.000Z', '2026-05-01T00:00:00.000Z', '2026-05-24T00:00:00.000Z', '2026-05-31T00:00:00.000Z']],
  ] as const)('limits chart snapshots to the requested %s range', async (range, expectedTimestamps) => {
    const { service } = await createService(LIVE_MARKET, [
      snapshotRow({
        blockNumber: '100',
        sourceLogIndex: '1',
        nav: '10',
        snapshotAt: new Date('2026-05-31T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 2,
        blockNumber: '99',
        sourceLogIndex: '1',
        nav: '9',
        snapshotAt: new Date('2026-05-24T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 3,
        blockNumber: '98',
        sourceLogIndex: '1',
        nav: '8',
        snapshotAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 4,
        blockNumber: '97',
        sourceLogIndex: '1',
        nav: '7',
        snapshotAt: new Date('2026-03-02T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 5,
        blockNumber: '96',
        sourceLogIndex: '1',
        nav: '6',
        snapshotAt: new Date('2025-05-31T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 6,
        blockNumber: '95',
        sourceLogIndex: '1',
        nav: '5',
        snapshotAt: new Date('2025-05-30T23:59:59.000Z'),
      }),
    ]);

    const chart = await service.getChart(LIVE_MARKET.address, 'tvl', range);

    expect(chart.range).toBe(range);
    expect(chart.series.map((point) => point.timestamp)).toEqual(expectedTimestamps);
  });

  it('accepts uppercase chart range labels from FE controls', async () => {
    const { service } = await createService(LIVE_MARKET, [
      snapshotRow({
        blockNumber: '100',
        sourceLogIndex: '1',
        nav: '10',
        snapshotAt: new Date('2026-05-31T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 2,
        blockNumber: '99',
        sourceLogIndex: '1',
        nav: '9',
        snapshotAt: new Date('2026-05-24T00:00:00.000Z'),
      }),
      snapshotRow({
        id: 3,
        blockNumber: '98',
        sourceLogIndex: '1',
        nav: '8',
        snapshotAt: new Date('2026-05-23T23:59:59.000Z'),
      }),
    ]);

    const chart = await service.getChart(LIVE_MARKET.address, 'tvl', '7D');

    expect(chart.range).toBe('7d');
    expect(chart.series.map((point) => point.timestamp)).toEqual([
      '2026-05-24T00:00:00.000Z',
      '2026-05-31T00:00:00.000Z',
    ]);
  });

  it('rejects unsupported chart ranges instead of returning misleading empty data', async () => {
    const { service } = await createService(LIVE_MARKET, []);

    await expect(service.getChart(LIVE_MARKET.address, 'tvl', '14d')).rejects.toMatchObject({
      response: {
        error: {
          code: 'INVALID_CHART_RANGE',
        },
      },
    });
  });

  it('returns empty indexed series instead of mock when indexed snapshots are missing', async () => {
    const { service } = await createService();

    const chart = await service.getChart(LIVE_MARKET.address, 'tvl', '30d');

    expect(chart.headline).toMatchObject({
      value: '0',
      source: 'unavailable',
    });
    expect(chart.series).toEqual([]);
    expect(chart.dataQuality.sources).toMatchObject({
      charts: 'unavailable',
      series: 'unavailable',
    });
  });

  it('returns paginated indexed market history', async () => {
    const { service, db } = await createService(LIVE_MARKET, [
      snapshotRow(),
      snapshotRow({ id: 2, blockNumber: '99' }),
    ]);

    const history = await service.getHistory(LIVE_MARKET.address, {
      limit: 1,
      cursor: 0,
    });

    expect(db.query.marketSnapshots.findMany).toHaveBeenCalled();
    expect(history).toMatchObject({
      market: LIVE_MARKET.address,
      items: [
        {
          blockNumber: '100',
          timestamp: '2026-05-04T00:00:00.000Z',
          nav: '10',
          navSt: '6',
          navJt: '4',
          stJtRatio: '1500000000000000000',
          ytPrice: '1000000000000000000',
          halted: false,
        },
      ],
      page: {
        limit: 1,
        nextCursor: 1,
        hasMore: true,
      },
      dataQuality: {
        sources: {
          history: 'indexed_events',
        },
      },
    });
  });

  it('throws NotFoundException for history when address is not configured live market', async () => {
    const { service } = await createService();

    await expect(
      service.getHistory('0x0000000000000000000000000000000000000999'),
    ).rejects.toThrow(NotFoundException);
  });
});
