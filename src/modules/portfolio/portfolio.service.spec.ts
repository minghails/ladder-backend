import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  ContractReaderService,
  type LiveMarketState,
  type LivePortfolioPosition,
} from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { PortfolioActivityRepository } from './portfolio-activity.repository';
import { PortfolioClaimablesRepository, type PortfolioClaimableDto } from './portfolio-claimables.repository';
import { PortfolioEarningsRepository, type PortfolioCashflowDto, type PortfolioCostBasisDto } from './portfolio-earnings.repository';
import { PortfolioService } from './portfolio.service';

type DepositRequestRow = {
  id: number;
  requestId: string;
  marketAddress: string;
  user: string;
  receiver: string;
  asSenior: boolean;
  tokenIn: string;
  amountIn: string;
  minYtOut: string;
  status: string;
  adaptorRequestId: string | null;
  reasonCode: string | null;
  txHash: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type FakeDb = {
  depositRequestRows: DepositRequestRow[];
};

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
  lastUpdatedTime: '1777392000',
  halted: false,
  capabilities: {
    depositBaseInstant: true,
    depositBaseRequest: true,
    withdrawBaseAsync: false,
    withdrawBaseInstant: false,
  },
};

const LIVE_POSITIONS: LivePortfolioPosition[] = [
  {
    marketAddress: LIVE_MARKET.address,
    marketSymbol: 'mEDGE',
    assetType: 'senior',
    assetSymbol: 'st-mEDGE',
    tokenAddress: LIVE_MARKET.seniorTrancheAddress,
    shares: '100000000000000000000',
    assets: '100000000000000000000',
    value: '100000000000000000000',
  },
  {
    marketAddress: LIVE_MARKET.address,
    marketSymbol: 'mEDGE',
    assetType: 'junior',
    assetSymbol: 'jt-mEDGE',
    tokenAddress: LIVE_MARKET.juniorTrancheAddress,
    shares: '50000000000000000000',
    assets: '50000000000000000000',
    value: '50000000000000000000',
  },
];

const DB_REQUEST_ROWS: DepositRequestRow[] = [
  {
    id: 1,
    requestId: '42',
    marketAddress: LIVE_MARKET.address,
    user: '0xabcdef0000000000000000000000000000000001',
    receiver: '0xabcdef0000000000000000000000000000000001',
    asSenior: true,
    tokenIn: '0x00000000000000000000000000000000000000a0',
    amountIn: '99800',
    minYtOut: '99000',
    status: 'requested',
    adaptorRequestId: '77',
    reasonCode: null,
    txHash: '0xabc',
    createdAt: new Date('2026-04-14T00:00:00.000Z'),
    updatedAt: new Date('2026-04-14T00:00:00.000Z'),
  },
  {
    id: 2,
    requestId: '43',
    marketAddress: LIVE_MARKET.address,
    user: '0x1111111111111111111111111111111111111111',
    receiver: '0xabcdef0000000000000000000000000000000001',
    asSenior: false,
    tokenIn: '0x00000000000000000000000000000000000000a0',
    amountIn: '76600',
    minYtOut: '76000',
    status: 'settled',
    adaptorRequestId: '78',
    reasonCode: null,
    txHash: null,
    createdAt: new Date('2026-04-10T00:00:00.000Z'),
    updatedAt: new Date('2026-04-11T00:00:00.000Z'),
  },
  {
    id: 3,
    requestId: '44',
    marketAddress: LIVE_MARKET.address,
    user: '0x2222222222222222222222222222222222222222',
    receiver: '0x2222222222222222222222222222222222222222',
    asSenior: false,
    tokenIn: '0x00000000000000000000000000000000000000a0',
    amountIn: '500',
    minYtOut: '490',
    status: 'requested',
    adaptorRequestId: null,
    reasonCode: null,
    txHash: null,
    createdAt: new Date('2026-04-09T00:00:00.000Z'),
    updatedAt: new Date('2026-04-09T00:00:00.000Z'),
  },
];

