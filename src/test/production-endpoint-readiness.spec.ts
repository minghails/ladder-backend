import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { ContractReaderService, type LiveMarketState, type LivePortfolioPosition } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { MarketApyService } from '../modules/market-state/market-apy.service';
import { MarketFactsheetService } from '../modules/market-state/market-factsheet.service';
import { MarketStateService } from '../modules/market-state/market-state.service';
import { PortfolioActivityRepository } from '../modules/portfolio/portfolio-activity.repository';
import { PortfolioClaimablesRepository } from '../modules/portfolio/portfolio-claimables.repository';
import { PortfolioEarningsRepository } from '../modules/portfolio/portfolio-earnings.repository';
import { PortfolioService } from '../modules/portfolio/portfolio.service';
import { QuoteSimulationService } from '../modules/quotes/quote-simulation.service';
import { QuotesService } from '../modules/quotes/quotes.service';

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

const WALLET = '0xabcdef0000000000000000000000000000000001';
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
];
const FORBIDDEN_VALUES = new Set(['mock', 'placeholder', 'activity-1', 'activity-2', 'request-1', 'claim-1', 'reward-1']);

function walk(value: unknown, visit: (value: unknown) => void): void {
  visit(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, visit);
    }
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) {
      walk(item, visit);
    }
  }
}

function expectNoMockData(response: unknown): void {
  const found: string[] = [];
  walk(response, (value) => {
    if (typeof value === 'string' && FORBIDDEN_VALUES.has(value)) {
      found.push(value);
    }
  });
  expect(found).toEqual([]);
}

function hasSources(value: unknown): value is { dataQuality: { sources: Record<string, unknown> } } {
  if (value === null || typeof value !== 'object' || !('dataQuality' in value)) {
    return false;
  }
  const dataQuality = value.dataQuality;
  return dataQuality !== null && typeof dataQuality === 'object' && 'sources' in dataQuality && dataQuality.sources !== null && typeof dataQuality.sources === 'object';
}

function expectSources(response: unknown, path: string): void {
  expect(hasSources(response), path).toBe(true);
}

describe('production endpoint readiness audit', () => {
  async function createServices() {
    const contractReader = {
      getMarketState: vi.fn().mockResolvedValue(LIVE_MARKET),
      getTokenMetadata: vi.fn().mockResolvedValue({ address: LIVE_MARKET.baseTokenAddress, symbol: 'USDC', decimals: 6 }),
      getPortfolioPositions: vi.fn().mockResolvedValue(LIVE_POSITIONS),
    };
    const quoteSimulation = {
      simulateDepositBaseInstant: vi.fn().mockResolvedValue({ ok: true, ytOut: '998000000000000000', sharesOut: '998000000000000000' }),
      previewDeposit: vi.fn().mockResolvedValue('950000000000000000'),
      previewRedeem: vi.fn().mockResolvedValue('480000000000000000'),
      previewWithdraw: vi.fn().mockResolvedValue('1050000000000000000'),
    };
    const db = { query: { marketSnapshots: { findMany: vi.fn().mockResolvedValue([]) } }, depositRequestRows: [] };

    const module = await Test.createTestingModule({
      providers: [
        MarketStateService,
        MarketApyService,
        MarketFactsheetService,
        PortfolioService,
        QuotesService,
        { provide: ContractReaderService, useValue: contractReader },
        { provide: QuoteSimulationService, useValue: quoteSimulation },
        { provide: PortfolioActivityRepository, useValue: { findByWallet: vi.fn().mockResolvedValue([]) } },
        { provide: PortfolioEarningsRepository, useValue: { findCostBasis: vi.fn().mockResolvedValue([]), findCashflowsSince: vi.fn().mockResolvedValue([]) } },
        { provide: PortfolioClaimablesRepository, useValue: { findByWallet: vi.fn().mockResolvedValue([]) } },
        { provide: DRIZZLE_DB, useValue: db },
      ],
    }).compile();

    return {
      marketState: module.get(MarketStateService),
      portfolio: module.get(PortfolioService),
      quotes: module.get(QuotesService),
    };
  }

  async function defaultResponses() {
    const { marketState, portfolio, quotes } = await createServices();
    return [
      ['GET /markets', await marketState.listMarkets()],
      ['GET /markets/:address', await marketState.getMarket(LIVE_MARKET.address)],
      ['GET /markets/:address/deposit-limits', await marketState.getDepositLimits(LIVE_MARKET.address)],
      ['GET /markets/:address/price-status', await marketState.getPriceStatus(LIVE_MARKET.address)],
      ['GET /markets/:address/trade-constraints', await marketState.getTradeConstraints(LIVE_MARKET.address)],
      ['GET /markets/:address/factsheet', await marketState.getFactsheet(LIVE_MARKET.address)],
      ['GET /markets/:address/charts', await marketState.getChart(LIVE_MARKET.address, 'tvl', '30d')],
      ['GET /markets/:address/history', await marketState.getHistory(LIVE_MARKET.address)],
      ['POST /quotes/deposit-yt', await quotes.quoteDepositYt({ market: LIVE_MARKET.address, tranche: 'junior', amountYt: '1000000000000000000' })],
      ['POST /quotes/deposit-base', await quotes.quoteDepositBase({ market: LIVE_MARKET.address, tranche: 'junior', amount: '1000000', sender: WALLET })],
      ['POST /quotes/withdraw-yt', await quotes.quoteWithdrawYt({ market: LIVE_MARKET.address, tranche: 'junior', mode: 'shares', amount: '1000000000000000000', receiver: WALLET })],
      ['GET /portfolio/:address', await portfolio.getPortfolio(WALLET)],
      ['GET /portfolio/:address/earnings', await portfolio.getEarnings(WALLET)],
      ['GET /portfolio/:address/claimables', await portfolio.getClaimables(WALLET)],
      ['GET /portfolio/:address/activities', await portfolio.getActivities(WALLET)],
      ['GET /portfolio/:address/requests', await portfolio.getRequests(WALLET)],
    ] as const;
  }

  it('default API responses do not include mock source labels or fixture IDs', async () => {
    for (const [, response] of await defaultResponses()) {
      expectNoMockData(response);
    }
  });

  it('affected default API responses expose dataQuality.sources contracts', async () => {
    for (const [path, response] of await defaultResponses()) {
      expectSources(response, path);
    }
  });

  it('empty DB behavior returns empty indexed pages and unavailable source labels', async () => {
    const { marketState, portfolio } = await createServices();

    await expect(marketState.getHistory(LIVE_MARKET.address)).resolves.toMatchObject({
      items: [],
      dataQuality: { sources: { history: 'indexed_events' } },
    });
    await expect(portfolio.getPortfolio(WALLET)).resolves.toMatchObject({
      pendingRequests: [],
      claimableItems: [],
      recentActivities: [],
      dataQuality: {
        sources: {
          pendingRequests: 'db',
          claimableItems: 'unavailable',
          recentActivities: 'unavailable',
          earnings: 'unavailable',
        },
      },
    });
    await expect(portfolio.getEarnings(WALLET)).resolves.toMatchObject({
      earnings: [],
      history: { series: [] },
      dataQuality: { sources: { earnings: 'unavailable', earningsHistory: 'unavailable' } },
    });
    await expect(portfolio.getClaimables(WALLET)).resolves.toMatchObject({ items: [], page: { hasMore: false } });
    await expect(portfolio.getActivities(WALLET)).resolves.toMatchObject({ items: [], page: { hasMore: false } });
    await expect(portfolio.getRequests(WALLET)).resolves.toMatchObject({ requests: [], page: { hasMore: false } });
  });
});
