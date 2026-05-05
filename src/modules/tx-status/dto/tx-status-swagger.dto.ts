import { ApiProperty } from '@nestjs/swagger';

class TxStatusSourcesDto {
  @ApiProperty({ description: 'Transaction status source. Always indexed_events for this endpoint.', example: 'indexed_events' })
  tx!: 'indexed_events';
}

class TxStatusDataQualityDto {
  @ApiProperty({ type: TxStatusSourcesDto })
  sources!: TxStatusSourcesDto;
}

class TxStatusEventSwaggerDto {
  @ApiProperty({ description: 'Decoded event name from market_events.', example: 'DepositYT' })
  eventName!: string;

  @ApiProperty({ description: 'Market contract address that emitted the event.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  marketAddress!: string;

  @ApiProperty({ description: 'Block number as a decimal string.', example: '123' })
  blockNumber!: string;

  @ApiProperty({ description: 'Log index as a decimal string.', example: '0' })
  logIndex!: string;

  @ApiProperty({ description: 'Decoded event args as indexed by the Chain Projector.', example: { user: '0xWallet', asSenior: true, assets: '1000000000000000000' } })
  args!: Record<string, unknown>;
}

export class TxStatusResponseSwaggerDto {
  @ApiProperty({ description: 'Normalized lowercase transaction hash.', example: '0xabcdef0000000000000000000000000000000000000000000000000000000000' })
  txHash!: string;

  @ApiProperty({ description: 'indexed when at least one matching market event exists; otherwise not_indexed.', enum: ['indexed', 'not_indexed'], example: 'indexed' })
  status!: 'indexed' | 'not_indexed';

  @ApiProperty({ description: 'Confirmation source. This endpoint only uses indexed market events.', example: 'indexed_events' })
  confirmationsSource!: 'indexed_events';

  @ApiProperty({ type: [TxStatusEventSwaggerDto], description: 'Matching market events ordered by blockNumber then logIndex ascending.' })
  events!: TxStatusEventSwaggerDto[];

  @ApiProperty({ type: TxStatusDataQualityDto })
  dataQuality!: TxStatusDataQualityDto;
}
