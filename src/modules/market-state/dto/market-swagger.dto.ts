import { ApiProperty } from '@nestjs/swagger';

export class MarketNetworkDto {
  @ApiProperty({ description: 'Chain ID. Current FE-ready MVP uses Base Sepolia.', example: 84532 })
  chainId!: number;

  @ApiProperty({ description: 'Network display name for table/card UI.', example: 'Base Sepolia' })
  name!: string;

  @ApiProperty({ description: 'Frontend icon key for the network.', example: 'ethereum' })
  icon!: string;
}

export class MarketTrancheDto {
  @ApiProperty({ description: 'Live tranche token symbol read from the tranche contract.', example: 'st-mEDGE' })
  symbol!: string;

  @ApiProperty({ description: 'Current backend placeholder APY as a decimal string. Live APY calculation is not implemented yet, so runtime currently returns 0.', example: '0' })
  apy!: string;

  @ApiProperty({ description: 'Live tranche NAV/TVL in raw token precision as a string, read from the Market contract. FE should format according to token decimals.', example: '30000000000000000000000000' })
  tvl!: string;
}

export class MarketRatioDto {
  @ApiProperty({ description: 'Display-ready Senior:Junior ratio derived from the raw 1e18-scaled contract ratio.', example: '3:1' })
  display!: string;

  @ApiProperty({ description: 'Semantic Senior/Junior leverage ratio formatted from the raw 1e18-scaled contract value.', example: '3' })
  stJtRatio!: string;

  @ApiProperty({ description: 'Maximum ST/JT ratio cap formatted from the raw 1e18-scaled contract value.', example: '6' })
  maxStJtRatio!: string;
}

export class MarketStatusDto {
  @ApiProperty({ description: 'Whether the market is halted. FE should disable deposit actions when true.', example: false })
  halted!: boolean;

  @ApiProperty({ description: 'Whether the last market price is stale.', example: false })
  stalePrice!: boolean;

  @ApiProperty({ description: 'Machine-readable warning flags for MVP-safe UI notices.', example: [], isArray: true, type: String })
  warnings!: string[];
}

export class MarketListItemDto {
  @ApiProperty({ description: 'Market contract/read-model address. Use for links and detail calls.', example: '0x0000000000000000000000000000000000000001' })
  address!: string;

  @ApiProperty({ description: 'Short market symbol for table/card title.', example: 'mEDGE' })
  symbol!: string;

  @ApiProperty({ description: 'Display name. Usually same as symbol in this FE-ready slice.', example: 'mEDGE' })
  name!: string;

  @ApiProperty({ description: 'Runtime generated market description based on the live market symbol.', example: 'mEDGE Ladder market' })
  description!: string;

  @ApiProperty({ description: 'Network metadata for FE display.', type: MarketNetworkDto })
  network!: MarketNetworkDto;

  @ApiProperty({ description: 'Live total market NAV/TVL in raw token precision as a string, read from the Market contract. FE should format according to token decimals.', example: '40000000000000000000000000' })
  totalTvl!: string;

  @ApiProperty({ description: 'Senior tranche display data.', type: MarketTrancheDto })
  senior!: MarketTrancheDto;

  @ApiProperty({ description: 'Junior tranche display data.', type: MarketTrancheDto })
  junior!: MarketTrancheDto;

  @ApiProperty({ description: 'Senior/Junior ratio information for display and risk context.', type: MarketRatioDto })
  ratio!: MarketRatioDto;

  @ApiProperty({ description: 'Market status flags and warnings.', type: MarketStatusDto })
  status!: MarketStatusDto;
}

export class MarketBaseTokenDto {
  @ApiProperty({ description: 'Base token symbol.', example: 'USDC' })
  symbol!: string;

  @ApiProperty({ description: 'Base token address.', example: '0x00000000000000000000000000000000000000a0' })
  address!: string;

  @ApiProperty({ description: 'Base token decimals.', example: 6 })
  decimals!: number;
}

export class MarketUnderlyingDto {
  @ApiProperty({ description: 'Underlying yield token symbol.', example: 'mEDGE' })
  symbol!: string;

  @ApiProperty({ description: 'Underlying yield token address.', example: '0x00000000000000000000000000000000000000b1' })
  address!: string;

