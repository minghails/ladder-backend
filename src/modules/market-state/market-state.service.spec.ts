import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
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
  lastUpdatedTime: '1777392000',
  halted: false,
  capabilities: {
    depositBaseInstant: true,
    depositBaseRequest: true,
    withdrawBaseAsync: false,
    withdrawBaseInstant: false,
  },
};

describe('MarketStateService', () => {
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
});
