import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TxStatusResponseSwaggerDto } from './dto/tx-status-swagger.dto';
import { TxStatusService } from './tx-status.service';

@ApiTags('Transaction status')
@Controller('tx')
export class TxStatusController {
  constructor(private readonly txStatus: TxStatusService) {}

  @Get(':hash')
  @ApiOperation({
    summary: 'Get indexed transaction status',
    description:
      'Returns whether the Chain Projector has indexed events for a frontend-submitted wagmi transaction hash. This endpoint is backed only by indexed market events and does not sign, submit, or generate transaction calldata.',
  })
  @ApiParam({ name: 'hash', description: 'Transaction hash submitted by the frontend wallet.', example: '0xabcdef0000000000000000000000000000000000000000000000000000000000' })
  @ApiOkResponse({ description: 'Indexed transaction status derived from market_events.', type: TxStatusResponseSwaggerDto })
  getByHash(@Param('hash') hash: string) {
    return this.txStatus.getByHash(hash);
  }
}
