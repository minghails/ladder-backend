import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DepositBaseQuoteRequestDto,
  DepositBaseQuoteResponseDto,
  DepositYtQuoteRequestDto,
  DepositYtQuoteResponseDto,
  WithdrawYtQuoteRequestDto,
  WithdrawYtQuoteResponseDto,
} from './dto/quote-swagger.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post('deposit-yt')
  @ApiOperation({
    summary: 'Quote direct YT deposit',
    description:
      'Returns FE-safe quote metadata for the direct YT buy path. This route returns action hints only and never includes raw calldata or a full transaction request.',
  })
  @ApiOkResponse({ description: 'Deposit-YT quote with availability, warnings, and action hints.', type: DepositYtQuoteResponseDto })
  quoteDepositYt(@Body() body: DepositYtQuoteRequestDto) {
    return this.quotes.quoteDepositYt(body);
  }

  @Post('deposit-base')
  @ApiOperation({
    summary: 'Quote base-token deposit',
    description:
      'Returns FE-safe quote metadata for the deposit-base buy path. This slice returns action hints only and never includes raw calldata or a full transaction request.',
  })
  @ApiOkResponse({ description: 'Deposit-base quote with availability, warnings, and action hints.', type: DepositBaseQuoteResponseDto })
  quoteDepositBase(@Body() body: DepositBaseQuoteRequestDto) {
    return this.quotes.quoteDepositBase(body);
  }

  @Post('withdraw-yt')
  @ApiOperation({
    summary: 'Quote YT withdrawal',
    description:
      'Returns FE-safe quote metadata for selling/redeeming Senior or Junior tranche shares to YT. This slice returns action hints only and never includes raw calldata or a full transaction request.',
  })
  @ApiOkResponse({ description: 'Withdraw-YT quote with availability, warnings, and action hints.', type: WithdrawYtQuoteResponseDto })
  quoteWithdrawYt(@Body() body: WithdrawYtQuoteRequestDto) {
    return this.quotes.quoteWithdrawYt(body);
  }
}
