import { Injectable } from '@nestjs/common';
import type { LiveMarketState, TokenMetadata } from '@shared/blockchain/contract-reader.service';
import { formatScaledRatio } from './market-calculations';
import { BASE_SEPOLIA_MARKET_NETWORK, MARKET_FACTSHEET_CONFIG_ROWS } from './market-metadata.config';

export type MarketFactsheetSource = 'live_contract' | 'config' | 'config_address_live_metadata' | 'unavailable';

export interface MarketFactsheetRowDto {
  label: string;
  value: string;
  source: MarketFactsheetSource;
}

export interface MarketFactsheetDto {
  title: string;
  rows: MarketFactsheetRowDto[];
  sources: {
    live: 'live_contract';
    config: 'config';
    unavailable: 'unavailable';
  };
}

function stripTranchePrefix(symbol: string): string {
  return symbol.replace(/^(st|jt)-/, '') || symbol;
}

function availability(value: boolean): string {
  return value ? 'Available' : 'Unavailable';
}

@Injectable()
export class MarketFactsheetService {
  build(live: LiveMarketState, baseToken: TokenMetadata): MarketFactsheetDto {
    const marketSymbol = stripTranchePrefix(live.seniorSymbol);

    return {
      title: `${marketSymbol} Market Factsheet`,
      rows: [
        { label: 'Market Address', value: live.address, source: 'live_contract' },
        { label: 'Network', value: BASE_SEPOLIA_MARKET_NETWORK.name, source: 'config' },
        { label: 'Underlying Token', value: live.ytTokenAddress, source: 'live_contract' },
        { label: 'Base Token', value: `${baseToken.symbol} (${live.baseTokenAddress})`, source: 'config_address_live_metadata' },
        { label: 'Senior Token', value: `${live.seniorSymbol} (${live.seniorTrancheAddress})`, source: 'live_contract' },
        { label: 'Junior Token', value: `${live.juniorSymbol} (${live.juniorTrancheAddress})`, source: 'live_contract' },
        { label: 'Deposit Base Instant', value: availability(live.capabilities.depositBaseInstant), source: 'live_contract' },
        { label: 'Deposit Base Request', value: availability(live.capabilities.depositBaseRequest), source: 'live_contract' },
        { label: 'Async Base Withdrawal', value: availability(live.capabilities.withdrawBaseAsync), source: 'live_contract' },
        { label: 'Max Senior/Junior Ratio', value: formatScaledRatio(live.maxStJtRatio), source: 'live_contract' },
        ...MARKET_FACTSHEET_CONFIG_ROWS,
      ],
      sources: {
        live: 'live_contract',
        config: 'config',
        unavailable: 'unavailable',
      },
    };
  }
}
