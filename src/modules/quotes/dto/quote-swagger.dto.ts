import { ApiProperty } from '@nestjs/swagger';

export class DepositBaseQuoteRequestDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Target tranche to mint.', enum: ['senior', 'junior'], example: 'senior' })
  tranche!: 'senior' | 'junior';

  @ApiProperty({ description: 'Base token input amount as a raw string.', example: '1000000' })
  amount!: string;

  @ApiProperty({ description: 'Optional minimum YT output for depositInstant.', example: '990000000000000000', required: false })
  minYtOut?: string;

  @ApiProperty({ description: 'Optional receiver address for minted shares.', example: '0x00000000000000000000000000000000000000e1', required: false })
  receiver?: string;

  @ApiProperty({ description: 'Optional referrer ID passed to Market depositInstant.', example: '0x0000000000000000000000000000000000000000000000000000000000000000', required: false })
  referrerId?: string;

  @ApiProperty({ description: 'Optional slippage tolerance in basis points.', example: 50, required: false })
  slippageBps?: number;
}

export class DepositYtQuoteRequestDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Target tranche to mint.', enum: ['senior', 'junior'], example: 'junior' })
  tranche!: 'senior' | 'junior';

  @ApiProperty({ description: 'YT input amount as a raw string.', example: '1000000000000000000' })
  amountYt!: string;
}

export class WithdrawYtQuoteRequestDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Tranche token to redeem.', enum: ['senior', 'junior'], example: 'junior' })
  tranche!: 'senior' | 'junior';

  @ApiProperty({ description: 'Withdrawal mode.', enum: ['shares', 'assets'], example: 'shares', required: false })
  mode?: 'shares' | 'assets';

  @ApiProperty({ description: 'Withdraw amount as raw shares or assets depending on mode.', example: '1000000000000000000', required: false })
  amount?: string;

  @ApiProperty({ description: 'YT receiver address.', example: '0x00000000000000000000000000000000000000e1', required: false })
  receiver?: string;

  @ApiProperty({ description: 'Backward-compatible tranche share amount as a raw string.', example: '1000000000000000000', required: false })
  shares?: string;

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

class QuoteApprovalDto {
  @ApiProperty({ example: true })
  required!: boolean;

  @ApiProperty({ example: '0x00000000000000000000000000000000000000b1' })
  token!: string;

  @ApiProperty({ example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  spender!: string;

  @ApiProperty({ example: '1000000000000000000' })
  amount!: string;
}

class DepositYtActionArgsDto {
  @ApiProperty({ example: false })
  asSenior!: boolean;

  @ApiProperty({ example: '1000000000000000000' })
  amount!: string;
}

class DepositYtActionDto {
  @ApiProperty({ example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  contract!: string;

  @ApiProperty({ example: 'depositYT' })
  method!: string;

  @ApiProperty({ type: DepositYtActionArgsDto })
  args!: DepositYtActionArgsDto;

  @ApiProperty({ example: false })
  calldataIncluded!: false;

  @ApiProperty({ type: QuoteApprovalDto })
  approval!: QuoteApprovalDto;
}

class QuoteDataQualityDto {
  @ApiProperty({ description: 'Per-section source labels.', example: { marketState: 'live_contract', output: 'placeholder', constraints: 'derived' } })
  sources!: Record<string, string>;
}

class DepositYtQuoteInputDto {
  @ApiProperty({ example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ example: 'junior' })
  tranche!: string;

  @ApiProperty({ example: '1000000000000000000' })
  amountYt!: string;

  @ApiProperty({ example: '0x00000000000000000000000000000000000000b1' })
  token!: string;
}

class DepositYtEstimateDto {
  @ApiProperty({ example: '1000000000000000000' })
  sharesOut!: string;

  @ApiProperty({ example: '1000000000000000000' })
  depositValue!: string;

  @ApiProperty({ example: '2000000000000000000' })
  navAfter!: string;

  @ApiProperty({ example: '1000000000000000000' })
  navStAfter!: string;

  @ApiProperty({ example: '1000000000000000000' })
  navJtAfter!: string;

  @ApiProperty({ example: '1000000000000000000', nullable: true })
  stJtRatioAfter!: string | null;

  @ApiProperty({ example: 'derived' })
  estimateType!: string;
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

export class DepositYtQuoteResponseDto {
  @ApiProperty({ type: DepositYtQuoteInputDto })
  input!: DepositYtQuoteInputDto;

  @ApiProperty({ type: DepositYtEstimateDto })
  estimate!: DepositYtEstimateDto;

  @ApiProperty({ type: QuoteAvailabilityDto })
  availability!: QuoteAvailabilityDto;

  @ApiProperty({ description: 'Warning flags.', example: [], isArray: true, type: String })
  warnings!: string[];

  @ApiProperty({ type: DepositYtActionDto })
  action!: DepositYtActionDto;

  @ApiProperty({ type: QuoteDataQualityDto })
  dataQuality!: QuoteDataQualityDto;
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