  @ApiProperty({ description: 'Base token metadata for this market.', type: MarketBaseTokenDto })
  baseToken!: MarketBaseTokenDto;
}

export class MarketNavDto {
  @ApiProperty({ description: 'Total market NAV in raw token precision as a string, read from the Market contract.', example: '40000000000000000000000000' })
  total!: string;

  @ApiProperty({ description: 'Senior tranche NAV in raw token precision as a string, read from the Market contract.', example: '30000000000000000000000000' })
  senior!: string;

  @ApiProperty({ description: 'Junior tranche NAV in raw token precision as a string, read from the Market contract.', example: '10000000000000000000000000' })
  junior!: string;
}

export class MarketPriceDto {
  @ApiProperty({ description: 'ISO timestamp of the latest known market price update.', example: '2026-04-29T00:00:00.000Z' })
  lastUpdatedAt!: string;

  @ApiProperty({ description: 'Whether the latest known market price is stale.', example: false })
  stale!: boolean;
}

export class MarketCapabilitiesDto {
  @ApiProperty({ description: 'Whether direct YT deposit is available.', example: true })
  depositYt!: boolean;

  @ApiProperty({ description: 'Whether direct YT withdrawal is available.', example: true })
  withdrawYt!: boolean;

  @ApiProperty({ description: 'Whether instant base deposit is available through the adaptor.', example: true })
  depositBaseInstant!: boolean;

  @ApiProperty({ description: 'Whether async base deposit requests are available through the adaptor.', example: true })
  depositBaseRequest!: boolean;

  @ApiProperty({ description: 'Market-level async base withdrawal is not supported in the current MVP.', example: false })
  withdrawBaseAsync!: boolean;
}

export class MarketListResponseDto {
  @ApiProperty({ description: 'List of markets available for Explore screens.', type: MarketListItemDto, isArray: true })
  markets!: MarketListItemDto[];
}

export class MarketDetailDto extends MarketListItemDto {
  @ApiProperty({ description: 'Underlying asset and base token metadata.', type: MarketUnderlyingDto })
  underlying!: MarketUnderlyingDto;

  @ApiProperty({ description: 'NAV split used by market detail and future deposit flows.', type: MarketNavDto })
  nav!: MarketNavDto;

  @ApiProperty({ description: 'Price freshness information.', type: MarketPriceDto })
  price!: MarketPriceDto;

  @ApiProperty({ description: 'Live adaptor/market capability flags. FE should use these to enable or hide actions.', type: MarketCapabilitiesDto })
  capabilities!: MarketCapabilitiesDto;
}

class DataQualityDto {
  @ApiProperty({ description: 'Per-field data source labels such as live_contract, derived, config, or mock.', example: { nav: 'live_contract', limits: 'derived' } })
  sources!: Record<string, string>;
}

class SeniorDepositLimitDto {
  @ApiProperty({ description: 'Whether senior deposits have remaining capacity and market is not halted.', example: true })
  available!: boolean;

  @ApiProperty({ description: 'Raw senior deposit capacity using D_max = J * L_max - S.', example: '30000000000000000000000000' })
  capacity!: string;

  @ApiProperty({ description: 'Reason code when unavailable.', example: null, nullable: true })
  reason!: string | null;

  @ApiProperty({ description: 'Canonical capacity formula used by backend.', example: 'D_max = J * L_max - S' })
  formula!: string;
}

export class MarketDepositLimitsResponseDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Senior deposit limit and availability.', type: SeniorDepositLimitDto })
  senior!: SeniorDepositLimitDto;

  @ApiProperty({ description: 'Source labels for this response.', type: DataQualityDto })
  dataQuality!: DataQualityDto;
}

export class MarketPriceStatusResponseDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'ISO timestamp of latest price update.', example: '2026-04-30T00:00:00.000Z' })
  lastUpdatedAt!: string;

  @ApiProperty({ description: 'Whether price is stale under the MVP threshold.', example: false })
  stale!: boolean;

  @ApiProperty({ description: 'Staleness threshold in seconds.', example: 86400 })
  staleAfterSeconds!: number;

  @ApiProperty({ description: 'Machine-readable warning flags.', example: ['STALE_PRICE'], isArray: true, type: String })
  warnings!: string[];

  @ApiProperty({ description: 'Source labels for this response.', type: DataQualityDto })
  dataQuality!: DataQualityDto;
}

