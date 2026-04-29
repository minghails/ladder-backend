import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
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

describe('PortfolioService', () => {
  async function createService(fakeDb?: FakeDb) {
    const module = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: DRIZZLE_DB,
          useValue: fakeDb,
        },
      ],
    }).compile();

    return module.get(PortfolioService);
  }

  it('returns FE-ready portfolio summary and positions', async () => {
    const service = await createService();

    const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

    expect(portfolio.walletAddress).toBe('0xabcdef0000000000000000000000000000000001');
    expect(portfolio.summary).toMatchObject({
      totalValue: '852340.05',
      currentEarning: '6420.75',
      earning30d: '980.50',
      claimable: {
        amount: '295466.00',
        token: 'USDC',
      },
    });
    expect(portfolio.positions).toHaveLength(4);
    expect(portfolio.positions[0]).toMatchObject({
      marketSymbol: 'Token A',
      assetType: 'senior',
      assetSymbol: 'Senior Token',
      amount: '40000',
      value: '150000',
      currentApy: '0.0500',
      allocationPercent: '0.15',
    });
    expect(portfolio.portfolioMetrics).toEqual({
      totalValue: '852340.05',
      netApy: '0.0754',
    });
  });

  it('includes DB-backed pending requests in the portfolio overview', async () => {
    const service = await createService({
      depositRequestRows: [
        {
          id: 1,
          requestId: '42',
          marketAddress: '0x0000000000000000000000000000000000000002',
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
    });

    const portfolio = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

    expect(portfolio.pendingRequests).toEqual([
      {
        id: '42',
        marketAddress: '0x0000000000000000000000000000000000000002',
        marketSymbol: 'Token B',
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

  it('keeps deferred non-request portfolio sections explicit in the first delivery slice', async () => {
    const service = await createService();

    const portfolio = await service.getPortfolio('0xabcdef0000000000000000000000000000000001');

    expect(portfolio.claimableItems).toEqual([]);
    expect(portfolio.pendingRequests).toEqual([]);
    expect(portfolio.recentActivities).toEqual([]);
    expect(portfolio.dataQuality).toEqual({
      earningsEstimated: true,
      historyAvailable: false,
      activityIndexedUntilBlock: null,
    });
  });

  it('returns an empty request list with normalized wallet address when no DB rows exist', async () => {
    const service = await createService({ depositRequestRows: [] });

    const response = await service.getRequests('0xABCDEF0000000000000000000000000000000001');

    expect(response).toEqual({
      walletAddress: '0xabcdef0000000000000000000000000000000001',
      requests: [],
    });
  });

  it('maps deposit request rows for user or receiver into FE request items', async () => {
    const service = await createService({
      depositRequestRows: [
        {
          id: 1,
          requestId: '42',
          marketAddress: '0x0000000000000000000000000000000000000002',
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
          marketAddress: '0x0000000000000000000000000000000000000003',
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
          marketAddress: '0x0000000000000000000000000000000000000004',
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
    });

    const response = await service.getRequests('0xABCDEF0000000000000000000000000000000001');

    expect(response.requests).toEqual([
      {
        id: '42',
        marketAddress: '0x0000000000000000000000000000000000000002',
        marketSymbol: 'Token B',
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
        marketAddress: '0x0000000000000000000000000000000000000003',
        marketSymbol: 'Token C',
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
