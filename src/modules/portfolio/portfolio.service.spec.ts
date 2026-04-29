import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  ContractReaderService,
  type LiveMarketState,
  type LivePortfolioPosition,
} from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
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

describe('PortfolioService', () => {
  async function createService({
    fakeDb,
    positions = LIVE_POSITIONS,
    market = LIVE_MARKET,
  }: {
    fakeDb?: FakeDb;
    positions?: LivePortfolioPosition[];
    market?: LiveMarketState;
  } = {}) {
    const contractReader = {
      getPortfolioPositions: vi.fn().mockResolvedValue(positions),
      getMarketState: vi.fn().mockResolvedValue(market),
    };

    const module = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: ContractReaderService,
          useValue: contractReader,
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
    };
  }

  it('returns portfolio summary and positions from live tranche balances', async () => {
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
      },
    ]);
    expect(portfolio.portfolioMetrics).toEqual({
      totalValue: '150000000000000000000',
      netApy: '0',
    });
    expect(portfolio.dataQuality).toEqual({
      earningsEstimated: false,
      historyAvailable: false,
      activityIndexedUntilBlock: null,
    });
  });

  it('returns zero totals and no positions when live balances are empty', async () => {
    const { service } = await createService({ positions: [] });

    const portfolio = await service.getPortfolio('0xabcdef0000000000000000000000000000000001');

    expect(portfolio.summary.totalValue).toBe('0');
    expect(portfolio.positions).toEqual([]);
    expect(portfolio.portfolioMetrics).toEqual({
      totalValue: '0',
      netApy: '0',
    });
  });

  it('includes DB-backed pending requests in the portfolio overview', async () => {
    const { service } = await createService({
      fakeDb: {
        depositRequestRows: [
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
            reasonCode: null,
            txHash: '0xabc',
            createdAt: new Date('2026-04-14T00:00:00.000Z'),
            updatedAt: new Date('2026-04-14T00:00:00.000Z'),
          },
        ],
      },
    });

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
        txHash: '0xabc',
        settlement: {
          estimatedAt: null,
          note: 'Final value may vary at settlement',
        },
      },
    ]);
  });

  it('returns an empty request list with normalized wallet address when no DB rows exist', async () => {
    const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

    const response = await service.getRequests('0xABCDEF0000000000000000000000000000000001');

    expect(response).toEqual({
      walletAddress: '0xabcdef0000000000000000000000000000000001',
      requests: [],
    });
  });

  it('maps deposit request rows for user or receiver without hardcoded portfolio symbols', async () => {
    const { service } = await createService({
      fakeDb: {
        depositRequestRows: [
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
            reasonCode: null,
            txHash: null,
            createdAt: new Date('2026-04-09T00:00:00.000Z'),
            updatedAt: new Date('2026-04-09T00:00:00.000Z'),
          },
        ],
      },
    });

    const response = await service.getRequests('0xABCDEF0000000000000000000000000000000001');

    expect(response.requests).toEqual([
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
        txHash: '0xabc',
        settlement: {
          estimatedAt: null,
          note: 'Final value may vary at settlement',
        },
      },
      {
        id: '43',
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        date: '2026-04-10T00:00:00.000Z',
        type: 'buy_junior_token',
        amount: '76600',
        value: '76600',
        status: 'settled',
        ladderRequestId: '43',
        txHash: null,
        settlement: {
          estimatedAt: null,
          note: 'Final value may vary at settlement',
        },
      },
    ]);
  });
});
