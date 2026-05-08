import { describe, expect, it } from 'vitest';
import type { LiveMarketState, TokenMetadata } from '@shared/blockchain/contract-reader.service';
import { BASE_SEPOLIA_MARKET_NETWORK } from './market-metadata.config';
import { MarketFactsheetService } from './market-factsheet.service';

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

const BASE_TOKEN: TokenMetadata = {
  address: LIVE_MARKET.baseTokenAddress,
  symbol: 'USDBC',
  decimals: 6,
};

describe('MarketFactsheetService', () => {
  const service = new MarketFactsheetService();

  it('builds factsheet rows from live contract state and approved config only', () => {
    const factsheet = service.build(LIVE_MARKET, BASE_TOKEN);

    expect(factsheet.title).toBe('mEDGE Market Factsheet');
    expect(factsheet.rows).toEqual([
      { label: 'Market Address', value: LIVE_MARKET.address, source: 'live_contract' },
      { label: 'Network', value: BASE_SEPOLIA_MARKET_NETWORK.name, source: 'config' },
      { label: 'Underlying Token', value: LIVE_MARKET.ytTokenAddress, source: 'live_contract' },
      { label: 'Base Token', value: `${BASE_TOKEN.symbol} (${LIVE_MARKET.baseTokenAddress})`, source: 'config_address_live_metadata' },
      { label: 'Senior Token', value: `${LIVE_MARKET.seniorSymbol} (${LIVE_MARKET.seniorTrancheAddress})`, source: 'live_contract' },
      { label: 'Junior Token', value: `${LIVE_MARKET.juniorSymbol} (${LIVE_MARKET.juniorTrancheAddress})`, source: 'live_contract' },
      { label: 'Deposit Base Instant', value: 'Available', source: 'live_contract' },
      { label: 'Deposit Base Request', value: 'Available', source: 'live_contract' },
      { label: 'Async Base Withdrawal', value: 'Unavailable', source: 'live_contract' },
      { label: 'Max Senior/Junior Ratio', value: '6', source: 'live_contract' },
      { label: 'Senior Claim', value: 'Benchmark yield, first claim', source: 'config' },
      { label: 'Junior Claim', value: 'First-loss, leveraged upside', source: 'config' },
    ]);
    expect(factsheet.sources).toEqual({
      live: 'live_contract',
      config: 'config',
      unavailable: 'unavailable',
    });
  });

  it('ensures every row has a truthful source and removes unsourced analytics rows', () => {
    const factsheet = service.build(LIVE_MARKET, BASE_TOKEN);

    expect(factsheet.rows.map((row) => row.source)).toEqual([
      'live_contract',
      'config',
      'live_contract',
      'config_address_live_metadata',
      'live_contract',
      'live_contract',
      'live_contract',
      'live_contract',
      'live_contract',
      'live_contract',
      'config',
      'config',
    ]);
    expect(factsheet.rows.map((row) => row.label)).not.toContain('Carry Fee');
    expect(factsheet.rows.map((row) => row.label)).not.toContain('APY');
  });
});
