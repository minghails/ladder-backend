import { ApiProperty } from '@nestjs/swagger';

const DATA_SOURCE_VALUES = ['live', 'db', 'mock', 'placeholder', 'unavailable', 'derived'] as const;

export class PortfolioValueChangeDto {
  @ApiProperty({ description: 'Absolute value change as a string.', example: '4230400000000000000' })
  amount!: string;

  @ApiProperty({ description: 'Value change as a decimal string. Example 0.02 means 2%.', example: '0.02' })
  percent!: string;

  @ApiProperty({ description: 'Source for this value.', enum: DATA_SOURCE_VALUES, example: 'mock' })
  source!: string;
}

export class PortfolioClaimableDto {
  @ApiProperty({ description: 'Claimable amount as a string to preserve precision.', example: '295802300000' })
  amount!: string;

  @ApiProperty({ description: 'Claimable token symbol.', example: 'USDC' })
  token!: string;

  @ApiProperty({ description: 'Source for claimable summary.', enum: DATA_SOURCE_VALUES, example: 'mock' })
  source!: string;
}

export class PortfolioSummaryDto {
  @ApiProperty({ description: 'Total portfolio value in raw token precision as a string, computed from live tranche balances and latest YT price.', example: '150000000000000000000' })
  totalValue!: string;

  @ApiProperty({ description: 'Portfolio value change metadata.', type: PortfolioValueChangeDto })
  totalValueChange!: PortfolioValueChangeDto;

  @ApiProperty({ description: 'Current earning amount. Mock-only until earnings calculations are implemented.', example: '6420750000000000000' })
  currentEarning!: string;

  @ApiProperty({ description: 'Source for currentEarning.', enum: DATA_SOURCE_VALUES, example: 'mock' })
  currentEarningSource!: string;

  @ApiProperty({ description: '30-day earning amount. Mock-only until earnings calculations are implemented.', example: '980500000000000000' })
  earning30d!: string;

  @ApiProperty({ description: 'Source for earning30d.', enum: DATA_SOURCE_VALUES, example: 'mock' })
  earning30dSource!: string;

  @ApiProperty({ description: 'Claimable amount and token metadata.', type: PortfolioClaimableDto })
  claimable!: PortfolioClaimableDto;
}

export class PortfolioPositionDto {
  @ApiProperty({ description: 'Market address for this position.', example: '0x0000000000000000000000000000000000000001' })
  marketAddress!: string;

  @ApiProperty({ description: 'Live market display symbol derived from the tranche symbol.', example: 'mEDGE' })
  marketSymbol!: string;

  @ApiProperty({ description: 'Tranche side for this position.', enum: ['senior', 'junior'], example: 'senior' })
  assetType!: 'senior' | 'junior';

  @ApiProperty({ description: 'Live tranche token symbol.', example: 'st-mEDGE' })
  assetSymbol!: string;

  @ApiProperty({ description: 'Tranche token contract/read-model address.', example: '0x0000000000000000000000000000000000000101' })
  tokenAddress!: string;

  @ApiProperty({ description: 'Live tranche asset amount in raw token precision as a string.', example: '100000000000000000000' })
  amount!: string;

  @ApiProperty({ description: 'Position value in raw token precision as a string, computed as assets * latestYtPrice / 1e18.', example: '100000000000000000000' })
  value!: string;

  @ApiProperty({ description: 'Current APY decimal string. Placeholder 0 until APY calculation is implemented.', example: '0' })
  currentApy!: string;

  @ApiProperty({ description: 'Portfolio allocation as a decimal string. Example 0.15 means 15%.', example: '0.15' })
  allocationPercent!: string;

  @ApiProperty({ description: 'Position balance/value source.', enum: DATA_SOURCE_VALUES, example: 'live' })
  source!: string;

  @ApiProperty({ description: 'APY source.', enum: DATA_SOURCE_VALUES, example: 'placeholder' })
  apySource!: string;
}

