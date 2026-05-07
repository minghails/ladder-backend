import { Inject, Injectable, Optional } from '@nestjs/common';
import { desc, or, eq } from 'drizzle-orm';
import { ContractReaderService, type LivePortfolioPosition } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { depositRequests } from '@shared/database/schema';
import { PortfolioActivityRepository } from './portfolio-activity.repository';
import { PortfolioClaimablesRepository } from './portfolio-claimables.repository';
import { PortfolioEarningsRepository, type PortfolioCashflowDto, type PortfolioCostBasisDto } from './portfolio-earnings.repository';
import { portfolioMockEnabled } from './portfolio-production-mode';

export type PortfolioDataSource = 'live' | 'db' | 'mock' | 'placeholder' | 'unavailable' | 'derived' | 'indexed_events' | 'partial_indexed_events';
export type PortfolioRequestStatus = 'pending' | 'settled' | 'rejected' | 'refunded';
export type PortfolioTransactionStatus = 'success' | 'pending' | 'failed' | 'rejected';
export type PortfolioTransactionType =
  | 'buy_senior_token'
  | 'buy_junior_token'
  | 'sell_senior_token'
  | 'sell_junior_token'
  | 'claim_usdc'
  | 'transaction_reward';
export type EarningsRange = '7d' | '30d' | '90d';
export type EarningsGranularity = 'day';

export interface PortfolioQueryOptions {
  includeMock?: boolean;
}

export interface PortfolioListOptions extends PortfolioQueryOptions {
  limit?: number;
  cursor?: string;
}

export interface PortfolioEarningsOptions extends PortfolioQueryOptions {
  range?: EarningsRange;
  granularity?: EarningsGranularity;
}

export interface PortfolioValueChangeDto {
  amount: string;
  percent: string;
  source: PortfolioDataSource;
}

export interface PortfolioSummaryDto {
  totalValue: string;
  totalValueChange: PortfolioValueChangeDto;
  currentEarning: string;
  currentEarningSource: PortfolioDataSource;
  earning30d: string;
  earning30dSource: PortfolioDataSource;
  claimable: {
    amount: string;
    token: string;
    source: PortfolioDataSource;
  };
}

export interface PortfolioPositionDto {
  marketAddress: string;
  marketSymbol: string;
  assetType: 'senior' | 'junior';
  assetSymbol: string;
  tokenAddress: string;
  amount: string;
  value: string;
  currentApy: string;
  allocationPercent: string;
  source: PortfolioDataSource;
  apySource: PortfolioDataSource;
}

export interface PortfolioMetricsDto {
  totalValue: string;
  netApy: string;
  netApySource: PortfolioDataSource;
}

export interface PortfolioDataQualityDto {
  earningsEstimated: boolean;
  historyAvailable: boolean;
  activityIndexedUntilBlock: string | null;
  mockEnabled: boolean;
  mockedSections: string[];
  sources: {
    positions: PortfolioDataSource;
    pendingRequests: PortfolioDataSource;
    earnings: PortfolioDataSource;
    earningsHistory: PortfolioDataSource;
    claimableItems: PortfolioDataSource;
    recentActivities: PortfolioDataSource;
  };
}

export interface PortfolioRequestDto {
  id: string;
  marketAddress: string;
  marketSymbol: string;
  date: string;
  type: 'buy_senior_token' | 'buy_junior_token';
  amount: string;
  value: string;
  status: PortfolioRequestStatus;
  ladderRequestId: string;
  adaptorRequestId: string | null;
  txHash: string | null;
  settlement: {
    estimatedAt: string | null;
    note: string;
  };
  source: PortfolioDataSource;
}

export interface PortfolioClaimableItemDto {
  id: string;
  marketAddress: string;
  marketSymbol: string;
  date: string;
  type: 'transaction_reward' | 'refund' | 'withdrawal';
  amount: string;
  token: string;
  action: {
    label: string;
    enabled: boolean;
    reason: string | null;
  };
  source: PortfolioDataSource;
}

export interface PortfolioActivityDto {
  id: string;
  marketAddress: string;
  marketSymbol: string;
  date: string;
  type: PortfolioTransactionType;
  amount: string;
  value: string;
  status: PortfolioTransactionStatus;
  txHash: string | null;
  source: PortfolioDataSource;
}

