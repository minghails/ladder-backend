import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '@shared/common/dto/error-swagger.dto';
import { DepositRequestsService } from './deposit-requests.service';

@ApiTags('Deposit Requests')
@Controller('deposit-requests')
export class DepositRequestsController {
  constructor(private readonly depositRequests: DepositRequestsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get indexed async deposit request state', description: 'Returns async base deposit request lifecycle state derived from indexed Market events.' })
  @ApiParam({ name: 'id', description: 'Ladder Market request ID.' })
  @ApiOkResponse({ description: 'Indexed async deposit request detail.' })
  @ApiNotFoundResponse({ description: 'Deposit request not found.', type: ErrorResponseDto })
  getRequest(@Param('id') id: string) {
    return this.depositRequests.getRequest(id);
  }
}
