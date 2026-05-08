import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@shared/common/dto/error-swagger.dto';
import {
  PortfolioActivitiesResponseDto,
  PortfolioClaimablesResponseDto,
  PortfolioEarningsResponseDto,
  PortfolioRequestsResponseDto,
  PortfolioResponseDto,
} from './dto/portfolio-swagger.dto';
import {
  PortfolioService,
  type EarningsGranularity,
  type EarningsRange,
  type PortfolioEarningsOptions,
  type PortfolioListOptions,
  type PortfolioQueryOptions,
} from './portfolio.service';

function parseIncludeMock(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value === 'true';
}

function parseLimit(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function portfolioQuery(includeMock?: string): PortfolioQueryOptions {
  return { includeMock: parseIncludeMock(includeMock) };
}

function portfolioListQuery(includeMock?: string, limit?: string, cursor?: string): PortfolioListOptions {
  return { includeMock: parseIncludeMock(includeMock), limit: parseLimit(limit), cursor };
}

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get(':address/earnings')
  @ApiOperation({
    summary: 'Get portfolio earnings section',
    description:
      'Returns lazy-loaded earnings table and history data from portfolio cost-basis and cashflow projections only. includeMock is ignored for earnings/history production readiness.',
  })
  @ApiParam({ name: 'address', description: 'Wallet address.', example: '0xabcdef0000000000000000000000000000000001' })
  @ApiQuery({ name: 'includeMock', required: false, example: 'true' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', '90d'], example: '30d' })
  @ApiQuery({ name: 'granularity', required: false, enum: ['day'], example: 'day' })
  @ApiOkResponse({ description: 'Portfolio earnings table and history payload for lazy FE loading.', type: PortfolioEarningsResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getEarnings(
    @Param('address') address: string,
    @Query('includeMock') includeMock?: string,
    @Query('range') range?: EarningsRange,
    @Query('granularity') granularity?: EarningsGranularity,
  ) {
    const options: PortfolioEarningsOptions = {
      includeMock: parseIncludeMock(includeMock),
      range,
      granularity,
    };
    return this.portfolio.getEarnings(address, options);
  }

  @Get(':address/claimables')
  @ApiOperation({
    summary: 'Get portfolio claimable rows',
    description:
      'Returns lazy-loaded refund claimable rows from rejected, unrefunded async deposit requests. includeMock is ignored for production readiness.',
  })
  @ApiParam({ name: 'address', description: 'Wallet address.', example: '0xabcdef0000000000000000000000000000000001' })
  @ApiQuery({ name: 'includeMock', required: false, example: 'true' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: 'Paginated claimable rows for lazy FE loading.', type: PortfolioClaimablesResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getClaimables(
    @Param('address') address: string,
    @Query('includeMock') includeMock?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.portfolio.getClaimables(address, portfolioListQuery(includeMock, limit, cursor));
  }

  @Get(':address/activities')
  @ApiOperation({
    summary: 'Get portfolio activity rows',
    description:
      'Returns lazy-loaded recent activity rows derived from indexed Market events. includeMock is ignored for production readiness.',
  })
  @ApiParam({ name: 'address', description: 'Wallet address.', example: '0xabcdef0000000000000000000000000000000001' })
  @ApiQuery({ name: 'includeMock', required: false, example: 'true' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: 'Paginated portfolio activity rows for lazy FE loading.', type: PortfolioActivitiesResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getActivities(
    @Param('address') address: string,
    @Query('includeMock') includeMock?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.portfolio.getActivities(address, portfolioListQuery(includeMock, limit, cursor));
  }

  @Get(':address/requests')
  @ApiOperation({
    summary: 'List portfolio deposit requests',
    description:
      'Returns paginated deposit request history for the Pending/In Queue transactions section. Rows are read from deposit_requests for the provided wallet as user or receiver. includeMock is ignored for production readiness.',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address whose request history should be returned. The response normalizes this address to lowercase.',
    example: '0xabcdef0000000000000000000000000000000001',
  })
  @ApiQuery({ name: 'includeMock', required: false, example: 'true' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: 'Paginated deposit request history for the wallet.', type: PortfolioRequestsResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getRequests(
    @Param('address') address: string,
    @Query('includeMock') includeMock?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.portfolio.getRequests(address, portfolioListQuery(includeMock, limit, cursor));
  }

  @Get(':address')
  @ApiOperation({
    summary: 'Get lightweight FE-ready portfolio overview',
    description:
      'Returns lightweight initial-render data from live tranche balances plus bounded previews. It does not include earnings chart payloads; FE should lazy-load split endpoints via links. includeMock is ignored for production readiness.',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address whose read-only portfolio overview should be returned. The response normalizes this address to lowercase.',
    example: '0xabcdef0000000000000000000000000000000001',
  })
  @ApiQuery({ name: 'includeMock', required: false, example: 'true' })
  @ApiOkResponse({ description: 'lightweight portfolio overview for FE initial render.', type: PortfolioResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getPortfolio(@Param('address') address: string, @Query('includeMock') includeMock?: string) {
    return this.portfolio.getPortfolio(address, portfolioQuery(includeMock));
  }
}