export interface PortfolioEarningDto {
  id: string;
  marketAddress: string;
  marketSymbol: string;
  assetType: 'senior' | 'junior';
  assetSymbol: string;
  lifetime: string;
  earning30d: string;
  source: PortfolioDataSource;
}

export interface PortfolioEarningsHistoryPointDto {
  date: string;
  value: string;
}

export interface PortfolioEarningsHistorySeriesDto {
  id: string;
  label: string;
  points: PortfolioEarningsHistoryPointDto[];
  source: PortfolioDataSource;
}

export interface PortfolioEarningsHistoryDto {
  range: EarningsRange;
  granularity: EarningsGranularity;
  series: PortfolioEarningsHistorySeriesDto[];
}

export interface PortfolioLinksDto {
  earnings: string;
  claimables: string;
  requests: string;
  activities: string;
}

export interface PortfolioResponseDto {
  walletAddress: string;
  summary: PortfolioSummaryDto;
  positions: PortfolioPositionDto[];
  portfolioMetrics: PortfolioMetricsDto;
  claimableItems: PortfolioClaimableItemDto[];
  pendingRequests: PortfolioRequestDto[];
  recentActivities: PortfolioActivityDto[];
  dataQuality: PortfolioDataQualityDto;
  links: PortfolioLinksDto;
}

export interface PageDto {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PortfolioRequestsResponseDto {
  walletAddress: string;
  requests: PortfolioRequestDto[];
  page: PageDto;
}

export interface PortfolioEarningsResponseDto {
  walletAddress: string;
  earnings: PortfolioEarningDto[];
  history: PortfolioEarningsHistoryDto;
  dataQuality: PortfolioDataQualityDto;
}

export interface PortfolioClaimablesResponseDto {
  walletAddress: string;
  items: PortfolioClaimableItemDto[];
  page: PageDto;
}

export interface PortfolioActivitiesResponseDto {
  walletAddress: string;
  items: PortfolioActivityDto[];
  page: PageDto;
}

type DepositRequestRow = typeof depositRequests.$inferSelect;

type DrizzleDepositRequestQuery = {
  where(condition: unknown): {
    orderBy(...columns: unknown[]): Promise<DepositRequestRow[]>;
  };
};

type DrizzleQueryBuilder = {
  from(table: typeof depositRequests): DrizzleDepositRequestQuery;
};

type PortfolioReadDatabase = {
  select(): DrizzleQueryBuilder;
};

type FixtureReadDatabase = {
  depositRequestRows: DepositRequestRow[];
};

type PortfolioDatabase = PortfolioReadDatabase | FixtureReadDatabase;

const SCALE = 10n ** 18n;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const OVERVIEW_CLAIMABLE_LIMIT = 3;
const OVERVIEW_PENDING_LIMIT = 3;
const OVERVIEW_ACTIVITY_LIMIT = 5;

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function isFixtureReadDatabase(db: PortfolioDatabase | undefined): db is FixtureReadDatabase {
  return Boolean(db && 'depositRequestRows' in db);
}

function isPortfolioReadDatabase(db: PortfolioDatabase | undefined): db is PortfolioReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit) || limit === undefined) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