describe('PortfolioService', () => {
  async function withPortfolioMockFallback<T>(callback: () => Promise<T>): Promise<T> {
    const previous = process.env['PORTFOLIO_MOCK_FALLBACK'];
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';

    try {
      return await callback();
    } finally {
      if (previous === undefined) {
        delete process.env['PORTFOLIO_MOCK_FALLBACK'];
      } else {
        process.env['PORTFOLIO_MOCK_FALLBACK'] = previous;
      }
    }
  }

  async function createService({
    fakeDb,
    positions = LIVE_POSITIONS,
    market = LIVE_MARKET,
    activities = [],
    claimables = [],
    costBasisRows = [],
    cashflowRows = [],
  }: {
    fakeDb?: FakeDb;
    positions?: LivePortfolioPosition[];
    market?: LiveMarketState;
    activities?: Awaited<ReturnType<PortfolioActivityRepository['findByWallet']>>;
    claimables?: PortfolioClaimableDto[];
    costBasisRows?: PortfolioCostBasisDto[];
    cashflowRows?: PortfolioCashflowDto[];
  } = {}) {
    const contractReader = {
      getPortfolioPositions: vi.fn().mockResolvedValue(positions),
      getMarketState: vi.fn().mockResolvedValue(market),
    };
    const activityRepository = {
      findByWallet: vi.fn().mockResolvedValue(activities),
    };
    const earningsRepository = {
      findCostBasis: vi.fn().mockResolvedValue(costBasisRows),
      findCashflowsSince: vi.fn().mockResolvedValue(cashflowRows),
    };
    const claimablesRepository = {
      findByWallet: vi.fn().mockResolvedValue(claimables),
    };

    const module = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: ContractReaderService,
          useValue: contractReader,
        },
        {
          provide: PortfolioActivityRepository,
          useValue: activityRepository,
        },
        {
          provide: PortfolioEarningsRepository,
          useValue: earningsRepository,
        },
        {
          provide: PortfolioClaimablesRepository,
          useValue: claimablesRepository,
        },
        {
          provide: DRIZZLE_DB,
          useValue: fakeDb,
        },
      ],
    }).compile();

    return {
      service: module.get(PortfolioService),
      contractReader,
      activityRepository,
      earningsRepository,
      claimablesRepository,
    };
  }

  it('returns portfolio summary and positions from live tranche balances without mock sections by default', async () => {
    const { service, contractReader } = await createService();

    const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

    expect(contractReader.getPortfolioPositions).toHaveBeenCalledWith(
      '0xabcdef0000000000000000000000000000000001',
    );
    expect(portfolio.walletAddress).toBe('0xabcdef0000000000000000000000000000000001');
    expect(portfolio.summary).toMatchObject({
      totalValue: '150000000000000000000',
      currentEarning: '0',
      earning30d: '0',
      claimable: {
        amount: '0',
        token: 'USDC',
      },
    });
    expect(portfolio.positions).toEqual([
      {
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        assetType: 'senior',
        assetSymbol: 'st-mEDGE',
        tokenAddress: LIVE_MARKET.seniorTrancheAddress,
        amount: '100000000000000000000',
        value: '100000000000000000000',
        currentApy: '0',
        allocationPercent: '0.666666666666666666',
        source: 'live',
        apySource: 'placeholder',
      },
      {
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        assetType: 'junior',
        assetSymbol: 'jt-mEDGE',
        tokenAddress: LIVE_MARKET.juniorTrancheAddress,
        amount: '50000000000000000000',
        value: '50000000000000000000',
        currentApy: '0',
        allocationPercent: '0.333333333333333333',
        source: 'live',
        apySource: 'placeholder',
      },
    ]);
    expect(portfolio.portfolioMetrics).toEqual({
      totalValue: '150000000000000000000',
      netApy: '0',
      netApySource: 'unavailable',
    });
    expect(portfolio.claimableItems).toEqual([]);
    expect(portfolio.recentActivities).toEqual([]);
    expect(portfolio.dataQuality).toEqual({
      earningsEstimated: false,
      historyAvailable: false,
      activityIndexedUntilBlock: null,
      mockEnabled: false,
      mockedSections: [],
      sources: {
        positions: 'live',
        pendingRequests: 'db',
        earnings: 'unavailable',
        earningsHistory: 'unavailable',
        claimableItems: 'unavailable',
        recentActivities: 'unavailable',
      },
    });
    expect(portfolio.links.earnings).toContain('/portfolio/0xabcdef0000000000000000000000000000000001/earnings');
  });

  it('uses live earnings projection in portfolio overview summary', async () => {
    const { service } = await createService({
      positions: [
        {
          marketAddress: LIVE_MARKET.address,
          marketSymbol: 'mEDGE',
          assetType: 'senior',
          assetSymbol: 'st-mEDGE',
          tokenAddress: LIVE_MARKET.seniorTrancheAddress,
          shares: '100',
          assets: '100',
          value: '1300',
        },
      ],
      costBasisRows: [
        {
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          tranche: 'senior',
          openShares: '100',
          openCostBasis: '1000',
          realizedPnl: '200',
          depositedValue: '1000',
          withdrawnValue: '600',
          dataQuality: 'full',
        },
      ],
    });

    const response = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

    expect(response.summary.currentEarning).toBe('500');
    expect(response.summary.currentEarningSource).toBe('indexed_events');
    expect(response.summary.earning30d).toBe('0');
    expect(response.summary.earning30dSource).toBe('unavailable');
    expect(response.summary.totalValueChange.source).toBe('indexed_events');
    expect(response.dataQuality.sources.earnings).toBe('indexed_events');
  });

  it('uses live claimables in portfolio overview preview and summary', async () => {
    const { service, claimablesRepository } = await createService({
      claimables: [
        {
          id: 'refund-42',
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          marketSymbol: 'mEDGE',
          date: '2026-04-14T00:00:00.000Z',
          type: 'refund',
          amount: '99800',
          token: LIVE_MARKET.baseTokenAddress,
          action: { label: 'Refund', enabled: true, reason: null },
          source: 'db',
        },
      ],
    });

    const response = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

    expect(claimablesRepository.findByWallet).toHaveBeenCalledWith('0xabcdef0000000000000000000000000000000001', 'mEDGE');
    expect(response.claimableItems).toEqual([
      expect.objectContaining({
        id: 'refund-42',
        type: 'refund',
        source: 'db',
      }),
    ]);
    expect(response.summary.claimable).toEqual({
      amount: '99800',
      token: 'USDC',
      source: 'db',
    });
    expect(response.dataQuality.sources.claimableItems).toBe('db');
  });

  it('returns zero totals and no positions when live balances are empty', async () => {
    const { service } = await createService({ positions: [] });

    const portfolio = await service.getPortfolio('0xabcdef0000000000000000000000000000000001');

    expect(portfolio.summary.totalValue).toBe('0');
    expect(portfolio.positions).toEqual([]);
    expect(portfolio.portfolioMetrics).toEqual({
      totalValue: '0',
      netApy: '0',
      netApySource: 'unavailable',
    });
  });

  it('includes DB-backed pending request previews in the portfolio overview', async () => {
    const { service } = await createService({ fakeDb: { depositRequestRows: DB_REQUEST_ROWS } });

    const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

    expect(portfolio.pendingRequests).toEqual([
      {
        id: '42',
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        date: '2026-04-14T00:00:00.000Z',
        type: 'buy_senior_token',
        amount: '99800',
        value: '99800',
        status: 'pending',
        ladderRequestId: '42',
        adaptorRequestId: '77',
        txHash: '0xabc',
        settlement: {
          estimatedAt: null,
          note: 'Final value may vary at settlement',
        },
        source: 'db',
      },
    ]);
  });

  it('uses indexed activities in overview and marks recentActivities as db-sourced', async () => {
    const activities = [
      {
        id: '0xactivity:0',
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        date: '2026-05-04T00:00:00.000Z',
        type: 'buy_senior_token' as const,
        amount: '100',
        value: '90',
        status: 'success' as const,
        txHash: '0xactivity',
        source: 'db' as const,
      },
    ];
    const { service, activityRepository } = await createService({ activities });

    const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
    });

    expect(activityRepository.findByWallet).toHaveBeenCalledWith('0xabcdef0000000000000000000000000000000001', 'mEDGE');
    expect(portfolio.recentActivities).toEqual(activities);
    expect(portfolio.dataQuality.sources.recentActivities).toBe('db');
    expect(portfolio.dataQuality.mockedSections).not.toContain('recentActivities');
  });

  it('returns paginated indexed activities and does not mix mock rows when real activity rows exist', async () => {
    const activities = [
      {
        id: '0xactivity1:0',
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        date: '2026-05-04T00:00:00.000Z',
        type: 'buy_senior_token' as const,
        amount: '100',
        value: '90',
        status: 'success' as const,
        txHash: '0xactivity1',
        source: 'db' as const,
      },
      {
        id: '0xactivity2:0',
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        date: '2026-05-03T00:00:00.000Z',
        type: 'sell_junior_token' as const,
        amount: '50',
        value: '45',
        status: 'success' as const,
        txHash: '0xactivity2',
        source: 'db' as const,
      },
    ];
    const { service } = await createService({ activities });

    const response = await service.getActivities('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      limit: 1,
    });

    expect(response.items).toEqual([activities[0]]);
    expect(response.page).toEqual({ limit: 1, nextCursor: '1', hasMore: true });
  });

  it('labels unavailable overview financial aggregates without mock fallback by default', async () => {
    const previousMockFallback = process.env['PORTFOLIO_MOCK_FALLBACK'];
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';
    const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

    try {
      const response = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

      expect(response.summary.totalValueChange).toEqual({
        amount: '0',
        percent: '0',
        source: 'unavailable',
      });
      expect(response.summary.currentEarning).toBe('0');
      expect(response.summary.currentEarningSource).toBe('unavailable');
      expect(response.summary.earning30d).toBe('0');
      expect(response.summary.earning30dSource).toBe('unavailable');
      expect(response.summary.claimable).toEqual({
        amount: '0',
        token: 'USDC',
        source: 'unavailable',
      });
      expect(response.portfolioMetrics).toEqual({
        totalValue: '150000000000000000000',
        netApy: '0',
        netApySource: 'unavailable',
      });
      expect(response.dataQuality.mockedSections).toEqual([]);
    } finally {
      if (previousMockFallback === undefined) {
        delete process.env['PORTFOLIO_MOCK_FALLBACK'];
      } else {
        process.env['PORTFOLIO_MOCK_FALLBACK'] = previousMockFallback;
      }
    }
  });

  it('does not use mock values or rows in portfolio overview even when sandbox mock fallback is enabled', async () => {
    await withPortfolioMockFallback(async () => {
      const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

      const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001', {
        includeMock: true,
      });

      expect(portfolio.summary.totalValueChange).toEqual({
        amount: '0',
        percent: '0',
        source: 'unavailable',
      });
      expect(portfolio.summary.currentEarningSource).toBe('unavailable');
      expect(portfolio.summary.earning30dSource).toBe('unavailable');
      expect(portfolio.summary.claimable.source).toBe('unavailable');
      expect(portfolio.portfolioMetrics.netApySource).toBe('unavailable');
      expect(portfolio.claimableItems).toEqual([]);
      expect(portfolio.pendingRequests).toEqual([]);
      expect(portfolio.recentActivities).toEqual([]);
      expect(portfolio.dataQuality.mockEnabled).toBe(false);
      expect(portfolio.dataQuality.mockedSections).toEqual([]);
      expect(portfolio.links.activities).not.toContain('includeMock=true');
    });
  });

  it('ignores includeMock in production even when sandbox env is enabled', async () => {
    const previousNodeEnv = process.env['NODE_ENV'];
    const previousMockFallback = process.env['PORTFOLIO_MOCK_FALLBACK'];
    process.env['NODE_ENV'] = 'production';
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';
    const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

    try {
      const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001', {
        includeMock: true,
      });

      expect(portfolio.claimableItems).toEqual([]);
      expect(portfolio.pendingRequests).toEqual([]);
      expect(portfolio.recentActivities).toEqual([]);
      expect(portfolio.dataQuality.mockEnabled).toBe(false);
      expect(portfolio.dataQuality.mockedSections).toEqual([]);
      expect(portfolio.summary.currentEarningSource).toBe('unavailable');
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env['NODE_ENV'];
      } else {
        process.env['NODE_ENV'] = previousNodeEnv;
      }

      if (previousMockFallback === undefined) {
        delete process.env['PORTFOLIO_MOCK_FALLBACK'];
      } else {
        process.env['PORTFOLIO_MOCK_FALLBACK'] = previousMockFallback;
      }
    }
  });

  it('returns paginated DB requests and does not mix mock rows when real request rows exist', async () => {
    const { service } = await createService({ fakeDb: { depositRequestRows: DB_REQUEST_ROWS } });

    const response = await service.getRequests('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      limit: 1,
    });

    expect(response.requests).toHaveLength(1);
    expect(response.requests[0]?.id).toBe('42');
    expect(response.requests[0]?.source).toBe('db');
    expect(response.page).toEqual({ limit: 1, nextCursor: '1', hasMore: true });
  });

  it('returns empty requests when includeMock is requested and DB has no rows', async () => {
    await withPortfolioMockFallback(async () => {
      const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

      const response = await service.getRequests('0xABCDEF0000000000000000000000000000000001', {
        includeMock: true,
        limit: 2,
      });

      expect(response.requests).toEqual([]);
      expect(response.page).toEqual({ limit: 2, nextCursor: null, hasMore: false });
    });
  });

  it('does not return mock earnings or history when sandbox mock fallback is enabled', async () => {
    await withPortfolioMockFallback(async () => {
      const { service } = await createService();

      const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001', {
        includeMock: true,
        range: '30d',
        granularity: 'day',
      });

      expect(response.walletAddress).toBe('0xabcdef0000000000000000000000000000000001');
      expect(response.earnings).toEqual([]);
      expect(response.history).toEqual({ range: '30d', granularity: 'day', series: [] });
      expect(response.dataQuality.mockEnabled).toBe(false);
      expect(response.dataQuality.mockedSections).toEqual([]);
      expect(response.dataQuality.sources.earnings).toBe('unavailable');
      expect(response.dataQuality.sources.earningsHistory).toBe('unavailable');
    });
  });

  it('returns live earnings from cost basis and live positions', async () => {
    const { service, earningsRepository } = await createService({
      positions: [
        {
          marketAddress: LIVE_MARKET.address,
          marketSymbol: 'mEDGE',
          assetType: 'senior',
          assetSymbol: 'st-mEDGE',
          tokenAddress: LIVE_MARKET.seniorTrancheAddress,
          shares: '100',
          assets: '100',
          value: '1300',
        },
      ],
      costBasisRows: [
        {
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          tranche: 'senior',
          openShares: '100',
          openCostBasis: '1000',
          realizedPnl: '200',
          depositedValue: '1000',
          withdrawnValue: '600',
          dataQuality: 'full',
        },
      ],
    });

    const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001');

    expect(earningsRepository.findCostBasis).toHaveBeenCalledWith('0xabcdef0000000000000000000000000000000001');
    expect(response.earnings).toEqual([
      expect.objectContaining({
        marketAddress: LIVE_MARKET.address,
        assetType: 'senior',
        lifetime: '500',
        earning30d: '0',
        source: 'indexed_events',
      }),
    ]);
    expect(response.history.series).toEqual([]);
    expect(response.dataQuality.sources.earnings).toBe('indexed_events');
    expect(response.dataQuality.sources.earningsHistory).toBe('unavailable');
    expect(response.dataQuality.historyAvailable).toBe(false);
  });

  it('builds earnings history from real cashflows only', async () => {
    const { service, earningsRepository } = await createService({
      cashflowRows: [
        {
          id: 1,
          chainId: 84532,
          marketAddress: LIVE_MARKET.address,
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          tranche: 'senior',
          type: 'deposit',
          sharesDelta: '100',
          assetsDelta: '90',
          valueDelta: '1000',
          txHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
          logIndex: '1',
          blockNumber: '10',
          blockTimestamp: new Date('2026-05-01T12:00:00.000Z'),
          sourceEventName: 'DepositYT',
          createdAt: new Date('2026-05-01T12:00:01.000Z'),
        },
        {
          id: 2,
          chainId: 84532,
          marketAddress: LIVE_MARKET.address,
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          tranche: 'junior',
          type: 'withdraw',
          sharesDelta: '-20',
          assetsDelta: '-18',
          valueDelta: '-300',
          txHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
          logIndex: '2',
          blockNumber: '11',
          blockTimestamp: new Date('2026-05-02T12:00:00.000Z'),
          sourceEventName: 'WithdrawYT',
          createdAt: new Date('2026-05-02T12:00:01.000Z'),
        },
      ],
      costBasisRows: [
        {
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          tranche: 'senior',
          openShares: '100',
          openCostBasis: '1000',
          realizedPnl: '0',
          depositedValue: '1000',
          withdrawnValue: '0',
          dataQuality: 'full',
        },
      ],
    });

    const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001', { range: '7d' });

    expect(earningsRepository.findCashflowsSince).toHaveBeenCalledWith(
      '0xabcdef0000000000000000000000000000000001',
      expect.any(Date),
    );
    expect(response.history.series).toEqual([
      {
        id: 'senior',
        label: 'Senior Token',
        points: [{ date: '2026-05-01', value: '1000' }],
        source: 'indexed_events',
      },
      {
        id: 'junior',
        label: 'Junior Token',
        points: [{ date: '2026-05-02', value: '-300' }],
        source: 'indexed_events',
      },
    ]);
    expect(response.dataQuality.historyAvailable).toBe(true);
    expect(response.dataQuality.sources.earningsHistory).toBe('indexed_events');
  });

  it('marks earnings history partial when cost-basis history is partial', async () => {
    const { service } = await createService({
      cashflowRows: [
        {
          id: 1,
          chainId: 84532,
          marketAddress: LIVE_MARKET.address,
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          tranche: 'senior',
          type: 'withdraw',
          sharesDelta: '-20',
          assetsDelta: '-18',
          valueDelta: '-300',
          txHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
          logIndex: '1',
          blockNumber: '10',
          blockTimestamp: new Date('2026-05-02T12:00:00.000Z'),
          sourceEventName: 'WithdrawYT',
          createdAt: new Date('2026-05-02T12:00:01.000Z'),
        },
      ],
      costBasisRows: [
        {
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          tranche: 'senior',
          openShares: '0',
          openCostBasis: '0',
          realizedPnl: '-300',
          depositedValue: '0',
          withdrawnValue: '300',
          dataQuality: 'partial',
        },
      ],
    });

    const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001', { range: '7d' });

    expect(response.history.series[0]?.source).toBe('partial_indexed_events');
    expect(response.dataQuality.sources.earningsHistory).toBe('partial_indexed_events');
  });

  it('returns empty unavailable earnings by default without mock rows', async () => {
    const previousMockFallback = process.env['PORTFOLIO_MOCK_FALLBACK'];
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';
    const { service } = await createService();

    try {
      const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001');

      expect(response).toEqual({
        walletAddress: '0xabcdef0000000000000000000000000000000001',
        earnings: [],
        history: {
          range: '30d',
          granularity: 'day',
          series: [],
        },
        dataQuality: {
          earningsEstimated: false,
          historyAvailable: false,
          activityIndexedUntilBlock: null,
          mockEnabled: false,
          mockedSections: [],
          sources: {
            positions: 'live',
            pendingRequests: 'db',
            earnings: 'unavailable',
            earningsHistory: 'unavailable',
            claimableItems: 'unavailable',
            recentActivities: 'unavailable',
          },
        },
      });
    } finally {
      if (previousMockFallback === undefined) {
        delete process.env['PORTFOLIO_MOCK_FALLBACK'];
      } else {
        process.env['PORTFOLIO_MOCK_FALLBACK'] = previousMockFallback;
      }
    }
  });

  it('keeps earnings unavailable when includeMock is requested without real rows', async () => {
    await withPortfolioMockFallback(async () => {
      const { service } = await createService();

      const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001', {
        includeMock: true,
        range: '7d',
        granularity: 'day',
      });

      expect(response.earnings).toEqual([]);
      expect(response.history.series).toEqual([]);
      expect(response.dataQuality.mockEnabled).toBe(false);
      expect(response.dataQuality.mockedSections).toEqual([]);
    });
  });

  it('returns rejected unrefunded deposit requests as live claimables', async () => {
    const { service, claimablesRepository } = await createService({
      claimables: [
        {
          id: 'refund-42',
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          marketSymbol: 'mEDGE',
          date: '2026-04-14T00:00:00.000Z',
          type: 'refund',
          amount: '99800',
          token: LIVE_MARKET.baseTokenAddress,
          action: { label: 'Refund', enabled: true, reason: null },
          source: 'db',
        },
      ],
    });

    const response = await service.getClaimables('0xABCDEF0000000000000000000000000000000001');

    expect(claimablesRepository.findByWallet).toHaveBeenCalledWith('0xabcdef0000000000000000000000000000000001', 'mEDGE');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]).toEqual(
      expect.objectContaining({
        id: 'refund-42',
        type: 'refund',
        source: 'db',
      }),
    );
  });

  it('paginates DB-backed claimables without mock rows', async () => {
    const { service } = await createService({
      claimables: [
        {
          id: 'refund-42',
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          marketSymbol: 'mEDGE',
          date: '2026-04-14T00:00:00.000Z',
          type: 'refund',
          amount: '99800',
          token: LIVE_MARKET.baseTokenAddress,
          action: { label: 'Refund', enabled: true, reason: null },
          source: 'db',
        },
        {
          id: 'refund-43',
          walletAddress: '0xabcdef0000000000000000000000000000000001',
          marketAddress: LIVE_MARKET.address,
          marketSymbol: 'mEDGE',
          date: '2026-04-13T00:00:00.000Z',
          type: 'refund',
          amount: '50000',
          token: LIVE_MARKET.baseTokenAddress,
          action: { label: 'Refund', enabled: true, reason: null },
          source: 'db',
        },
      ],
    });

    const response = await service.getClaimables('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      limit: 1,
    });

    expect(response.items).toEqual([expect.objectContaining({ id: 'refund-42', source: 'db' })]);
    expect(response.page).toEqual({ limit: 1, nextCursor: '1', hasMore: true });
  });

  it('returns empty claimables by default without mock rows', async () => {
    const previousMockFallback = process.env['PORTFOLIO_MOCK_FALLBACK'];
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';
    const { service } = await createService();

    try {
      const response = await service.getClaimables('0xABCDEF0000000000000000000000000000000001');

      expect(response).toMatchObject({
        walletAddress: '0xabcdef0000000000000000000000000000000001',
        items: [],
        page: {
          limit: 20,
          nextCursor: null,
          hasMore: false,
        },
        dataQuality: {
          sources: {
            claimableItems: 'unavailable',
          },
        },
      });
    } finally {
      if (previousMockFallback === undefined) {
        delete process.env['PORTFOLIO_MOCK_FALLBACK'];
      } else {
        process.env['PORTFOLIO_MOCK_FALLBACK'] = previousMockFallback;
      }
    }
  });

  it('returns empty claimables when includeMock is requested without DB rows', async () => {
    await withPortfolioMockFallback(async () => {
      const { service } = await createService();

      const response = await service.getClaimables('0xABCDEF0000000000000000000000000000000001', {
        includeMock: true,
        limit: 2,
      });

      expect(response.items).toEqual([]);
      expect(response.page).toEqual({
        limit: 2,
        nextCursor: null,
        hasMore: false,
      });
    });
  });

  it('returns empty activities when includeMock is requested without indexed rows', async () => {
    await withPortfolioMockFallback(async () => {
      const { service } = await createService();

      const response = await service.getActivities('0xABCDEF0000000000000000000000000000000001', {
        includeMock: true,
        limit: 2,
      });

      expect(response.items).toEqual([]);
      expect(response.page).toEqual({ limit: 2, nextCursor: null, hasMore: false });
    });
  });
});
