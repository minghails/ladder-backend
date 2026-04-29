import { Injectable, NotFoundException } from '@nestjs/common';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';

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

const BASE_SEPOLIA: MarketNetworkDto = {
  chainId: 84532,
  name: 'Base Sepolia',
  icon: 'ethereum',
};

const PRICE_STALE_SECONDS = 24 * 60 * 60;
const SCALE = 10n ** 18n;

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

function formatScaledRatio(value: string): string {
  const ratio = BigInt(value);
  const integer = ratio / SCALE;
  const fraction = ratio % SCALE;

  if (fraction === 0n) {
    return integer.toString();
  }

  const fractionText = fraction.toString().padStart(18, '0').replace(/0+$/, '');
  return `${integer.toString()}.${fractionText}`;
}

function unixSecondsToIso(value: string): string {
  return new Date(Number(value) * 1000).toISOString();
}

function isStale(lastUpdatedTime: string): boolean {
  const lastUpdatedSeconds = Number(lastUpdatedTime);
  if (!Number.isFinite(lastUpdatedSeconds) || lastUpdatedSeconds <= 0) {
    return true;
  }

  return Math.floor(Date.now() / 1000) - lastUpdatedSeconds > PRICE_STALE_SECONDS;
}

function toMarketDetail(live: LiveMarketState): MarketDetailDto {
  const marketSymbol = stripTranchePrefix(live.seniorSymbol);
  const stalePrice = isStale(live.lastUpdatedTime);
  const warnings = [
    ...(live.halted ? ['MARKET_HALTED'] : []),
    ...(stalePrice ? ['STALE_PRICE'] : []),
  ];

  return {
    address: live.address,
    symbol: marketSymbol,
    name: marketSymbol,
    description: `${marketSymbol} Ladder market`,
    network: BASE_SEPOLIA,
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
      warnings,
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

    return toMarketDetail(live);
  }
}
