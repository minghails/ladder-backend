import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketSnapshots } from '@shared/database/schema';
import {
  calculateJuniorWithdrawalCapacity,
  calculateSeniorDepositCapacity,
  formatScaledRatio,
  isPriceStale,
  PRICE_STALE_SECONDS,
  unixSecondsToIso,
} from './market-calculations';
import {
  calculateRollingApySeries,
  MarketApyService,
  type MarketApyResult,
  type MarketApySeriesPoint,
  type MarketApySnapshot,
} from './market-apy.service';
import { MarketFactsheetService } from './market-factsheet.service';
import {
  BASE_SEPOLIA_MARKET_NETWORK,
  MARKET_CHART_CONFIG,
  type MarketChartMetric,
  type MarketChartRange,
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
  apySource: 'indexed_snapshots' | 'unavailable';
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
  dataQuality: MarketSourceQualityDto;
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

export interface MarketSourceQualityDto {
  sources: {
    marketState: 'live_contract';
    apy: 'indexed_snapshots' | 'unavailable';
    tokenMetadata?: 'live_contract';
  };
}

export interface MarketListResponseDto {
  markets: MarketListItemDto[];
  dataQuality: MarketSourceQualityDto;
}

export interface MarketHistoryQueryOptions {
  limit?: number;
  cursor?: number;
}

export interface MarketHistoryItemDto {
  blockNumber: string;
  timestamp: string;
  nav: string;
  navSt: string;
  navJt: string;
  stJtRatio: string;
  ytPrice: string;
  halted: boolean;
}

export interface MarketHistoryResponseDto {
  market: string;
  items: MarketHistoryItemDto[];
  page: {
    limit: number;
    nextCursor: number | null;
    hasMore: boolean;
  };
  dataQuality: {
    sources: {
      history: 'indexed_events';
    };
  };
}

interface MarketStateDatabase {
  query: {
    marketSnapshots: {
      findMany: (config: unknown) => Promise<Array<typeof marketSnapshots.$inferSelect>>;
    };
  };
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

async function toMarketDetail(live: LiveMarketState, contractReader: ContractReaderService, apy: MarketApyResult): Promise<MarketDetailDto> {
  const marketSymbol = stripTranchePrefix(live.seniorSymbol);
  const stalePrice = isPriceStale(live.lastUpdatedTime);
  const baseTokenMetadata = await contractReader.getTokenMetadata(live.baseTokenAddress);

  return {
    address: live.address,
    symbol: marketSymbol,
    name: marketSymbol,
    description: `${marketSymbol} Ladder market`,
    network: BASE_SEPOLIA_MARKET_NETWORK,
    totalTvl: live.nav,
    senior: {
      symbol: live.seniorSymbol,
      apy: apy.senior.apy,
      apySource: apy.senior.source,
      tvl: live.navSt,
    },
    junior: {
      symbol: live.juniorSymbol,
      apy: apy.junior.apy,
      apySource: apy.junior.source,
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
        symbol: baseTokenMetadata.symbol,
        address: live.baseTokenAddress,
        decimals: baseTokenMetadata.decimals,
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
    dataQuality: {
      sources: {
        marketState: 'live_contract',
        apy: apy.senior.source === 'indexed_snapshots' || apy.junior.source === 'indexed_snapshots' ? 'indexed_snapshots' : 'unavailable',
        tokenMetadata: 'live_contract',
      },
    },
  };
}

@Injectable()
export class MarketStateService {
  constructor(
    private readonly contractReader: ContractReaderService,
    private readonly apyService: MarketApyService,
    private readonly factsheetService: MarketFactsheetService,
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: MarketStateDatabase,
  ) {}

  async listMarkets(): Promise<MarketListResponseDto> {
    const live = await this.contractReader.getMarketState();
    const market = await toMarketDetail(live, this.contractReader, await this.marketApy(live.address));

    return {
      markets: [toListItem(market)],
      dataQuality: market.dataQuality,
    };
  }

  async getMarket(address: string): Promise<MarketDetailDto> {
    const live = await this.getLiveMarket(address);
    return toMarketDetail(live, this.contractReader, await this.marketApy(live.address));
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
    const baseTokenMetadata = await this.contractReader.getTokenMetadata(live.baseTokenAddress);

    return {
      market: live.address,
      tokens: {
        yt: { symbol: stripTranchePrefix(live.seniorSymbol), address: live.ytTokenAddress, decimals: 18 },
        base: { symbol: baseTokenMetadata.symbol, address: live.baseTokenAddress, decimals: baseTokenMetadata.decimals },
        senior: { symbol: live.seniorSymbol, address: live.seniorTrancheAddress, decimals: 18 },
        junior: { symbol: live.juniorSymbol, address: live.juniorTrancheAddress, decimals: 18 },
      },
      approvals: {
        depositYt: { token: live.ytTokenAddress, spender: live.address },
        depositBaseInstant: { token: live.baseTokenAddress, spender: live.address },
        withdrawSenior: { token: live.seniorTrancheAddress, spender: live.address },
        withdrawJunior: { token: live.juniorTrancheAddress, spender: live.address },
      },
      methods: {
        depositYt: 'depositYT',
        depositBaseInstant: 'depositInstant',
        withdrawYt: 'withdraw',
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
        seniorDepositCapacityYt: seniorDepositCapacity,
        juniorWithdrawalCapacityYt: juniorWithdrawalCapacity,
        maxStJtRatio: live.maxStJtRatio,
        currentStJtRatio: live.currentStJtRatio,
      },
      settlement: MARKET_SETTLEMENT_LABELS,
      warnings: statusWarnings(live),
      dataQuality: {
        sources: {
          tokens: 'config_address_live_metadata',
          approvals: 'derived',
          methods: 'contract_abi',
          capabilities: 'live_contract',
          limits: 'derived',
          settlement: 'config',
        },
      },
    };
  }

  async getFactsheet(address: string) {
    const live = await this.getLiveMarket(address);
    const baseTokenMetadata = await this.contractReader.getTokenMetadata(live.baseTokenAddress);
    const factsheet = this.factsheetService.build(live, baseTokenMetadata);

    return {
      market: live.address,
      ...factsheet,
      dataQuality: {
        sources: {
          factsheet: factsheet.sources,
        },
      },
    };
  }

  async getChart(address: string, metric: MarketChartMetric, range: MarketChartRange = '30d') {
    const live = await this.getLiveMarket(address);
    const chartConfig = MARKET_CHART_CONFIG[metric];
    const snapshots = await this.readSnapshotRows(live.address);
    const chronological = [...snapshots].reverse();
    const rangedChronological = snapshotsInRange(chronological);

    if (metric === 'yield') {
      const apySnapshots = chronological.map(toMarketApySnapshot);
      const rollingSeries = calculateRollingApySeries(apySnapshots);
      return indexedYieldChart(live.address, range, chartConfig, apySeriesInRange(rollingSeries, chronological));
    }

    if (metric === 'utilization') {
      return indexedSnapshotChart(live.address, metric, range, chartConfig, rangedChronological, (snapshot) =>
        utilizationValue(snapshot.jtStRatio, snapshot.maxStJtRatio),
      );
    }

    return indexedSnapshotChart(live.address, metric, range, chartConfig, rangedChronological, (snapshot) => chartValue(snapshot, metric));
  }

  async getHistory(
    address: string,
    options: MarketHistoryQueryOptions = {},
  ): Promise<MarketHistoryResponseDto> {
    const live = await this.getLiveMarket(address);
    const limit = normalizeLimit(options.limit);
    const cursor = normalizeCursor(options.cursor);
    const rows = await this.readSnapshotRows(live.address);
    const pageRows = rows.slice(cursor, cursor + limit + 1);
    const items = pageRows.slice(0, limit).map(toHistoryItem);
    const hasMore = pageRows.length > limit;

    return {
      market: live.address,
      items,
      page: {
        limit,
        nextCursor: hasMore ? cursor + limit : null,
        hasMore,
      },
      dataQuality: {
        sources: {
          history: 'indexed_events',
        },
      },
    };
  }

  private async marketApy(address: string): Promise<MarketApyResult> {
    const snapshots = await this.readSnapshotRows(address);
    return this.apyService.calculate(snapshots);
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

  private async readSnapshotRows(
    marketAddress: string,
  ): Promise<Array<typeof marketSnapshots.$inferSelect>> {
    if (this.db === undefined) {
      return [];
    }

    const rows = await this.db.query.marketSnapshots.findMany({
      where: eq(marketSnapshots.marketAddress, normalizeAddress(marketAddress)),
    });

    return rows.sort(compareSnapshotsDesc);
  }
}

function normalizeLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 100;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 100);
}

function normalizeCursor(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(Math.trunc(value), 0);
}

function toHistoryItem(row: typeof marketSnapshots.$inferSelect): MarketHistoryItemDto {
  return {
    blockNumber: row.blockNumber,
    timestamp: row.snapshotAt.toISOString(),
    nav: row.nav,
    navSt: row.navSt,
    navJt: row.navJt,
    stJtRatio: row.jtStRatio,
    ytPrice: row.ytPrice,
    halted: row.halted === 'true',
  };
}

function compareSnapshotsDesc(
  left: typeof marketSnapshots.$inferSelect,
  right: typeof marketSnapshots.$inferSelect,
): number {
  const leftBlock = BigInt(left.blockNumber);
  const rightBlock = BigInt(right.blockNumber);
  if (leftBlock !== rightBlock) {
    return leftBlock > rightBlock ? -1 : 1;
  }
  const leftLog = BigInt(left.sourceLogIndex);
  const rightLog = BigInt(right.sourceLogIndex);
  if (leftLog === rightLog) {
    return 0;
  }
  return leftLog > rightLog ? -1 : 1;
}

function toMarketApySnapshot(snapshot: typeof marketSnapshots.$inferSelect): MarketApySnapshot {
  return {
    stSharePrice: snapshot.stSharePrice,
    jtSharePrice: snapshot.jtSharePrice,
    snapshotAt: snapshot.snapshotAt,
  };
}

function chartValue(
  snapshot: typeof marketSnapshots.$inferSelect,
  metric: 'tvl' | 'tokenPrice' | 'ratio',
): string {
  if (metric === 'tvl') {
    return snapshot.nav;
  }
  if (metric === 'tokenPrice') {
    return snapshot.ytPrice;
  }
  return snapshot.jtStRatio;
}

function snapshotsInRange(snapshots: Array<typeof marketSnapshots.$inferSelect>): Array<typeof marketSnapshots.$inferSelect> {
  if (snapshots.length === 0) {
    return snapshots;
  }

  const latest = snapshots.at(-1);
  if (!latest) {
    return snapshots;
  }

  const earliestIncludedMs = latest.snapshotAt.getTime() - 30 * 24 * 60 * 60 * 1000;
  return snapshots.filter((snapshot) => snapshot.snapshotAt.getTime() >= earliestIncludedMs);
}

function apySeriesInRange(
  series: MarketApySeriesPoint[],
  snapshots: Array<typeof marketSnapshots.$inferSelect>,
): MarketApySeriesPoint[] {
  if (snapshots.length === 0) {
    return series;
  }

  const latest = snapshots.at(-1);
  if (!latest) {
    return series;
  }

  const earliestIncludedMs = latest.snapshotAt.getTime() - 30 * 24 * 60 * 60 * 1000;
  return series.filter((point) => new Date(point.timestamp).getTime() >= earliestIncludedMs);
}

function indexedYieldChart(
  market: string,
  range: MarketChartRange,
  chartConfig: (typeof MARKET_CHART_CONFIG)['yield'],
  series: MarketApySeriesPoint[],
) {
  const latest = series.at(-1);

  if (!latest) {
    return unavailableChart(market, 'yield', range, chartConfig);
  }

  return {
    market,
    metric: 'yield' as const,
    range,
    headline: {
      label: chartConfig.label,
      value: latest.value,
      unit: chartConfig.unit,
      source: 'indexed_snapshots' as const,
    },
    series,
    dataQuality: {
      sources: {
        charts: 'indexed_snapshots' as const,
        series: 'indexed_snapshots' as const,
      },
    },
  };
}

function unavailableChart(
  market: string,
  metric: MarketChartMetric,
  range: MarketChartRange,
  chartConfig: (typeof MARKET_CHART_CONFIG)[MarketChartMetric],
) {
  return {
    market,
    metric,
    range,
    headline: {
      label: chartConfig.label,
      value: '0',
      unit: chartConfig.unit,
      source: 'unavailable' as const,
    },
    series: [],
    dataQuality: {
      sources: {
        charts: 'unavailable' as const,
        series: 'unavailable' as const,
      },
    },
  };
}

function indexedSnapshotChart(
  market: string,
  metric: Exclude<MarketChartMetric, 'yield'>,
  range: MarketChartRange,
  chartConfig: (typeof MARKET_CHART_CONFIG)[Exclude<MarketChartMetric, 'yield'>],
  snapshots: Array<typeof marketSnapshots.$inferSelect>,
  valueFor: (snapshot: typeof marketSnapshots.$inferSelect) => string | null,
) {
  const series = snapshots.flatMap((snapshot) => {
    const value = valueFor(snapshot);
    if (value === null) {
      return [];
    }
    return [{
      timestamp: snapshot.snapshotAt.toISOString(),
      value,
      source: 'indexed_snapshots' as const,
    }];
  });
  const latest = series.at(-1);

  if (!latest) {
    return unavailableChart(market, metric, range, chartConfig);
  }

  return {
    market,
    metric,
    range,
    headline: {
      label: chartConfig.label,
      value: latest.value,
      unit: chartConfig.unit,
      source: 'indexed_snapshots' as const,
    },
    series,
    dataQuality: {
      sources: {
        charts: 'indexed_snapshots' as const,
        series: 'indexed_snapshots' as const,
      },
    },
  };
}

function utilizationValue(currentStJtRatio: string, maxStJtRatio: string): string | null {
  const maxRatio = BigInt(maxStJtRatio);
  if (maxRatio <= 0n) {
    return null;
  }
  return formatChartScaledDecimal((BigInt(currentStJtRatio) * 10n ** 18n) / maxRatio);
}

function formatChartScaledDecimal(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const integer = absolute / 10n ** 18n;
  const fraction = absolute % 10n ** 18n;

  if (fraction === 0n) {
    return `${negative ? '-' : ''}${integer.toString()}`;
  }

  return `${negative ? '-' : ''}${integer.toString()}.${fraction.toString().padStart(18, '0').replace(/0+$/, '')}`;
}
