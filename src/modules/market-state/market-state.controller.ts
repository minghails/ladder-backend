import { Controller, Get, Param } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '@shared/common/dto/error-swagger.dto';
import { MarketDetailDto, MarketListResponseDto } from './dto/market-swagger.dto';
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
