import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  ContractReaderService,
  type LiveMarketState,
  type LivePortfolioPosition,
} from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { PortfolioActivityRepository } from './portfolio-activity.repository';
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
  async function createService({
    fakeDb,
    positions = LIVE_POSITIONS,
    market = LIVE_MARKET,
    activities = [],
  }: {
    fakeDb?: FakeDb;
    positions?: LivePortfolioPosition[];
    market?: LiveMarketState;
    activities?: Awaited<ReturnType<PortfolioActivityRepository['findByWallet']>>;
  } = {}) {
    const contractReader = {
      getPortfolioPositions: vi.fn().mockResolvedValue(positions),
      getMarketState: vi.fn().mockResolvedValue(market),
    };
    const activityRepository = {
      findByWallet: vi.fn().mockResolvedValue(activities),
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
          provide: DRIZZLE_DB,
          useValue: fakeDb,
        },
      ],
    }).compile();

    return {
      service: module.get(PortfolioService),
      contractReader,
      activityRepository,
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
      netApySource: 'placeholder',
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

  it('returns zero totals and no positions when live balances are empty', async () => {
    const { service } = await createService({ positions: [] });

    const portfolio = await service.getPortfolio('0xabcdef0000000000000000000000000000000001');

    expect(portfolio.summary.totalValue).toBe('0');
    expect(portfolio.positions).toEqual([]);
    expect(portfolio.portfolioMetrics).toEqual({
      totalValue: '0',
      netApy: '0',
      netApySource: 'placeholder',
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

  it('uses mock opt-in for full initial UI previews without generating heavy chart data', async () => {
    const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

    const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
    });

    expect(portfolio.summary.currentEarning).not.toBe('0');
    expect(portfolio.summary.totalValueChange.source).toBe('mock');
    expect(portfolio.claimableItems).toHaveLength(3);
    expect(portfolio.pendingRequests).toHaveLength(3);
    expect(portfolio.recentActivities).toHaveLength(5);
    expect(portfolio).not.toHaveProperty('earningsHistory');
    expect(portfolio.dataQuality.mockEnabled).toBe(true);
    expect(portfolio.dataQuality.mockedSections).toContain('recentActivities');
    expect(portfolio.links.activities).toContain('includeMock=true');
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

  it('returns mock requests with pagination only when requested and DB has no rows', async () => {
    const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

    const response = await service.getRequests('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      limit: 2,
    });

    expect(response.requests).toHaveLength(2);
    expect(response.requests.every((request) => request.source === 'mock')).toBe(true);
    expect(response.page).toEqual({ limit: 2, nextCursor: '2', hasMore: true });
  });

  it('returns mock earnings with controlled range and no pagination-heavy payload', async () => {
    const { service } = await createService();

    const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      range: '30d',
      granularity: 'day',
    });

    expect(response.walletAddress).toBe('0xabcdef0000000000000000000000000000000001');
    expect(response.earnings.length).toBeGreaterThan(0);
    expect(response.history.range).toBe('30d');
    expect(response.history.series[0]?.points).toHaveLength(30);
    expect(response.dataQuality.sources.earnings).toBe('mock');
  });

  it('returns empty earnings when mock is not enabled', async () => {
    const { service } = await createService();

    const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001');

    expect(response.earnings).toEqual([]);
    expect(response.history.series).toEqual([]);
    expect(response.dataQuality.historyAvailable).toBe(false);
  });

  it('returns paginated mock claimables and activities for lazy FE sections', async () => {
    const { service } = await createService();

    const claimables = await service.getClaimables('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      limit: 2,
    });
    const activities = await service.getActivities('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      limit: 2,
    });

    expect(claimables.items).toHaveLength(2);
    expect(claimables.items.every((item) => !item.action.enabled)).toBe(true);
    expect(claimables.page).toEqual({ limit: 2, nextCursor: '2', hasMore: true });
    expect(activities.items).toHaveLength(2);
    expect(activities.items.every((item) => item.source === 'mock')).toBe(true);
    expect(activities.page).toEqual({ limit: 2, nextCursor: '2', hasMore: true });
  });
});
