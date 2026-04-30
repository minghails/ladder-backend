import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
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

  async function createService(liveMarket: LiveMarketState = LIVE_MARKET) {
    const contractReader = {
      getMarketState: vi.fn().mockResolvedValue(liveMarket),
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

    return {
      service: module.get(MarketStateService),
      contractReader,
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

  it('returns thin trade constraints without UI-only wallet state', async () => {
    const { service } = await createService();

    const constraints = await service.getTradeConstraints(LIVE_MARKET.address);

    expect(constraints).toMatchObject({
      market: LIVE_MARKET.address,
      tokens: {
        base: { symbol: 'USDC', address: LIVE_MARKET.baseTokenAddress, decimals: 6 },
        senior: { symbol: 'st-mEDGE', address: LIVE_MARKET.seniorTrancheAddress, decimals: 18 },
        junior: { symbol: 'jt-mEDGE', address: LIVE_MARKET.juniorTrancheAddress, decimals: 18 },
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
      },
      settlement: {
        depositBaseInstant: 'Instant when adaptor liquidity is available',
        depositBaseRequest: 'Async request/settlement flow',
        withdrawYt: 'Direct YT withdrawal through tranche vault',
      },
      warnings: [],
      dataQuality: {
        sources: {
          tokens: 'live_contract',
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

  it('returns deterministic chart payloads with mock-labelled sources', async () => {
    const { service } = await createService();

    const chart = await service.getChart(LIVE_MARKET.address, 'yield', '30d');

    expect(chart).toMatchObject({
      market: LIVE_MARKET.address,
      metric: 'yield',
      range: '30d',
      headline: {
        label: 'Yield APY',
        value: '8.40',
        unit: '%',
        source: 'mock',
      },
      dataQuality: {
        sources: {
          series: 'mock',
        },
      },
    });
    expect(chart.series).toHaveLength(6);
    expect(chart.series[0]).toHaveProperty('timestamp');
    expect(chart.series[0]).toHaveProperty('value');
    expect(chart.series[0]).toHaveProperty('source', 'mock');
  });
});
