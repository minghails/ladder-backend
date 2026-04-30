import { Injectable, NotFoundException } from '@nestjs/common';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import {
  calculateJuniorWithdrawalCapacity,
  calculateSeniorDepositCapacity,
  formatScaledRatio,
  isPriceStale,
  PRICE_STALE_SECONDS,
  unixSecondsToIso,
} from './market-calculations';
import {
  BASE_SEPOLIA_MARKET_NETWORK,
  MARKET_CHART_FIXTURES,
  type MarketChartMetric,
  type MarketChartRange,
  MARKET_FACTSHEET_ROWS,
  MARKET_SETTLEMENT_LABELS,
} from './market-metadata.config';

export interface MarketNetworkDto {
  chainId: number;
  name: string;
  icon: string;
}

export interface MarketTrancheDto {
  symbol: string;
  apy: string;
  tvl: string;
}

export interface MarketRatioDto {
  display: string;
  stJtRatio: string;
  maxStJtRatio: string;
}

export interface MarketStatusDto {
  halted: boolean;
  stalePrice: boolean;
  warnings: string[];
}

export interface MarketListItemDto {
  address: string;
  symbol: string;
  name: string;
  description: string;
  network: MarketNetworkDto;
  totalTvl: string;
  senior: MarketTrancheDto;
  junior: MarketTrancheDto;
  ratio: MarketRatioDto;
  status: MarketStatusDto;
}

export interface MarketDetailDto extends MarketListItemDto {
  underlying: {
    symbol: string;
    address: string;
    baseToken: {
      symbol: string;
      address: string;
      decimals: number;
    };
  };
  nav: {
    total: string;
    senior: string;
    junior: string;
  };
  price: {
    lastUpdatedAt: string;
    stale: boolean;
  };
  capabilities: {
    depositYt: boolean;
    withdrawYt: boolean;
    depositBaseInstant: boolean;
    depositBaseRequest: boolean;
    withdrawBaseAsync: boolean;
  };
}

export interface MarketListResponseDto {
  markets: MarketListItemDto[];
}

