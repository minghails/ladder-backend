import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketSnapshots } from '@shared/database/schema';
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
      ytPrice: '1000000000000000000',
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

  it('returns config-backed factsheet rows labelled by source', async () => {
    const { service } = await createService();

    const factsheet = await service.getFactsheet(LIVE_MARKET.address);

    expect(factsheet.market).toBe(LIVE_MARKET.address);
    expect(factsheet.title).toBe('mEDGE Market Factsheet');
    expect(factsheet.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Underlying', value: 'mEDGE', source: 'config' }),
        expect.objectContaining({ label: 'Network', value: 'Base Sepolia', source: 'config' }),
      ]),
    );
    expect(factsheet.dataQuality.sources.factsheet).toBe('config');
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

  it('returns unavailable empty utilization chart instead of mock fixtures', async () => {
    const { service } = await createService(LIVE_MARKET, []);

    const chart = await service.getChart(LIVE_MARKET.address, 'utilization', '30d');

    expect(chart.headline.source).toBe('unavailable');
    expect(chart.series).toEqual([]);
    expect(chart.dataQuality.sources.series).toBe('unavailable');
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
      source: 'indexed_events',
    });
    expect(chart.series).toEqual([
      expect.objectContaining({
        timestamp: '2026-05-03T00:00:00.000Z',
        source: 'indexed_events',
      }),
      expect.objectContaining({
        timestamp: '2026-05-04T00:00:00.000Z',
        value,
        source: 'indexed_events',
      }),
    ]);
    expect(chart.dataQuality.sources.series).toBe('indexed_events');
  });

  it('returns empty indexed series instead of mock when indexed snapshots are missing', async () => {
    const { service } = await createService();

    const chart = await service.getChart(LIVE_MARKET.address, 'tvl', '30d');

    expect(chart.headline).toMatchObject({
      value: '0',
      source: 'indexed_events',
    });
    expect(chart.series).toEqual([]);
    expect(chart.dataQuality.sources.series).toBe('indexed_events');
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
