import { ApiProperty } from '@nestjs/swagger';

export class ErrorPayloadDto {
  @ApiProperty({ description: 'Machine-readable error code.', example: 'INVALID_MARKET' })
  code!: string;

  @ApiProperty({ description: 'Human-readable error message.', example: 'Market not found' })
  message!: string;

  @ApiProperty({ description: 'Optional structured error details.', example: {}, required: false })
  details?: Record<string, unknown>;
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Standard API error payload.', type: ErrorPayloadDto })
  error!: ErrorPayloadDto;
}
