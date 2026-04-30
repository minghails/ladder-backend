import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { QuotesService } from './quotes.service';

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

describe('QuotesService', () => {
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
        QuotesService,
        {
          provide: ContractReaderService,
          useValue: contractReader,
        },
      ],
    }).compile();

    return {
      service: module.get(QuotesService),
      contractReader,
    };
  }

  it('quotes deposit-base with derived output, warnings, and action hints but no calldata', async () => {
    const { service } = await createService();

    const quote = await service.quoteDepositBase({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      amount: '1000000',
      slippageBps: 50,
    });

    expect(quote).toMatchObject({
      input: {
        market: LIVE_MARKET.address,
        tranche: 'senior',
        amount: '1000000',
        token: LIVE_MARKET.baseTokenAddress,
        slippageBps: 50,
      },
      output: {
        token: LIVE_MARKET.seniorTrancheAddress,
        amount: '1000000',
        estimateType: 'placeholder',
      },
      availability: {
        available: true,
        reason: null,
      },
      warnings: [],
      action: {
        contract: LIVE_MARKET.address,
        method: 'depositInstant',
        approvalRequired: true,
        approvalToken: LIVE_MARKET.baseTokenAddress,
        calldataIncluded: false,
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          output: 'placeholder',
          constraints: 'derived',
        },
      },
    });
  });

  it('marks deposit-base unavailable when senior capacity is exceeded', async () => {
    const { service } = await createService();

    const quote = await service.quoteDepositBase({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      amount: '30000000000000000000000001',
    });

    expect(quote.availability).toMatchObject({
      available: false,
      reason: 'SENIOR_CAPACITY_EXCEEDED',
    });
    expect(quote.warnings).toContain('SENIOR_CAPACITY_EXCEEDED');
  });

  it('quotes withdraw-yt with derived output, warnings, and no calldata', async () => {
    const { service } = await createService();

    const quote = await service.quoteWithdrawYt({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      shares: '1000000000000000000',
      slippageBps: 100,
    });

    expect(quote).toMatchObject({
      input: {
        market: LIVE_MARKET.address,
        tranche: 'junior',
        shares: '1000000000000000000',
        token: LIVE_MARKET.juniorTrancheAddress,
        slippageBps: 100,
      },
      output: {
        token: LIVE_MARKET.ytTokenAddress,
        amount: '1000000000000000000',
        estimateType: 'placeholder',
      },
      availability: {
        available: true,
        reason: null,
      },
      action: {
        contract: LIVE_MARKET.juniorTrancheAddress,
        method: 'redeem',
        approvalRequired: false,
        calldataIncluded: false,
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          output: 'placeholder',
          constraints: 'derived',
        },
      },
    });
  });

  it('adds halted and stale warnings to quote responses', async () => {
    const { service } = await createService({
      ...LIVE_MARKET,
      halted: true,
      lastUpdatedTime: '1777247999',
    });

    const quote = await service.quoteDepositBase({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      amount: '1000000',
    });

    expect(quote.availability).toMatchObject({
      available: false,
      reason: 'MARKET_HALTED',
    });
    expect(quote.warnings).toEqual(expect.arrayContaining(['MARKET_HALTED', 'STALE_PRICE']));
  });
});
