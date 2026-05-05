import { Inject, Injectable, Optional } from '@nestjs/common';
import { desc, or, eq } from 'drizzle-orm';
import { ContractReaderService, type LivePortfolioPosition } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { depositRequests } from '@shared/database/schema';
import { PortfolioActivityRepository } from './portfolio-activity.repository';

export type PortfolioDataSource = 'live' | 'db' | 'mock' | 'placeholder' | 'unavailable' | 'derived';
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

function envMockEnabled(): boolean {
  return process.env['PORTFOLIO_MOCK_FALLBACK'] === 'true';
}

function shouldIncludeMock(options?: PortfolioQueryOptions): boolean {
  return options?.includeMock === true || envMockEnabled();
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

function mockEarnings(liveMarketAddress: string): PortfolioEarningDto[] {
  return [
    {
      id: 'mock-earning-token-a-senior',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token A',
      assetType: 'senior',
      assetSymbol: 'Senior Token',
      lifetime: '834000000000000000000',
      earning30d: '139000000000000000000',
      source: 'mock',
    },
    {
      id: 'mock-earning-token-a-junior',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token A',
      assetType: 'junior',
      assetSymbol: 'Junior Token',
      lifetime: '1436000000000000000000',
      earning30d: '402000000000000000000',
      source: 'mock',
    },
    {
      id: 'mock-earning-token-c-junior',
      marketAddress: liveMarketAddress,
      marketSymbol: 'Token C',
      assetType: 'junior',
      assetSymbol: 'Junior Token',
      lifetime: '873000000000000000000',
      earning30d: '119000000000000000000',
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

function mockEarningsHistory(range: EarningsRange, granularity: EarningsGranularity): PortfolioEarningsHistoryDto {
  const days = rangeDays(range);
  const start = Date.parse('2026-04-01T00:00:00.000Z');
  const seniorPoints: PortfolioEarningsHistoryPointDto[] = [];
  const juniorPoints: PortfolioEarningsHistoryPointDto[] = [];

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    seniorPoints.push({ date, value: (100000000000000000n + BigInt(index) * 9000000000000000n).toString() });
    juniorPoints.push({ date, value: (140000000000000000n + BigInt(index) * 13000000000000000n).toString() });
  }

  return {
    range,
    granularity,
    series: [
      { id: 'senior', label: 'Senior Token', points: seniorPoints, source: 'mock' },
      { id: 'junior', label: 'Junior Token', points: juniorPoints, source: 'mock' },
    ],
  };
}

function sumClaimables(items: PortfolioClaimableItemDto[]): string {
  return items.reduce((total, item) => total + BigInt(item.amount), 0n).toString();
}

function dataQuality(mockEnabled: boolean, recentActivitiesSource: PortfolioDataSource = mockEnabled ? 'mock' : 'unavailable'): PortfolioDataQualityDto {
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
    historyAvailable: mockEnabled,
    activityIndexedUntilBlock: null,
    mockEnabled,
    mockedSections,
    sources: {
      positions: 'live',
      pendingRequests: 'db',
      earnings: mockEnabled ? 'mock' : 'unavailable',
      earningsHistory: mockEnabled ? 'mock' : 'unavailable',
      claimableItems: mockEnabled ? 'mock' : 'unavailable',
      recentActivities: recentActivitiesSource,
    },
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
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: PortfolioDatabase,
  ) {}

  async getPortfolio(address: string, options?: PortfolioQueryOptions): Promise<PortfolioResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = shouldIncludeMock(options);
    const [livePositions, liveMarket, requestRows] = await Promise.all([
      this.contractReader.getPortfolioPositions(normalizedAddress),
      this.contractReader.getMarketState(),
      this.readRequests(normalizedAddress),
    ]);
    const marketSymbol = stripTranchePrefix(liveMarket.seniorSymbol);
    const indexedActivities = await this.activityRepository.findByWallet(normalizedAddress, marketSymbol);
    const totalValue = sumValues(livePositions);
    const realPendingRequests = requestRows
      .filter((row) => mapRequestStatus(row.status) === 'pending')
      .map((row) => toPortfolioRequestDto(row, liveMarket.address, marketSymbol));
    const pendingRequests = realPendingRequests.length > 0 ? realPendingRequests : includeMock ? mockRequests(liveMarket.address) : [];
    const claimableItems = includeMock ? mockClaimableItems(liveMarket.address).slice(0, OVERVIEW_CLAIMABLE_LIMIT) : [];
    const recentActivities = indexedActivities.length > 0
      ? indexedActivities.slice(0, OVERVIEW_ACTIVITY_LIMIT)
      : includeMock
        ? mockActivities(liveMarket.address).slice(0, OVERVIEW_ACTIVITY_LIMIT)
        : [];
    const recentActivitiesSource = indexedActivities.length > 0 ? 'db' : includeMock ? 'mock' : 'unavailable';
    const claimableAmount = includeMock ? sumClaimables(claimableItems) : '0';

    return {
      walletAddress: normalizedAddress,
      summary: {
        totalValue: totalValue.toString(),
        totalValueChange: {
          amount: includeMock ? '4230400000000000000' : '0',
          percent: includeMock ? '0.02' : '0',
          source: includeMock ? 'mock' : 'placeholder',
        },
        currentEarning: includeMock ? '6420750000000000000' : '0',
        currentEarningSource: includeMock ? 'mock' : 'placeholder',
        earning30d: includeMock ? '980500000000000000' : '0',
        earning30dSource: includeMock ? 'mock' : 'placeholder',
        claimable: {
          amount: claimableAmount,
          token: 'USDC',
          source: includeMock ? 'mock' : 'placeholder',
        },
      },
      positions: livePositions.map((position) => toPortfolioPositionDto(position, totalValue)),
      portfolioMetrics: {
        totalValue: totalValue.toString(),
        netApy: includeMock ? '0.0425' : '0',
        netApySource: includeMock ? 'mock' : 'placeholder',
      },
      claimableItems,
      pendingRequests: pendingRequests.slice(0, OVERVIEW_PENDING_LIMIT),
      recentActivities,
      dataQuality: dataQuality(includeMock, recentActivitiesSource),
      links: links(normalizedAddress, includeMock),
    };
  }

  async getRequests(address: string, options?: PortfolioListOptions): Promise<PortfolioRequestsResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = shouldIncludeMock(options);
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
    const includeMock = shouldIncludeMock(options);
    const liveMarket = await this.contractReader.getMarketState();
    const range = options?.range ?? '30d';
    const granularity = options?.granularity ?? 'day';

    return {
      walletAddress: normalizedAddress,
      earnings: includeMock ? mockEarnings(liveMarket.address) : [],
      history: includeMock ? mockEarningsHistory(range, granularity) : { range, granularity, series: [] },
      dataQuality: dataQuality(includeMock),
    };
  }

  async getClaimables(address: string, options?: PortfolioListOptions): Promise<PortfolioClaimablesResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = shouldIncludeMock(options);
    const liveMarket = await this.contractReader.getMarketState();
    const page = paginate(includeMock ? mockClaimableItems(liveMarket.address) : [], options);

    return {
      walletAddress: normalizedAddress,
      items: page.items,
      page: page.page,
    };
  }

  async getActivities(address: string, options?: PortfolioListOptions): Promise<PortfolioActivitiesResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = shouldIncludeMock(options);
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
