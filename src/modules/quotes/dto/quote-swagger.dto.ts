import { ApiProperty } from '@nestjs/swagger';

export class DepositBaseQuoteRequestDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Target tranche to mint.', enum: ['senior', 'junior'], example: 'senior' })
  tranche!: 'senior' | 'junior';

  @ApiProperty({ description: 'Base token input amount as a raw string.', example: '1000000' })
  amount!: string;

  @ApiProperty({ description: 'Optional slippage tolerance in basis points.', example: 50, required: false })
  slippageBps?: number;
}

export class WithdrawYtQuoteRequestDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Tranche token to redeem.', enum: ['senior', 'junior'], example: 'junior' })
  tranche!: 'senior' | 'junior';

  @ApiProperty({ description: 'Tranche share amount as a raw string.', example: '1000000000000000000' })
  shares!: string;

  @ApiProperty({ description: 'Optional slippage tolerance in basis points.', example: 100, required: false })
  slippageBps?: number;
}

class QuoteAvailabilityDto {
  @ApiProperty({ description: 'Whether the action is currently available.', example: true })
  available!: boolean;

  @ApiProperty({ description: 'Machine-readable reason when unavailable.', example: null, nullable: true })
  reason!: string | null;
}

class QuoteActionDto {
  @ApiProperty({ description: 'Contract FE should target when building the transaction.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  contract!: string;

  @ApiProperty({ description: 'Contract method hint. Backend does not return encoded calldata in this slice.', example: 'depositInstant' })
  method!: string;

  @ApiProperty({ description: 'Whether token approval is expected before submission.', example: true })
  approvalRequired!: boolean;

  @ApiProperty({ description: 'Token address to approve when approval is required.', example: '0x00000000000000000000000000000000000000a0', required: false })
  approvalToken?: string;

  @ApiProperty({ description: 'Always false for this implementation slice; no raw calldata is returned.', example: false })
  calldataIncluded!: false;
}

class QuoteDataQualityDto {
  @ApiProperty({ description: 'Per-section source labels.', example: { marketState: 'live_contract', output: 'placeholder', constraints: 'derived' } })
  sources!: Record<string, string>;
}

class DepositQuoteInputDto {
  @ApiProperty({ example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ example: 'senior' })
  tranche!: string;

  @ApiProperty({ example: '1000000' })
  amount!: string;

  @ApiProperty({ example: '0x00000000000000000000000000000000000000a0' })
  token!: string;

  @ApiProperty({ example: 50, nullable: true })
  slippageBps!: number | null;
}

class WithdrawQuoteInputDto {
  @ApiProperty({ example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ example: 'junior' })
  tranche!: string;

  @ApiProperty({ example: '1000000000000000000' })
  shares!: string;

  @ApiProperty({ example: '0x00000000000000000000000000000000000000d1' })
  token!: string;

  @ApiProperty({ example: 100, nullable: true })
  slippageBps!: number | null;
}

class QuoteOutputDto {
  @ApiProperty({ description: 'Estimated output token address.', example: '0x00000000000000000000000000000000000000c1' })
  token!: string;

  @ApiProperty({ description: 'Estimated output amount as a raw string.', example: '1000000' })
  amount!: string;

  @ApiProperty({ description: 'Estimate honesty label.', example: 'placeholder' })
  estimateType!: string;
}

export class DepositBaseQuoteResponseDto {
  @ApiProperty({ type: DepositQuoteInputDto })
  input!: DepositQuoteInputDto;

  @ApiProperty({ type: QuoteOutputDto })
  output!: QuoteOutputDto;

  @ApiProperty({ type: QuoteAvailabilityDto })
  availability!: QuoteAvailabilityDto;

  @ApiProperty({ description: 'Warning flags.', example: [], isArray: true, type: String })
  warnings!: string[];

  @ApiProperty({ type: QuoteActionDto })
  action!: QuoteActionDto;

  @ApiProperty({ type: QuoteDataQualityDto })
  dataQuality!: QuoteDataQualityDto;
}

export class WithdrawYtQuoteResponseDto {
  @ApiProperty({ type: WithdrawQuoteInputDto })
  input!: WithdrawQuoteInputDto;

  @ApiProperty({ type: QuoteOutputDto })
  output!: QuoteOutputDto;

  @ApiProperty({ type: QuoteAvailabilityDto })
  availability!: QuoteAvailabilityDto;

  @ApiProperty({ description: 'Warning flags.', example: [], isArray: true, type: String })
  warnings!: string[];

  @ApiProperty({ type: QuoteActionDto })
  action!: QuoteActionDto;

  @ApiProperty({ type: QuoteDataQualityDto })
  dataQuality!: QuoteDataQualityDto;
}