class TradeTokenDto {
  @ApiProperty({ description: 'Token symbol.', example: 'USDC' })
  symbol!: string;

  @ApiProperty({ description: 'Token address.', example: '0x00000000000000000000000000000000000000a0' })
  address!: string;

  @ApiProperty({ description: 'Token decimals.', example: 18 })
  decimals!: number;
}

class TradeTokensDto {
  @ApiProperty({ type: TradeTokenDto })
  base!: TradeTokenDto;

  @ApiProperty({ type: TradeTokenDto })
  senior!: TradeTokenDto;

  @ApiProperty({ type: TradeTokenDto })
  junior!: TradeTokenDto;
}

class TradeLimitsDto {
  @ApiProperty({ description: 'Raw senior deposit capacity.', example: '30000000000000000000000000' })
  seniorDepositCapacity!: string;

  @ApiProperty({ description: 'Raw junior withdrawal capacity where safely expressible.', example: '5000000000000000000000000' })
  juniorWithdrawalCapacity!: string;
}

export class MarketTradeConstraintsResponseDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Base, Senior, and Junior token metadata.', type: TradeTokensDto })
  tokens!: TradeTokensDto;

  @ApiProperty({ description: 'Market/adaptor capability flags.', type: MarketCapabilitiesDto })
  capabilities!: MarketCapabilitiesDto;

  @ApiProperty({ description: 'Derived trading constraints.', type: TradeLimitsDto })
  limits!: TradeLimitsDto;

  @ApiProperty({ description: 'Settlement labels from config.', example: { depositBaseInstant: 'Instant when adaptor liquidity is available' } })
  settlement!: Record<string, string>;

  @ApiProperty({ description: 'Warning flags such as MARKET_HALTED or STALE_PRICE.', example: [], isArray: true, type: String })
  warnings!: string[];

  @ApiProperty({ description: 'Source labels for this response.', type: DataQualityDto })
  dataQuality!: DataQualityDto;
}

class FactsheetRowDto {
  @ApiProperty({ example: 'Underlying' })
  label!: string;

  @ApiProperty({ example: 'mEDGE' })
  value!: string;

  @ApiProperty({ example: 'config' })
  source!: string;
}

export class MarketFactsheetResponseDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Factsheet title.', example: 'mEDGE Market Factsheet' })
  title!: string;

  @ApiProperty({ description: 'Config-backed factsheet rows.', type: FactsheetRowDto, isArray: true })
  rows!: FactsheetRowDto[];

  @ApiProperty({ description: 'Source labels for this response.', type: DataQualityDto })
  dataQuality!: DataQualityDto;
}

class ChartHeadlineDto {
  @ApiProperty({ example: 'Yield APY' })
  label!: string;

  @ApiProperty({ example: '8.40' })
  value!: string;

  @ApiProperty({ example: '%' })
  unit!: string;

  @ApiProperty({ example: 'mock' })
  source!: string;
}

class ChartPointDto {
  @ApiProperty({ example: '2026-04-30T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '8.40' })
  value!: string;

  @ApiProperty({ example: 'mock' })
  source!: string;
}

export class MarketChartResponseDto {
  @ApiProperty({ description: 'Market address.', example: '0x3aDa769dC813e3376fCD40d05bEA12263048A487' })
  market!: string;

  @ApiProperty({ description: 'Requested chart metric.', example: 'yield' })
  metric!: string;

  @ApiProperty({ description: 'Requested chart range.', example: '30d' })
  range!: string;

  @ApiProperty({ description: 'Metric-specific headline metadata.', type: ChartHeadlineDto })
  headline!: ChartHeadlineDto;

  @ApiProperty({ description: 'Deterministic MVP chart points.', type: ChartPointDto, isArray: true })
  series!: ChartPointDto[];

  @ApiProperty({ description: 'Source labels for this response.', type: DataQualityDto })
  dataQuality!: DataQualityDto;
}
