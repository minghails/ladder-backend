import { ApiProperty } from '@nestjs/swagger';

export class PortfolioValueChangeDto {
  @ApiProperty({ description: 'Current backend placeholder absolute value change. Runtime currently returns 0.', example: '0' })
  amount!: string;

  @ApiProperty({ description: 'Current backend placeholder value change as a decimal string. Runtime currently returns 0.', example: '0' })
  percent!: string;
}

export class PortfolioClaimableDto {
  @ApiProperty({ description: 'Claimable amount as a string to preserve precision.', example: '0' })
  amount!: string;

  @ApiProperty({ description: 'Claimable token symbol.', example: 'USDC' })
  token!: string;
}

export class PortfolioSummaryDto {
  @ApiProperty({ description: 'Total portfolio value in raw token precision as a string, computed from live tranche balances and latest YT price.', example: '150000000000000000000' })
  totalValue!: string;

  @ApiProperty({ description: 'Portfolio value change metadata.', type: PortfolioValueChangeDto })
  totalValueChange!: PortfolioValueChangeDto;

  @ApiProperty({ description: 'Current backend placeholder earning amount. Runtime currently returns 0.', example: '0' })
  currentEarning!: string;

  @ApiProperty({ description: 'Current backend placeholder 30-day earning amount. Runtime currently returns 0.', example: '0' })
  earning30d!: string;

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

  @ApiProperty({ description: 'Current backend placeholder APY as a decimal string. Runtime currently returns 0.', example: '0' })
  currentApy!: string;

  @ApiProperty({ description: 'Portfolio allocation as a decimal string. Example 0.15 means 15%.', example: '0.15' })
  allocationPercent!: string;
}

export class PortfolioMetricsDto {
  @ApiProperty({ description: 'Total portfolio value in raw token precision as a string, computed from live tranche balances and latest YT price.', example: '150000000000000000000' })
  totalValue!: string;

  @ApiProperty({ description: 'Current backend placeholder net APY as a decimal string. Runtime currently returns 0.', example: '0' })
  netApy!: string;
}

export class PortfolioDataQualityDto {
  @ApiProperty({ description: 'Whether earnings are estimated. Runtime currently returns false because earning fields are explicit zero placeholders.', example: false })
  earningsEstimated!: boolean;

  @ApiProperty({ description: 'Whether historical activity data is available for chart/table sections.', example: false })
  historyAvailable!: boolean;

  @ApiProperty({ description: 'Latest indexed activity block, or null when activity indexing is not yet available.', example: null, nullable: true })
  activityIndexedUntilBlock!: string | null;
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
    description:
      'Current request lifecycle status. Backend collapses non-final or unrecognized local/adaptor intermediate states into pending for the FE Pending/In Queue section.',
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

  @ApiProperty({ description: 'Claimable items. Empty in the current FE-ready MVP slice.', example: [], isArray: true })
  claimableItems!: unknown[];

  @ApiProperty({ description: 'Only requests whose mapped status is pending are included in the portfolio overview response.', type: PortfolioRequestDto, isArray: true })
  pendingRequests!: PortfolioRequestDto[];

  @ApiProperty({ description: 'Recent activity rows. Empty/deferred in the current FE-ready MVP slice.', example: [], isArray: true })
  recentActivities!: unknown[];

  @ApiProperty({ description: 'Data-quality flags for live portfolio balances and deferred history/activity data.', type: PortfolioDataQualityDto })
  dataQuality!: PortfolioDataQualityDto;
}

export class PortfolioRequestsResponseDto {
  @ApiProperty({ description: 'Normalized lowercase wallet address.', example: '0xabcdef0000000000000000000000000000000001' })
  walletAddress!: string;

  @ApiProperty({ description: 'Deposit request history for Pending/In Queue UI.', type: PortfolioRequestDto, isArray: true })
  requests!: PortfolioRequestDto[];
}
