import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '@shared/common/dto/error-swagger.dto';
import {
  MarketChartResponseDto,
  MarketDepositLimitsResponseDto,
  MarketDetailDto,
  MarketFactsheetResponseDto,
  MarketListResponseDto,
  MarketPriceStatusResponseDto,
  MarketTradeConstraintsResponseDto,
} from './dto/market-swagger.dto';
import type { MarketChartMetric, MarketChartRange } from './market-metadata.config';
import { MarketStateService } from './market-state.service';

@ApiTags('Markets')
@Controller('markets')
export class MarketStateController {
  constructor(private readonly marketState: MarketStateService) {}

  @Get()
  @ApiOperation({
    summary: 'List FE-ready markets',
    description:
      'Returns the configured live market for the Explore Markets table and card/grid views. NAV/TVL values come from contract reads and are raw precision strings; FE should format them according to token decimals. APY is currently a backend placeholder returned as 0 until live APY calculation is implemented.',
  })
  @ApiOkResponse({
    description: 'Markets available for Explore screens with table/card-ready fields.',
    type: MarketListResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  listMarkets() {
    return this.marketState.listMarkets();
  }

  @Get(':address/deposit-limits')
  @ApiOperation({ summary: 'Get market deposit limits', description: 'Returns senior deposit capacity using the canonical D_max = J * L_max - S formula.' })
  @ApiParam({ name: 'address', description: 'Market contract/read-model address. Matching is case-insensitive.' })
  @ApiOkResponse({ description: 'Derived market deposit capacity.', type: MarketDepositLimitsResponseDto })
  @ApiNotFoundResponse({ description: 'Market not found.', type: ErrorResponseDto })
  getDepositLimits(@Param('address') address: string) {
    return this.marketState.getDepositLimits(address);
  }

  @Get(':address/price-status')
  @ApiOperation({ summary: 'Get market price freshness status', description: 'Returns standalone price freshness using the same stale threshold as market state.' })
  @ApiParam({ name: 'address', description: 'Market contract/read-model address. Matching is case-insensitive.' })
  @ApiOkResponse({ description: 'Market price freshness status.', type: MarketPriceStatusResponseDto })
  @ApiNotFoundResponse({ description: 'Market not found.', type: ErrorResponseDto })
  getPriceStatus(@Param('address') address: string) {
    return this.marketState.getPriceStatus(address);
  }

  @Get(':address/trade-constraints')
  @ApiOperation({ summary: 'Get FE trade constraints', description: 'Returns thin domain constraints for market detail trading without wallet/UI-only state.' })
  @ApiParam({ name: 'address', description: 'Market contract/read-model address. Matching is case-insensitive.' })
  @ApiOkResponse({ description: 'Market trade constraints and source labels.', type: MarketTradeConstraintsResponseDto })
  @ApiNotFoundResponse({ description: 'Market not found.', type: ErrorResponseDto })
  getTradeConstraints(@Param('address') address: string) {
    return this.marketState.getTradeConstraints(address);
  }

  @Get(':address/factsheet')
  @ApiOperation({ summary: 'Get market factsheet', description: 'Returns config-backed factsheet metadata for market detail More Info sections.' })
  @ApiParam({ name: 'address', description: 'Market contract/read-model address. Matching is case-insensitive.' })
  @ApiOkResponse({ description: 'Config-backed market factsheet.', type: MarketFactsheetResponseDto })
  @ApiNotFoundResponse({ description: 'Market not found.', type: ErrorResponseDto })
  getFactsheet(@Param('address') address: string) {
    return this.marketState.getFactsheet(address);
  }

  @Get(':address/charts')
  @ApiOperation({ summary: 'Get market chart payload', description: 'Returns FE-stable chart payloads with explicit source labels. MVP history is deterministic mock/config data.' })
  @ApiParam({ name: 'address', description: 'Market contract/read-model address. Matching is case-insensitive.' })
  @ApiQuery({ name: 'metric', enum: ['yield', 'tokenPrice', 'tvl', 'utilization', 'ratio'], required: true })
  @ApiQuery({ name: 'range', enum: ['30d'], required: false })
  @ApiOkResponse({ description: 'Chart headline and series data.', type: MarketChartResponseDto })
  @ApiNotFoundResponse({ description: 'Market not found.', type: ErrorResponseDto })
  getChart(
    @Param('address') address: string,
    @Query('metric') metric: MarketChartMetric,
    @Query('range') range: MarketChartRange = '30d',
  ) {
    return this.marketState.getChart(address, metric, range);
  }

  @Get(':address')
  @ApiOperation({
    summary: 'Get FE-ready market detail',
    description:
      'Returns a single live market payload for market card clicks, detail pages, and future deposit flows. Includes raw precision NAV split, price freshness derived from lastUpdatedTime, underlying/base-token metadata, and live capability flags that FE should use to enable or hide actions.',
  })
  @ApiParam({
    name: 'address',
    description: 'Market contract/read-model address. Matching is case-insensitive.',
    example: '0x0000000000000000000000000000000000000001',
  })
  @ApiOkResponse({ description: 'Market detail with NAV, price status, and capabilities.', type: MarketDetailDto })
  @ApiNotFoundResponse({ description: 'Market not found.', type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getMarket(@Param('address') address: string) {
    return this.marketState.getMarket(address);
  }
}