function cursorOffset(cursor?: string): number {
  if (!cursor) {
    return 0;
  }

  const parsed = Number(cursor);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function paginate<T>(items: T[], options?: PortfolioListOptions): { items: T[]; page: PageDto } {
  const limit = clampLimit(options?.limit);
  const offset = cursorOffset(options?.cursor);
  const pageItems = items.slice(offset, offset + limit);
  const nextOffset = offset + pageItems.length;
  const hasMore = nextOffset < items.length;

  return {
    items: pageItems,
    page: {
      limit,
      nextCursor: hasMore ? nextOffset.toString() : null,
      hasMore,
    },
  };
}

function mapRequestStatus(status: string): PortfolioRequestStatus {
  switch (status) {
    case 'settled':
      return 'settled';
    case 'rejected':
      return 'rejected';
    case 'refunded':
      return 'refunded';
    default:
      return 'pending';
  }
}

function requestMarketSymbol(row: DepositRequestRow, liveMarketAddress: string, liveMarketSymbol: string): string {
  if (row.marketAddress.toLowerCase() === liveMarketAddress.toLowerCase()) {
    return liveMarketSymbol;
  }

  return 'Unknown Market';
}

function toPortfolioRequestDto(
  row: DepositRequestRow,
  liveMarketAddress: string,
  liveMarketSymbol: string,
): PortfolioRequestDto {
  return {
    id: row.requestId,
    marketAddress: row.marketAddress,
    marketSymbol: requestMarketSymbol(row, liveMarketAddress, liveMarketSymbol),
    date: row.createdAt.toISOString(),
    type: row.asSenior ? 'buy_senior_token' : 'buy_junior_token',
    amount: row.amountIn,
    value: row.amountIn,
    status: mapRequestStatus(row.status),
    ladderRequestId: row.requestId,
    adaptorRequestId: row.adaptorRequestId,
    txHash: row.txHash,
    settlement: {
      estimatedAt: null,
      note: 'Final value may vary at settlement',
    },
    source: 'db',
  };
}

function sumValues(positions: LivePortfolioPosition[]): bigint {
  return positions.reduce((total, position) => total + BigInt(position.value), 0n);
}

function allocationPercent(value: string, totalValue: bigint): string {
  if (totalValue === 0n) {
    return '0';
  }

  const scaled = (BigInt(value) * SCALE) / totalValue;
  const integer = scaled / SCALE;
  const fraction = scaled % SCALE;

  if (fraction === 0n) {
    return integer.toString();
  }

  return `${integer.toString()}.${fraction.toString().padStart(18, '0').replace(/0+$/, '')}`;
}

function toPortfolioPositionDto(position: LivePortfolioPosition, totalValue: bigint): PortfolioPositionDto {
  return {
    marketAddress: position.marketAddress,
    marketSymbol: position.marketSymbol,
    assetType: position.assetType,
    assetSymbol: position.assetSymbol,
    tokenAddress: position.tokenAddress,
    amount: position.assets,
    value: position.value,
    currentApy: '0',
    allocationPercent: allocationPercent(position.value, totalValue),
    source: 'live',
    apySource: 'placeholder',
  };
}

function stripTranchePrefix(symbol: string): string {
  return symbol.replace(/^(st|jt)-/, '') || symbol;
}

function mockClaimableItems(liveMarketAddress: string): PortfolioClaimableItemDto[] {
  return [
    {
      id: 'mock-claim-token-b-1',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token B',
      date: '2026-04-14T00:00:00.000Z',
      type: 'transaction_reward',
      amount: '34207300000',
      token: 'USDC',
      action: { label: 'Claim', enabled: false, reason: 'Mock action metadata only' },
      source: 'mock',
    },
    {
      id: 'mock-claim-token-c-1',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token C',
      date: '2026-04-10T00:00:00.000Z',
      type: 'transaction_reward',
      amount: '89095000000',
      token: 'USDC',
      action: { label: 'Claim', enabled: false, reason: 'Mock action metadata only' },
      source: 'mock',
    },
    {
      id: 'mock-claim-token-d-1',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token D',
      date: '2026-03-28T00:00:00.000Z',
      type: 'transaction_reward',
      amount: '172000000000',
      token: 'USDC',
      action: { label: 'Claim', enabled: false, reason: 'Mock action metadata only' },
      source: 'mock',
    },
    {
      id: 'mock-claim-token-a-1',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token A',
      date: '2026-03-22T00:00:00.000Z',
      type: 'transaction_reward',
      amount: '24500000000',
      token: 'USDC',
      action: { label: 'Claim', enabled: false, reason: 'Mock action metadata only' },
      source: 'mock',
    },
  ];
}

function mockRequests(liveMarketAddress: string): PortfolioRequestDto[] {
  return [
    {
      id: 'mock-request-1',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token B',
      date: '2026-04-16T00:00:00.000Z',
      type: 'buy_senior_token',
      amount: '99800000000',
      value: '81000000000',
      status: 'pending',
      ladderRequestId: 'mock-request-1',
      adaptorRequestId: null,
      txHash: null,
      settlement: { estimatedAt: null, note: 'Mock pending queue row for FE integration' },
      source: 'mock',
    },
    {
      id: 'mock-request-2',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token D',
      date: '2026-04-10T00:00:00.000Z',
      type: 'sell_junior_token' as 'buy_junior_token',
      amount: '76600000000',
      value: '42000000000',
      status: 'pending',
      ladderRequestId: 'mock-request-2',
      adaptorRequestId: null,
      txHash: null,
      settlement: { estimatedAt: null, note: 'Mock pending queue row for FE integration' },
      source: 'mock',
    },
    {
      id: 'mock-request-3',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token A',
      date: '2026-03-28T00:00:00.000Z',
      type: 'buy_junior_token',
      amount: '34700000000',
      value: '8800000000',
      status: 'pending',
      ladderRequestId: 'mock-request-3',
      adaptorRequestId: null,
      txHash: null,
      settlement: { estimatedAt: null, note: 'Mock pending queue row for FE integration' },
      source: 'mock',
    },
  ];
}

function mockActivities(liveMarketAddress: string): PortfolioActivityDto[] {
  return [
    {
      id: 'mock-activity-1',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token A',
      date: '2026-03-10T00:00:00.000Z',
      type: 'buy_senior_token',
      amount: '148000000000000000000',
      value: '52000000000',
      status: 'success',
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000a01',
      source: 'mock',
    },
    {
      id: 'mock-activity-2',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token A',
      date: '2026-03-10T00:00:00.000Z',
      type: 'buy_senior_token',
      amount: '65000000000000000000',
      value: '34000000000',
      status: 'success',
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000a02',
      source: 'mock',
    },
    {
      id: 'mock-activity-3',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token B',
      date: '2026-03-08T00:00:00.000Z',
      type: 'claim_usdc',
      amount: '2520000000',
      value: '2520000000',
      status: 'success',
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000a03',
      source: 'mock',
    },
    {
      id: 'mock-activity-4',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token C',
      date: '2026-03-07T00:00:00.000Z',
      type: 'buy_junior_token',
      amount: '89500000000000000000',
      value: '50000000000',
      status: 'rejected',
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000a04',
      source: 'mock',
    },
    {
      id: 'mock-activity-5',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token D',
      date: '2026-03-05T00:00:00.000Z',
      type: 'sell_senior_token',
      amount: '10500000000000000000',
      value: '43450000000',
      status: 'success',
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000a05',
      source: 'mock',
    },
  ];
}

function rangeDays(range: EarningsRange): number {
  switch (range) {
    case '7d':
      return 7;
    case '90d':
      return 90;
    default:
      return 30;
  }
}

function cashflowSince(range: EarningsRange): Date {
  return new Date(Date.now() - rangeDays(range) * 24 * 60 * 60 * 1000);
}

function cashflowDate(cashflow: PortfolioCashflowDto): string {
  return cashflow.blockTimestamp.toISOString().slice(0, 10);
}

function cashflowHistorySource(cashflows: PortfolioCashflowDto[], costBasisRows: PortfolioCostBasisDto[]): PortfolioDataSource {
  if (cashflows.length === 0) {
    return 'unavailable';
  }

  return costBasisRows.some((row) => row.dataQuality !== 'full') ? 'partial_indexed_events' : 'indexed_events';
}

function toEarningsHistory(
  range: EarningsRange,
  granularity: EarningsGranularity,
  cashflows: PortfolioCashflowDto[],
  costBasisRows: PortfolioCostBasisDto[],
): PortfolioEarningsHistoryDto {
  const source = cashflowHistorySource(cashflows, costBasisRows);

  if (source === 'unavailable') {
    return { range, granularity, series: [] };
  }

  const byTranche = new Map<'senior' | 'junior', Map<string, bigint>>();

  for (const cashflow of cashflows) {
    const tranche = cashflow.tranche === 'junior' ? 'junior' : 'senior';
    const points = byTranche.get(tranche) ?? new Map<string, bigint>();
    const date = cashflowDate(cashflow);
    points.set(date, (points.get(date) ?? 0n) + BigInt(cashflow.valueDelta));
    byTranche.set(tranche, points);
  }

  return {
    range,
    granularity,
    series: Array.from(byTranche.entries()).map(([tranche, points]) => ({
      id: tranche,
      label: tranche === 'senior' ? 'Senior Token' : 'Junior Token',
      points: Array.from(points.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([date, value]) => ({ date, value: value.toString() })),
      source,
    })),
  };
}

function computeLiveClaimableSummary(
  claimableItems: PortfolioClaimableItemDto[],
  baseTokenAddress: string,
): Pick<PortfolioSummaryDto['claimable'], 'amount' | 'source'> {
  const normalizedBaseToken = baseTokenAddress.toLowerCase();
  const enabledBaseRefunds = claimableItems.filter(
    (item) => item.type === 'refund' && item.action.enabled && item.token.toLowerCase() === normalizedBaseToken,
  );

  if (enabledBaseRefunds.length === 0) {
    return { amount: '0', source: 'unavailable' };
  }

  return {
    amount: enabledBaseRefunds.reduce((total, item) => total + BigInt(item.amount), 0n).toString(),
    source: 'db',
  };
}

function dataQuality(
  mockEnabled: boolean,
  recentActivitiesSource: PortfolioDataSource = mockEnabled ? 'mock' : 'unavailable',
  earningsSource: PortfolioDataSource = mockEnabled ? 'mock' : 'unavailable',
  earningsHistorySource: PortfolioDataSource = mockEnabled ? 'mock' : 'unavailable',
  claimableItemsSource: PortfolioDataSource = mockEnabled ? 'mock' : 'unavailable',
  historyAvailable = mockEnabled,
): PortfolioDataQualityDto {
  const mockedSections = mockEnabled
    ? [
        'summary.totalValueChange',
        'summary.currentEarning',
        'summary.earning30d',
        'summary.claimable',
        'positions.currentApy',
        'portfolioMetrics.netApy',
        'earnings',
        'earningsHistory',
        'claimableItems',
      ]
    : [];

  if (recentActivitiesSource === 'mock') {
    mockedSections.push('recentActivities');
  }

  return {
    earningsEstimated: mockEnabled,
    historyAvailable,
    activityIndexedUntilBlock: null,
    mockEnabled,
    mockedSections,
    sources: {
      positions: 'live',
      pendingRequests: 'db',
      earnings: earningsSource,
      earningsHistory: earningsHistorySource,
      claimableItems: claimableItemsSource,
      recentActivities: recentActivitiesSource,
    },
  };
}

function earningsSourceForRow(row: Pick<PortfolioCostBasisDto, 'dataQuality'>): PortfolioDataSource {
  return row.dataQuality === 'full' ? 'indexed_events' : 'partial_indexed_events';
}

function earningsSourceForRows(rows: PortfolioCostBasisDto[]): PortfolioDataSource {
  if (rows.length === 0) {
    return 'unavailable';
  }

  return rows.some((row) => row.dataQuality !== 'full') ? 'partial_indexed_events' : 'indexed_events';
}

function findLivePosition(row: PortfolioCostBasisDto, livePositions: LivePortfolioPosition[]): LivePortfolioPosition | undefined {
  return livePositions.find(
    (position) =>
      position.marketAddress.toLowerCase() === row.marketAddress.toLowerCase() &&
      position.assetType === row.tranche,
  );
}

function computeTotalPnl(row: PortfolioCostBasisDto, livePositions: LivePortfolioPosition[]): bigint {
  const currentValue = BigInt(findLivePosition(row, livePositions)?.value ?? '0');
  return BigInt(row.realizedPnl) + currentValue - BigInt(row.openCostBasis);
}

function computePortfolioEarningsSummary(
  rows: PortfolioCostBasisDto[],
  livePositions: LivePortfolioPosition[],
): Pick<PortfolioSummaryDto, 'currentEarning' | 'currentEarningSource' | 'earning30d' | 'earning30dSource' | 'totalValueChange'> {
  const currentEarning = rows.reduce((total, row) => total + computeTotalPnl(row, livePositions), 0n).toString();
  const source = earningsSourceForRows(rows);

  return {
    currentEarning,
    currentEarningSource: source,
    earning30d: '0',
    earning30dSource: 'unavailable',
    totalValueChange: {
      amount: currentEarning,
      percent: '0',
      source,
    },
  };
}

function toPortfolioEarningDto(row: PortfolioCostBasisDto, livePositions: LivePortfolioPosition[]): PortfolioEarningDto {
  const position = findLivePosition(row, livePositions);
  const assetType = row.tranche === 'junior' ? 'junior' : 'senior';

  return {
    id: `${row.marketAddress}:${assetType}`,
    marketAddress: row.marketAddress,
    marketSymbol: position?.marketSymbol ?? stripTranchePrefix(assetType === 'senior' ? 'st-Unknown Market' : 'jt-Unknown Market'),
    assetType,
    assetSymbol: position?.assetSymbol ?? (assetType === 'senior' ? 'Senior Token' : 'Junior Token'),
    lifetime: computeTotalPnl(row, livePositions).toString(),
    earning30d: '0',
    source: earningsSourceForRow(row),
  };
}

function links(address: string, includeMock: boolean): PortfolioLinksDto {
  const mockQuery = includeMock ? '?includeMock=true' : '';
  const listMockQuery = includeMock ? '?includeMock=true&limit=20' : '?limit=20';

  return {
    earnings: `/portfolio/${address}/earnings${mockQuery}`,
    claimables: `/portfolio/${address}/claimables${listMockQuery}`,
    requests: `/portfolio/${address}/requests${listMockQuery}`,
    activities: `/portfolio/${address}/activities${listMockQuery}`,
  };
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly contractReader: ContractReaderService,
    private readonly activityRepository: PortfolioActivityRepository,
    private readonly earningsRepository: PortfolioEarningsRepository,
    private readonly claimablesRepository: PortfolioClaimablesRepository,
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: PortfolioDatabase,
  ) {}

  async getPortfolio(address: string, options?: PortfolioQueryOptions): Promise<PortfolioResponseDto> {
    void options;
    const normalizedAddress = normalizeAddress(address);
    const [livePositions, liveMarket, requestRows, costBasisRows] = await Promise.all([
      this.contractReader.getPortfolioPositions(normalizedAddress),
      this.contractReader.getMarketState(),
      this.readRequests(normalizedAddress),
      this.earningsRepository.findCostBasis(normalizedAddress),
    ]);
    const marketSymbol = stripTranchePrefix(liveMarket.seniorSymbol);
    const [indexedActivities, liveClaimables] = await Promise.all([
      this.activityRepository.findByWallet(normalizedAddress, marketSymbol),
      this.claimablesRepository.findByWallet(normalizedAddress, marketSymbol),
    ]);
    const totalValue = sumValues(livePositions);
    const pendingRequests = requestRows
      .filter((row) => mapRequestStatus(row.status) === 'pending')
      .map((row) => toPortfolioRequestDto(row, liveMarket.address, marketSymbol));
    const claimableItems = liveClaimables.slice(0, OVERVIEW_CLAIMABLE_LIMIT);
    const recentActivities = indexedActivities.slice(0, OVERVIEW_ACTIVITY_LIMIT);
    const recentActivitiesSource = indexedActivities.length > 0 ? 'db' : 'unavailable';
    const claimableSummary = computeLiveClaimableSummary(claimableItems, liveMarket.baseTokenAddress);
    const earningsSummary = computePortfolioEarningsSummary(costBasisRows, livePositions);

    return {
      walletAddress: normalizedAddress,
      summary: {
        totalValue: totalValue.toString(),
        totalValueChange: earningsSummary.totalValueChange,
        currentEarning: earningsSummary.currentEarning,
        currentEarningSource: earningsSummary.currentEarningSource,
        earning30d: earningsSummary.earning30d,
        earning30dSource: earningsSummary.earning30dSource,
        claimable: {
          amount: claimableSummary.amount,
          token: 'USDC',
          source: claimableSummary.source,
        },
      },
      positions: livePositions.map((position) => toPortfolioPositionDto(position, totalValue)),
      portfolioMetrics: {
        totalValue: totalValue.toString(),
        netApy: '0',
        netApySource: 'unavailable',
      },
      claimableItems,
      pendingRequests: pendingRequests.slice(0, OVERVIEW_PENDING_LIMIT),
      recentActivities,
      dataQuality: dataQuality(false, recentActivitiesSource, earningsSummary.currentEarningSource, 'unavailable', claimableSummary.source),
      links: links(normalizedAddress, false),
    };
  }

  async getRequests(address: string, options?: PortfolioListOptions): Promise<PortfolioRequestsResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = portfolioMockEnabled(options);
    const [liveMarket, requestRows] = await Promise.all([
      this.contractReader.getMarketState(),
      this.readRequests(normalizedAddress),
    ]);
    const realRequests = requestRows.map((row) =>
      toPortfolioRequestDto(row, liveMarket.address, stripTranchePrefix(liveMarket.seniorSymbol)),
    );
    const sourceRequests = realRequests.length > 0 ? realRequests : includeMock ? mockRequests(liveMarket.address) : [];
    const page = paginate(sourceRequests, options);

    return {
      walletAddress: normalizedAddress,
      requests: page.items,
      page: page.page,
    };
  }

  async getEarnings(address: string, options?: PortfolioEarningsOptions): Promise<PortfolioEarningsResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const range = options?.range ?? '30d';
    const granularity = options?.granularity ?? 'day';
    const [livePositions, costBasisRows, cashflowRows] = await Promise.all([
      this.contractReader.getPortfolioPositions(normalizedAddress),
      this.earningsRepository.findCostBasis(normalizedAddress),
      this.earningsRepository.findCashflowsSince(normalizedAddress, cashflowSince(range)),
    ]);
    const earningsSource = earningsSourceForRows(costBasisRows);
    const history = toEarningsHistory(range, granularity, cashflowRows, costBasisRows);
    const historySource = cashflowHistorySource(cashflowRows, costBasisRows);

    return {
      walletAddress: normalizedAddress,
      earnings: costBasisRows.map((row) => toPortfolioEarningDto(row, livePositions)),
      history,
      dataQuality: dataQuality(false, 'unavailable', earningsSource, historySource, 'unavailable', historySource !== 'unavailable'),
    };
  }

  async getClaimables(address: string, options?: PortfolioListOptions): Promise<PortfolioClaimablesResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = portfolioMockEnabled(options);
    const liveMarket = await this.contractReader.getMarketState();
    const marketSymbol = stripTranchePrefix(liveMarket.seniorSymbol);
    const liveClaimables = includeMock ? [] : await this.claimablesRepository.findByWallet(normalizedAddress, marketSymbol);
    const page = paginate(includeMock ? mockClaimableItems(liveMarket.address) : liveClaimables, options);

    return {
      walletAddress: normalizedAddress,
      items: page.items,
      page: page.page,
    };
  }

  async getActivities(address: string, options?: PortfolioListOptions): Promise<PortfolioActivitiesResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = portfolioMockEnabled(options);
    const liveMarket = await this.contractReader.getMarketState();
    const marketSymbol = stripTranchePrefix(liveMarket.seniorSymbol);
    const indexedActivities = await this.activityRepository.findByWallet(normalizedAddress, marketSymbol);
    const sourceActivities = indexedActivities.length > 0 ? indexedActivities : includeMock ? mockActivities(liveMarket.address) : [];
    const page = paginate(sourceActivities, options);

    return {
      walletAddress: normalizedAddress,
      items: page.items,
      page: page.page,
    };
  }

  private async readRequests(address: string): Promise<DepositRequestRow[]> {
    const normalizedAddress = normalizeAddress(address);

    if (isFixtureReadDatabase(this.db)) {
      return this.db.depositRequestRows
        .filter(
          (row) =>
            row.user.toLowerCase() === normalizedAddress ||
            row.receiver.toLowerCase() === normalizedAddress,
        )
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }

    if (!isPortfolioReadDatabase(this.db)) {
      return [];
    }

    try {
      return await this.db
        .select()
        .from(depositRequests)
        .where(
          or(eq(depositRequests.user, normalizedAddress), eq(depositRequests.receiver, normalizedAddress)),
        )
        .orderBy(desc(depositRequests.createdAt));
    } catch {
      return [];
    }
  }
}
