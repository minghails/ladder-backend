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
      simulateDepositBaseInstant: vi.fn().mockResolvedValue({
        ok: true,
        ytOut: '998000000000000000',
        sharesOut: '998000000000000000',
      }),
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

  it('quotes junior deposit-yt as available with derived estimate and wagmi action hints', async () => {
    const { service } = await createService();

    const quote = await service.quoteDepositYt({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      amountYt: '1000000000000000000',
    });

    expect(quote).toMatchObject({
      input: {
        market: LIVE_MARKET.address,
        tranche: 'junior',
        amountYt: '1000000000000000000',
        token: LIVE_MARKET.ytTokenAddress,
      },
      estimate: {
        sharesOut: '1000000000000000000',
        depositValue: '1000000000000000000',
        navAfter: '40000001000000000000000000',
        navStAfter: LIVE_MARKET.navSt,
        navJtAfter: '10000001000000000000000000',
        stJtRatioAfter: '2999999700000029999',
        estimateType: 'derived',
      },
      availability: {
        available: true,
        reason: null,
      },
      warnings: [],
      action: {
        contract: LIVE_MARKET.address,
        method: 'depositYT',
        args: {
          asSenior: false,
          amount: '1000000000000000000',
        },
        calldataIncluded: false,
        approval: {
          required: true,
          token: LIVE_MARKET.ytTokenAddress,
          spender: LIVE_MARKET.address,
          amount: '1000000000000000000',
        },
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          estimate: 'derived',
          constraints: 'derived',
        },
      },
    });
  });

  it('marks senior deposit-yt unavailable when derived ratio exceeds max', async () => {
    const { service } = await createService();

    const quote = await service.quoteDepositYt({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      amountYt: '40000000000000000000000000',
    });

    expect(quote.availability).toMatchObject({
      available: false,
      reason: 'SENIOR_CAPACITY_EXCEEDED',
    });
    expect(quote.warnings).toContain('SENIOR_CAPACITY_EXCEEDED');
  });

  it('marks senior first deposit-yt unavailable when junior nav is zero', async () => {
    const { service } = await createService({
      ...LIVE_MARKET,
      nav: '0',
      navSt: '0',
      navJt: '0',
      currentStJtRatio: '0',
    });

    const quote = await service.quoteDepositYt({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      amountYt: '1000000000000000000',
    });

    expect(quote.availability).toMatchObject({
      available: false,
      reason: 'FIRST_DEPOSIT_MUST_BE_JUNIOR',
    });
  });

  it('marks zero deposit-yt unavailable', async () => {
    const { service } = await createService();

    const quote = await service.quoteDepositYt({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      amountYt: '0',
    });

    expect(quote.availability).toMatchObject({
      available: false,
      reason: 'ZERO_AMOUNT',
    });
  });

  it('uses onchain simulation for deposit-base quotes when sender is supplied', async () => {
    const { service, contractReader } = await createService();

    const quote = await service.quoteDepositBase({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      amount: '1000000',
      sender: '0x00000000000000000000000000000000000000aa',
      minYtOut: '900000000000000000',
    });

    expect(contractReader.simulateDepositBaseInstant).toHaveBeenCalledWith({
      market: LIVE_MARKET.address,
      asSenior: false,
      tokenIn: LIVE_MARKET.baseTokenAddress,
      amountIn: '1000000',
      minYtOut: '900000000000000000',
      receiver: '0x00000000000000000000000000000000000000aa',
      referrerId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      sender: '0x00000000000000000000000000000000000000aa',
      trancheToken: LIVE_MARKET.juniorTrancheAddress,
    });
    expect(quote.estimate).toMatchObject({
      estimatedYtOut: '998000000000000000',
      sharesOut: '998000000000000000',
      estimateType: 'simulated_onchain',
    });
    expect(quote.dataQuality.sources.estimate).toBe('simulated_onchain');
  });

  it('requires sender for exact deposit-base simulation', async () => {
    const { service, contractReader } = await createService();

    const quote = await service.quoteDepositBase({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      amount: '1000000',
    });

    expect(contractReader.simulateDepositBaseInstant).not.toHaveBeenCalled();
    expect(quote.availability).toEqual({
      available: false,
      reason: 'SENDER_REQUIRED',
    });
    expect(quote.estimate.estimateType).toBe('unavailable');
    expect(quote.warnings).toEqual(expect.arrayContaining(['SENDER_REQUIRED']));
  });

  it('marks deposit-base unavailable when onchain simulation reverts', async () => {
    const { service, contractReader } = await createService();
    contractReader.simulateDepositBaseInstant.mockResolvedValueOnce({
      ok: false,
      reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
      errorName: null,
    });

    const quote = await service.quoteDepositBase({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      amount: '1000000',
      sender: '0x00000000000000000000000000000000000000aa',
    });

    expect(quote.availability).toEqual({
      available: false,
      reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
    });
    expect(quote.estimate).toMatchObject({
      estimatedYtOut: null,
      sharesOut: null,
      estimateType: 'simulation_reverted',
    });
    expect(quote.warnings).toEqual(expect.arrayContaining(['INSUFFICIENT_ALLOWANCE_OR_BALANCE']));
    expect(quote.dataQuality.sources.estimate).toBe('simulation_reverted');
  });

  it('quotes deposit-base with derived output, warnings, and action hints but no calldata', async () => {
    const { service } = await createService();

    const quote = await service.quoteDepositBase({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      amount: '1000000',
      minYtOut: '990000000000000000',
      receiver: '0x00000000000000000000000000000000000000e1',
      referrerId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      sender: '0x00000000000000000000000000000000000000aa',
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
      estimate: {
        estimatedYtOut: '998000000000000000',
        minYtOut: '990000000000000000',
        sharesOut: '998000000000000000',
        estimateType: 'simulated_onchain',
      },
      availability: {
        available: true,
        reason: null,
      },
      warnings: [],
      action: {
        contract: LIVE_MARKET.address,
        method: 'depositInstant',
        args: {
          asSenior: true,
          tokenIn: LIVE_MARKET.baseTokenAddress,
          amountIn: '1000000',
          minYtOut: '990000000000000000',
          receiver: '0x00000000000000000000000000000000000000e1',
          referrerId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        calldataIncluded: false,
        approval: {
          required: true,
          token: LIVE_MARKET.baseTokenAddress,
          spender: LIVE_MARKET.address,
          amount: '1000000',
        },
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          estimate: 'simulated_onchain',
          constraints: 'derived',
        },
      },
    });
  });

  it('maps withdraw-yt assets mode to byShares false', async () => {
    const { service } = await createService();

    const quote = await service.quoteWithdrawYt({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      mode: 'assets',
      amount: '2000000000000000000',
      receiver: '0x00000000000000000000000000000000000000e1',
    });

    expect(quote.action).toMatchObject({
      contract: LIVE_MARKET.address,
      method: 'withdraw',
      args: {
        fromSenior: true,
        byShares: false,
        amount: '2000000000000000000',
        receiver: '0x00000000000000000000000000000000000000e1',
      },
      approval: {
        token: LIVE_MARKET.seniorTrancheAddress,
        spender: LIVE_MARKET.address,
        amount: '2000000000000000000',
      },
    });
  });

  it('marks junior withdraw-yt unavailable when capacity is exceeded', async () => {
    const { service } = await createService();

    const quote = await service.quoteWithdrawYt({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      mode: 'shares',
      amount: '6000000000000000000000000',
      receiver: '0x00000000000000000000000000000000000000e1',
    });

    expect(quote.availability).toMatchObject({
      available: false,
      reason: 'JUNIOR_WITHDRAWAL_CAPACITY_EXCEEDED',
    });
    expect(quote.warnings).toContain('JUNIOR_WITHDRAWAL_CAPACITY_EXCEEDED');
  });

  it('marks withdraw-yt unavailable for zero amount or receiver', async () => {
    const { service } = await createService();

    const zeroAmount = await service.quoteWithdrawYt({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      mode: 'shares',
      amount: '0',
      receiver: '0x00000000000000000000000000000000000000e1',
    });
    const zeroReceiver = await service.quoteWithdrawYt({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      mode: 'shares',
      amount: '1000000000000000000',
      receiver: '0x0000000000000000000000000000000000000000',
    });

    expect(zeroAmount.availability.reason).toBe('ZERO_AMOUNT');
    expect(zeroReceiver.availability.reason).toBe('ZERO_RECEIVER');
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
