import { Controller, Get, Param } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '@shared/common/dto/error-swagger.dto';
import { PortfolioRequestsResponseDto, PortfolioResponseDto } from './dto/portfolio-swagger.dto';
import { PortfolioService } from './portfolio.service';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get(':address/requests')
  @ApiOperation({
    summary: 'List portfolio deposit requests',
    description:
      'Returns deposit request history for the Pending/In Queue transactions section. Rows are read from deposit_requests for the provided wallet as user or receiver; if the database is unavailable, runtime returns an empty request list.',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address whose request history should be returned. The response normalizes this address to lowercase.',
    example: '0xabcdef0000000000000000000000000000000001',
  })
  @ApiOkResponse({ description: 'Deposit request history for the wallet.', type: PortfolioRequestsResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getRequests(@Param('address') address: string) {
    return this.portfolio.getRequests(address);
  }

  @Get(':address')
  @ApiOperation({
    summary: 'Get FE-ready portfolio overview',
    description:
      'Returns Portfolio and Activities page initial-render data from live tranche balances plus deposit_requests. totalValue and position values are raw precision strings computed from live contract reads; earning/APY/change fields are explicit zero placeholders until those calculations are implemented. Only pending mapped requests are embedded in pendingRequests.',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address whose read-only portfolio overview should be returned. The response normalizes this address to lowercase.',
    example: '0xabcdef0000000000000000000000000000000001',
  })
  @ApiOkResponse({ description: 'Portfolio overview for FE initial render.', type: PortfolioResponseDto })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error.', type: ErrorResponseDto })
  getPortfolio(@Param('address') address: string) {
    return this.portfolio.getPortfolio(address);
  }
}