export class PortfolioMetricsDto {
  @ApiProperty({ description: 'Total portfolio value in raw token precision as a string, computed from live tranche balances and latest YT price.', example: '150000000000000000000' })
  totalValue!: string;

  @ApiProperty({ description: 'Net APY decimal string. Mock-only with includeMock=true until APY calculations are implemented.', example: '0.0425' })
  netApy!: string;

  @ApiProperty({ description: 'Net APY source.', enum: DATA_SOURCE_VALUES, example: 'mock' })
  netApySource!: string;
}

export class PortfolioDataSourcesDto {
  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'live' })
  positions!: string;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'db' })
  pendingRequests!: string;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  earnings!: string;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  earningsHistory!: string;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  claimableItems!: string;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  recentActivities!: string;
}

export class PortfolioDataQualityDto {
  @ApiProperty({ description: 'Whether earnings are estimated/mock-derived.', example: true })
  earningsEstimated!: boolean;

  @ApiProperty({ description: 'Whether historical activity/chart data is available in this response mode.', example: true })
  historyAvailable!: boolean;

  @ApiProperty({ description: 'Latest indexed activity block, or null when activity indexing is not yet available.', example: null, nullable: true })
  activityIndexedUntilBlock!: string | null;

  @ApiProperty({ description: 'Whether mock fallback data is enabled for this response.', example: true })
  mockEnabled!: boolean;

  @ApiProperty({ description: 'Response sections populated from mock data.', type: String, isArray: true, example: ['earnings', 'recentActivities'] })
  mockedSections!: string[];

  @ApiProperty({ description: 'Per-section data source map.', type: PortfolioDataSourcesDto })
  sources!: PortfolioDataSourcesDto;
}

export class PortfolioRequestSettlementDto {
  @ApiProperty({ description: 'Estimated settlement timestamp, or null when unavailable.', example: null, nullable: true })
  estimatedAt!: string | null;

  @ApiProperty({ description: 'Human-readable settlement note for Pending/In Queue UI.', example: 'Final value may vary at settlement' })
  note!: string;
}

export class PortfolioRequestDto {
  @ApiProperty({ description: 'Ladder/backend deposit request ID from the deposit_requests row.', example: '42' })
  id!: string;

  @ApiProperty({ description: 'Market address associated with the request.', example: '0x0000000000000000000000000000000000000001' })
  marketAddress!: string;

  @ApiProperty({ description: 'Market display symbol.', example: 'mEDGE' })
  marketSymbol!: string;

