import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContractReaderService, type LiveMarketState, type LivePortfolioPosition } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { describe, expect, it, vi } from 'vitest';
import { MarketStateModule } from '../../src/modules/market-state/market-state.module';
import { PortfolioModule } from '../../src/modules/portfolio/portfolio.module';
import { QuoteSimulationService } from '../../src/modules/quotes/quote-simulation.service';
import { QuotesModule } from '../../src/modules/quotes/quotes.module';
import { TxStatusModule } from '../../src/modules/tx-status/tx-status.module';

const MARKET_ADDRESS = '0x3aDa769dC813e3376fCD40d05bEA12263048A487';
const WALLET = '0xabcdef0000000000000000000000000000000001';
const TX_HASH = '0xABCDEF0000000000000000000000000000000000000000000000000000000001';

const LIVE_MARKET: LiveMarketState = {
  address: MARKET_ADDRESS,
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

const LIVE_POSITIONS: LivePortfolioPosition[] = [
  {
    marketAddress: MARKET_ADDRESS,
    marketSymbol: 'mEDGE',
    assetType: 'junior',
    assetSymbol: 'jt-mEDGE',
    tokenAddress: LIVE_MARKET.juniorTrancheAddress,
    shares: '1000000000000000000',
    assets: '1000000000000000000',
    value: '1000000000000000000',
  },
];

type AppOptions = {
  market?: LiveMarketState;
  positions?: LivePortfolioPosition[];
  snapshots?: unknown[];
  simulation?: { ok: true; ytOut: string; sharesOut: string } | { ok: false; reason: string; errorName: string | null };
};

function marketEventRow() {
  return {
    id: 1,
    chainId: 84532,
    marketAddress: MARKET_ADDRESS,
    eventName: 'DepositYT',
    blockNumber: '12345',
    blockHash: '0xblock',
    blockTimestamp: new Date('2026-05-05T00:00:00.000Z'),
    txHash: TX_HASH,
    logIndex: '0',
    args: { user: WALLET, asSenior: false, assets: '1000000000000000000', depositValue: '1000000000000000000' },
    processedAt: new Date('2026-05-05T00:00:01.000Z'),
  };
}

function expectNoMockData(value: unknown): void {
  expect(JSON.stringify(value)).not.toMatch(/"(mock|activity-1|activity-2|request-1|claim-1|reward-1)"/i);
}

async function createApp(options: AppOptions = {}): Promise<INestApplication> {
  const liveMarket = options.market ?? LIVE_MARKET;
  const db = { marketEventRows: [marketEventRow()], depositRequestRows: [], query: { marketSnapshots: { findMany: vi.fn().mockResolvedValue(options.snapshots ?? []) } } };
  const contractReader = {
    getMarketState: vi.fn().mockResolvedValue(liveMarket),
    getTokenMetadata: vi.fn().mockResolvedValue({ address: liveMarket.baseTokenAddress, symbol: 'USDC', decimals: 6 }),
    getPortfolioPositions: vi.fn().mockResolvedValue(options.positions ?? LIVE_POSITIONS),
  };
  const quoteSimulation = {
    previewDeposit: vi.fn().mockResolvedValue('1000000000000000000'),
    previewRedeem: vi.fn().mockResolvedValue('1000000000000000000'),
    previewWithdraw: vi.fn().mockResolvedValue('1000000000000000000'),
    simulateDepositBaseInstant: vi.fn().mockResolvedValue(options.simulation ?? { ok: true, ytOut: '1000000', sharesOut: '1000000' }),
  };

  const module = await Test.createTestingModule({
    imports: [MarketStateModule, QuotesModule, PortfolioModule, TxStatusModule],
  })
    .overrideProvider(ContractReaderService)
    .useValue(contractReader)
    .overrideProvider(QuoteSimulationService)
    .useValue(quoteSimulation)
    .overrideProvider(DRIZZLE_DB)
    .useValue(db)
    .compile();

  const app = module.createNestApplication();
  await app.listen(0);
  return app;
}

async function baseUrl(app: INestApplication): Promise<string> {
  return app.getUrl();
}

async function getJson(app: INestApplication, path: string): Promise<unknown> {
  const response = await fetch(`${await baseUrl(app)}${path}`);
  expect(response.status).toBe(200);
  return response.json() as Promise<unknown>;
}

async function postJson(app: INestApplication, path: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${await baseUrl(app)}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(201);
  return response.json() as Promise<unknown>;
}

describe('production smoke', () => {
  it('loads market, quotes, indexed tx status, and refreshed portfolio activity without mock data', async () => {
    const app = await createApp();

    try {
      const market = await getJson(app, `/markets/${MARKET_ADDRESS}`);
      const quote = await postJson(app, '/quotes/deposit-yt', { market: MARKET_ADDRESS, tranche: 'junior', amountYt: '1000000000000000000' });
      const tx = await getJson(app, `/tx/${TX_HASH}`);
      const portfolioOverview = await getJson(app, `/portfolio/${WALLET}`);
      const activities = await getJson(app, `/portfolio/${WALLET}/activities`);

      expect(market).toMatchObject({ address: MARKET_ADDRESS, dataQuality: { sources: { marketState: 'live_contract' } } });
      expect(quote).toMatchObject({ availability: { available: true }, dataQuality: { sources: { estimate: 'live_contract_preview' } } });
      expect(tx).toMatchObject({ status: 'indexed', events: [{ eventName: 'DepositYT', blockNumber: '12345', logIndex: '0' }] });
      expect(portfolioOverview).toMatchObject({ recentActivities: [{ id: `${TX_HASH}:0`, type: 'buy_junior_token', source: 'db' }] });
      expect(activities).toMatchObject({ items: [{ id: `${TX_HASH}:0`, txHash: TX_HASH, source: 'db' }] });
      expectNoMockData({ market, quote, tx, portfolioOverview, activities });
    } finally {
      await app.close();
    }
  });

  it('covers market, quote, and portfolio empty/unavailable scenarios without mock data', async () => {
    const app = await createApp({ positions: [] });

    try {
      const marketList = await getJson(app, '/markets');
      const depositLimits = await getJson(app, `/markets/${MARKET_ADDRESS}/deposit-limits`);
      const priceStatus = await getJson(app, `/markets/${MARKET_ADDRESS}/price-status`);
      const tradeConstraints = await getJson(app, `/markets/${MARKET_ADDRESS}/trade-constraints`);
      const factsheet = await getJson(app, `/markets/${MARKET_ADDRESS}/factsheet`);
      const yieldChart = await getJson(app, `/markets/${MARKET_ADDRESS}/charts?metric=yield&range=30d`);
      const utilizationChart = await getJson(app, `/markets/${MARKET_ADDRESS}/charts?metric=utilization&range=30d`);
      const history = await getJson(app, `/markets/${MARKET_ADDRESS}/history`);
      const withdrawQuote = await postJson(app, '/quotes/withdraw-yt', { market: MARKET_ADDRESS, tranche: 'junior', mode: 'shares', amount: '1000000000000000000', receiver: WALLET });
      const depositBaseMissingSender = await postJson(app, '/quotes/deposit-base', { market: MARKET_ADDRESS, tranche: 'junior', amount: '1000000' });
      const portfolioOverview = await getJson(app, `/portfolio/${WALLET}`);
      const earnings = await getJson(app, `/portfolio/${WALLET}/earnings`);
      const claimables = await getJson(app, `/portfolio/${WALLET}/claimables`);
      const requests = await getJson(app, `/portfolio/${WALLET}/requests`);

      expect(marketList).toMatchObject({ dataQuality: { sources: { marketState: 'live_contract' } } });
      expect(depositLimits).toMatchObject({ senior: { available: true }, dataQuality: { sources: { limits: 'derived' } } });
      expect(priceStatus).toMatchObject({ dataQuality: { sources: { staleStatus: 'derived' } } });
      expect(tradeConstraints).toMatchObject({ dataQuality: { sources: { tokens: 'config_address_live_metadata', limits: 'derived' } } });
      expect(JSON.stringify(factsheet)).toContain('factsheet');
      expect(yieldChart).toMatchObject({ series: [], dataQuality: { sources: { series: 'unavailable' } } });
      expect(utilizationChart).toMatchObject({ series: [], dataQuality: { sources: { series: 'unavailable' } } });
      expect(history).toMatchObject({ items: [], dataQuality: { sources: { history: 'indexed_events' } } });
      expect(withdrawQuote).toMatchObject({ availability: { available: true }, dataQuality: { sources: { output: 'live_contract_preview' } } });
      expect(depositBaseMissingSender).toMatchObject({ availability: { available: false, reason: 'SENDER_REQUIRED' }, dataQuality: { sources: { estimate: 'unavailable' } } });
      expect(portfolioOverview).toMatchObject({ positions: [], pendingRequests: [], claimableItems: [], dataQuality: { sources: { earnings: 'unavailable' } } });
      expect(earnings).toMatchObject({ earnings: [], history: { series: [] }, dataQuality: { sources: { earnings: 'unavailable', earningsHistory: 'unavailable' } } });
      expect(claimables).toMatchObject({ items: [], page: { hasMore: false }, dataQuality: { sources: { claimableItems: 'unavailable' } } });
      expect(requests).toMatchObject({ requests: [], page: { hasMore: false }, dataQuality: { sources: { pendingRequests: 'db' } } });
      expectNoMockData({ marketList, depositLimits, priceStatus, tradeConstraints, factsheet, yieldChart, utilizationChart, history, withdrawQuote, depositBaseMissingSender, portfolioOverview, earnings, claimables, requests });
    } finally {
      await app.close();
    }
  });

  it('covers halted, capacity, and simulation-revert scenarios without mock data', async () => {
    const app = await createApp({
      market: {
        ...LIVE_MARKET,
        halted: true,
        navSt: '60000000000000000000000000',
      },
      simulation: { ok: false, reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE', errorName: null },
    });

    try {
      const market = await getJson(app, `/markets/${MARKET_ADDRESS}`);
      const depositLimits = await getJson(app, `/markets/${MARKET_ADDRESS}/deposit-limits`);
      const tradeConstraints = await getJson(app, `/markets/${MARKET_ADDRESS}/trade-constraints`);
      const depositYtQuote = await postJson(app, '/quotes/deposit-yt', { market: MARKET_ADDRESS, tranche: 'senior', amountYt: '1000000000000000000' });
      const depositBaseQuote = await postJson(app, '/quotes/deposit-base', { market: MARKET_ADDRESS, tranche: 'junior', amount: '1000000', sender: WALLET });

      expect(JSON.stringify(market)).toContain('MARKET_HALTED');
      expect(depositLimits).toMatchObject({ senior: { available: false, reason: 'MARKET_HALTED' } });
      expect(tradeConstraints).toMatchObject({ capabilities: { depositYt: false, depositBaseInstant: false } });
      expect(JSON.stringify(tradeConstraints)).toContain('MARKET_HALTED');
      expect(depositYtQuote).toMatchObject({ availability: { available: false, reason: 'MARKET_HALTED' } });
      expect(depositBaseQuote).toMatchObject({ availability: { available: false, reason: 'MARKET_HALTED' } });
      expectNoMockData({ market, depositLimits, tradeConstraints, depositYtQuote, depositBaseQuote });
    } finally {
      await app.close();
    }
  });
});