function toListItem(market: MarketDetailDto): MarketListItemDto {
  return {
    address: market.address,
    symbol: market.symbol,
    name: market.name,
    description: market.description,
    network: market.network,
    totalTvl: market.totalTvl,
    senior: market.senior,
    junior: market.junior,
    ratio: market.ratio,
    status: market.status,
  };
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function stripTranchePrefix(symbol: string): string {
  return symbol.replace(/^(st|jt)-/, '') || symbol;
}

function statusWarnings(live: LiveMarketState): string[] {
  return [...(live.halted ? ['MARKET_HALTED'] : []), ...(isPriceStale(live.lastUpdatedTime) ? ['STALE_PRICE'] : [])];
}

function toMarketDetail(live: LiveMarketState): MarketDetailDto {
  const marketSymbol = stripTranchePrefix(live.seniorSymbol);
  const stalePrice = isPriceStale(live.lastUpdatedTime);

  return {
    address: live.address,
    symbol: marketSymbol,
    name: marketSymbol,
    description: `${marketSymbol} Ladder market`,
    network: BASE_SEPOLIA_MARKET_NETWORK,
    totalTvl: live.nav,
    senior: {
      symbol: live.seniorSymbol,
      apy: '0',
      tvl: live.navSt,
    },
    junior: {
      symbol: live.juniorSymbol,
      apy: '0',
      tvl: live.navJt,
    },
    ratio: {
      display: `${formatScaledRatio(live.currentStJtRatio)}:1`,
      stJtRatio: formatScaledRatio(live.currentStJtRatio),
      maxStJtRatio: formatScaledRatio(live.maxStJtRatio),
    },
    status: {
      halted: live.halted,
      stalePrice,
      warnings: statusWarnings(live),
    },
    underlying: {
      symbol: marketSymbol,
      address: live.ytTokenAddress,
      baseToken: {
        symbol: 'USDC',
        address: live.baseTokenAddress,
        decimals: 6,
      },
    },
    nav: {
      total: live.nav,
      senior: live.navSt,
      junior: live.navJt,
    },
    price: {
      lastUpdatedAt: unixSecondsToIso(live.lastUpdatedTime),
      stale: stalePrice,
    },
    capabilities: {
      depositYt: !live.halted,
      withdrawYt: true,
      depositBaseInstant: !live.halted && live.capabilities.depositBaseInstant,
      depositBaseRequest: !live.halted && live.capabilities.depositBaseRequest,
      withdrawBaseAsync: live.capabilities.withdrawBaseAsync,
    },
  };
}

function chartTimestamps(): string[] {
  return [
    '2026-04-01T00:00:00.000Z',
    '2026-04-07T00:00:00.000Z',
    '2026-04-13T00:00:00.000Z',
    '2026-04-19T00:00:00.000Z',
    '2026-04-25T00:00:00.000Z',
    '2026-04-30T00:00:00.000Z',
  ];
}

@Injectable()
export class MarketStateService {
  constructor(private readonly contractReader: ContractReaderService) {}

  async listMarkets(): Promise<MarketListResponseDto> {
    const market = toMarketDetail(await this.contractReader.getMarketState());

    return {
      markets: [toListItem(market)],
    };
  }

  async getMarket(address: string): Promise<MarketDetailDto> {
    return toMarketDetail(await this.getLiveMarket(address));
  }

  async getDepositLimits(address: string) {
    const live = await this.getLiveMarket(address);
    const capacity = calculateSeniorDepositCapacity(live.navSt, live.navJt, live.maxStJtRatio);
    const available = !live.halted && capacity !== '0';

    return {
      market: live.address,
      senior: {
        available,
        capacity,
        reason: available ? null : live.halted ? 'MARKET_HALTED' : 'SENIOR_CAPACITY_EXHAUSTED',
        formula: 'D_max = J * L_max - S',
      },
      dataQuality: {
        sources: {
          nav: 'live_contract',
          limits: 'derived',
        },
      },
    };
  }

  async getPriceStatus(address: string) {
    const live = await this.getLiveMarket(address);
    const stale = isPriceStale(live.lastUpdatedTime);

    return {
      market: live.address,
      lastUpdatedAt: unixSecondsToIso(live.lastUpdatedTime),
      stale,
      staleAfterSeconds: PRICE_STALE_SECONDS,
      warnings: stale ? ['STALE_PRICE'] : [],
      dataQuality: {
        sources: {
          lastUpdatedTime: 'live_contract',
          staleStatus: 'derived',
        },
      },
    };
  }

  async getTradeConstraints(address: string) {
    const live = await this.getLiveMarket(address);
    const seniorDepositCapacity = calculateSeniorDepositCapacity(live.navSt, live.navJt, live.maxStJtRatio);
    const juniorWithdrawalCapacity = calculateJuniorWithdrawalCapacity(live.navSt, live.navJt, live.maxStJtRatio);

    return {
      market: live.address,
      tokens: {
        base: { symbol: 'USDC', address: live.baseTokenAddress, decimals: 6 },
        senior: { symbol: live.seniorSymbol, address: live.seniorTrancheAddress, decimals: 18 },
        junior: { symbol: live.juniorSymbol, address: live.juniorTrancheAddress, decimals: 18 },
      },
      capabilities: {
        depositYt: !live.halted,
        withdrawYt: true,
        depositBaseInstant: !live.halted && live.capabilities.depositBaseInstant,
        depositBaseRequest: !live.halted && live.capabilities.depositBaseRequest,
        withdrawBaseAsync: live.capabilities.withdrawBaseAsync,
      },
      status: {
        halted: live.halted,
        stalePrice: isPriceStale(live.lastUpdatedTime),
      },
      limits: {
        seniorDepositCapacity,
        juniorWithdrawalCapacity,
      },
      settlement: MARKET_SETTLEMENT_LABELS,
      warnings: statusWarnings(live),
      dataQuality: {
        sources: {
          tokens: 'live_contract',
          capabilities: 'live_contract',
          limits: 'derived',
          settlement: 'config',
        },
      },
    };
  }

  async getFactsheet(address: string) {
    const live = await this.getLiveMarket(address);
    const marketSymbol = stripTranchePrefix(live.seniorSymbol);

    return {
      market: live.address,
      title: `${marketSymbol} Market Factsheet`,
      rows: MARKET_FACTSHEET_ROWS,
      dataQuality: {
        sources: {
          factsheet: 'config',
        },
      },
    };
  }

  async getChart(address: string, metric: MarketChartMetric, range: MarketChartRange = '30d') {
    const live = await this.getLiveMarket(address);
    const fixture = MARKET_CHART_FIXTURES[metric];
    const timestamps = chartTimestamps();

    return {
      market: live.address,
      metric,
      range,
      headline: {
        label: fixture.label,
        value: fixture.value,
        unit: fixture.unit,
        source: 'mock',
      },
      series: fixture.values.map((value, index) => ({ timestamp: timestamps[index], value, source: 'mock' })),
      dataQuality: {
        sources: {
          series: 'mock',
        },
      },
    };
  }

  private async getLiveMarket(address: string): Promise<LiveMarketState> {
    const live = await this.contractReader.getMarketState();

    if (normalizeAddress(live.address) !== normalizeAddress(address)) {
      throw new NotFoundException({
        error: {
          code: 'INVALID_MARKET',
          message: 'Market not found',
          details: { address },
        },
      });
    }

    return live;
  }
}