  @ApiProperty({ description: 'ISO date/time when the request was created or observed.', example: '2026-04-29T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ description: 'FE transaction type for pending/in-queue display.', enum: ['buy_senior_token', 'buy_junior_token'], example: 'buy_senior_token' })
  type!: 'buy_senior_token' | 'buy_junior_token';

  @ApiProperty({ description: 'Requested input amount as a raw precision string from deposit_requests.amountIn.', example: '99800' })
  amount!: string;

  @ApiProperty({ description: 'Current FE value field mirrors amountIn until settlement valuation is available.', example: '99800' })
  value!: string;

  @ApiProperty({
    description: 'Current request lifecycle status. Backend collapses non-final or unrecognized intermediate states into pending.',
    enum: ['pending', 'settled', 'rejected', 'refunded'],
    example: 'pending',
  })
  status!: 'pending' | 'settled' | 'rejected' | 'refunded';

  @ApiProperty({ description: 'Ladder request ID. Runtime mirrors the requestId column.', example: '42' })
  ladderRequestId!: string;

  @ApiProperty({ description: 'Source transaction hash, or null when not yet indexed.', example: null, nullable: true })
  txHash!: string | null;

  @ApiProperty({ description: 'Settlement ETA and note for FE pending state.', type: PortfolioRequestSettlementDto })
  settlement!: PortfolioRequestSettlementDto;

  @ApiProperty({ description: 'Row data source.', enum: DATA_SOURCE_VALUES, example: 'db' })
  source!: string;
}

export class PortfolioClaimActionDto {
  @ApiProperty({ description: 'Button label for FE.', example: 'Claim' })
  label!: string;

  @ApiProperty({ description: 'Whether action is executable. Mock rows are disabled.', example: false })
  enabled!: boolean;

  @ApiProperty({ description: 'Reason when action is disabled.', example: 'Mock action metadata only', nullable: true })
  reason!: string | null;
}

export class PortfolioClaimableItemDto {
  @ApiProperty({ example: 'mock-claim-token-b-1' })
  id!: string;

  @ApiProperty({ example: '0x0000000000000000000000000000000000000001' })
  marketAddress!: string;

  @ApiProperty({ example: 'Token B' })
  marketSymbol!: string;

  @ApiProperty({ example: '2026-04-14T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ enum: ['transaction_reward', 'refund', 'withdrawal'], example: 'transaction_reward' })
  type!: string;

  @ApiProperty({ example: '34207300000' })
  amount!: string;

  @ApiProperty({ example: 'USDC' })
  token!: string;

  @ApiProperty({ type: PortfolioClaimActionDto })
  action!: PortfolioClaimActionDto;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  source!: string;
}

export class PortfolioActivityDto {
  @ApiProperty({ example: 'mock-activity-1' })
  id!: string;

  @ApiProperty({ example: '0x0000000000000000000000000000000000000001' })
  marketAddress!: string;

  @ApiProperty({ example: 'Token A' })
  marketSymbol!: string;

  @ApiProperty({ example: '2026-03-10T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ enum: ['buy_senior_token', 'buy_junior_token', 'sell_senior_token', 'sell_junior_token', 'claim_usdc', 'transaction_reward'], example: 'buy_senior_token' })
  type!: string;

  @ApiProperty({ example: '148000000000000000000' })
  amount!: string;

  @ApiProperty({ example: '52000000000' })
  value!: string;

  @ApiProperty({ enum: ['success', 'pending', 'failed', 'rejected'], example: 'success' })
  status!: string;

  @ApiProperty({ example: '0x0000000000000000000000000000000000000000000000000000000000000a01', nullable: true })
  txHash!: string | null;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  source!: string;
}

export class PortfolioEarningDto {
  @ApiProperty({ example: 'mock-earning-token-a-senior' })
  id!: string;

  @ApiProperty({ example: '0x0000000000000000000000000000000000000001' })
  marketAddress!: string;

  @ApiProperty({ example: 'Token A' })
  marketSymbol!: string;

  @ApiProperty({ enum: ['senior', 'junior'], example: 'senior' })
  assetType!: string;

  @ApiProperty({ example: 'Senior Token' })
  assetSymbol!: string;

  @ApiProperty({ example: '834000000000000000000' })
  lifetime!: string;

  @ApiProperty({ example: '139000000000000000000' })
  earning30d!: string;

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  source!: string;
}

export class PortfolioEarningsHistoryPointDto {
  @ApiProperty({ example: '2026-04-01' })
  date!: string;

  @ApiProperty({ example: '100000000000000000' })
  value!: string;
}

export class PortfolioEarningsHistorySeriesDto {
  @ApiProperty({ example: 'senior' })
  id!: string;

  @ApiProperty({ example: 'Senior Token' })
  label!: string;

  @ApiProperty({ type: PortfolioEarningsHistoryPointDto, isArray: true })
  points!: PortfolioEarningsHistoryPointDto[];

  @ApiProperty({ enum: DATA_SOURCE_VALUES, example: 'mock' })
  source!: string;
}

export class PortfolioEarningsHistoryDto {
  @ApiProperty({ enum: ['7d', '30d', '90d'], example: '30d' })
  range!: string;

  @ApiProperty({ enum: ['day'], example: 'day' })
  granularity!: string;

  @ApiProperty({ type: PortfolioEarningsHistorySeriesDto, isArray: true })
  series!: PortfolioEarningsHistorySeriesDto[];
}

export class PortfolioLinksDto {
  @ApiProperty({ example: '/portfolio/0xabc/earnings?includeMock=true' })
  earnings!: string;

  @ApiProperty({ example: '/portfolio/0xabc/claimables?includeMock=true&limit=20' })
  claimables!: string;

  @ApiProperty({ example: '/portfolio/0xabc/requests?includeMock=true&limit=20' })
  requests!: string;

  @ApiProperty({ example: '/portfolio/0xabc/activities?includeMock=true&limit=20' })
  activities!: string;
}

export class PortfolioResponseDto {
  @ApiProperty({ description: 'Normalized lowercase wallet address.', example: '0xabcdef0000000000000000000000000000000001' })
  walletAddress!: string;

  @ApiProperty({ description: 'Summary data for Portfolio overview cards.', type: PortfolioSummaryDto })
  summary!: PortfolioSummaryDto;

  @ApiProperty({ description: 'Current portfolio positions for table/card UI.', type: PortfolioPositionDto, isArray: true })
  positions!: PortfolioPositionDto[];

  @ApiProperty({ description: 'Portfolio-level metrics.', type: PortfolioMetricsDto })
  portfolioMetrics!: PortfolioMetricsDto;

  @ApiProperty({ description: 'Bounded claimable preview rows for lightweight initial render.', type: PortfolioClaimableItemDto, isArray: true })
  claimableItems!: PortfolioClaimableItemDto[];

  @ApiProperty({ description: 'Bounded pending request preview rows for lightweight initial render.', type: PortfolioRequestDto, isArray: true })
  pendingRequests!: PortfolioRequestDto[];

  @ApiProperty({ description: 'Bounded recent activity preview rows for lightweight initial render.', type: PortfolioActivityDto, isArray: true })
  recentActivities!: PortfolioActivityDto[];

  @ApiProperty({ description: 'Data-quality flags for live, DB, mock, and deferred data.', type: PortfolioDataQualityDto })
  dataQuality!: PortfolioDataQualityDto;

  @ApiProperty({ description: 'Lazy-load links for heavier sections.', type: PortfolioLinksDto })
  links!: PortfolioLinksDto;
}

export class PageDto {
  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: '20', nullable: true })
  nextCursor!: string | null;

  @ApiProperty({ example: false })
  hasMore!: boolean;
}

export class PortfolioRequestsResponseDto {
  @ApiProperty({ description: 'Normalized lowercase wallet address.', example: '0xabcdef0000000000000000000000000000000001' })
  walletAddress!: string;

  @ApiProperty({ description: 'Deposit request history for Pending/In Queue UI.', type: PortfolioRequestDto, isArray: true })
  requests!: PortfolioRequestDto[];

  @ApiProperty({ type: PageDto })
  page!: PageDto;
}

export class PortfolioEarningsResponseDto {
  @ApiProperty({ example: '0xabcdef0000000000000000000000000000000001' })
  walletAddress!: string;

  @ApiProperty({ type: PortfolioEarningDto, isArray: true })
  earnings!: PortfolioEarningDto[];

  @ApiProperty({ type: PortfolioEarningsHistoryDto })
  history!: PortfolioEarningsHistoryDto;

  @ApiProperty({ type: PortfolioDataQualityDto })
  dataQuality!: PortfolioDataQualityDto;
}

export class PortfolioClaimablesResponseDto {
  @ApiProperty({ example: '0xabcdef0000000000000000000000000000000001' })
  walletAddress!: string;

  @ApiProperty({ type: PortfolioClaimableItemDto, isArray: true })
  items!: PortfolioClaimableItemDto[];

  @ApiProperty({ type: PageDto })
  page!: PageDto;
}

export class PortfolioActivitiesResponseDto {
  @ApiProperty({ example: '0xabcdef0000000000000000000000000000000001' })
  walletAddress!: string;

  @ApiProperty({ type: PortfolioActivityDto, isArray: true })
  items!: PortfolioActivityDto[];

  @ApiProperty({ type: PageDto })
  page!: PageDto;
}
