import { Injectable, Logger } from '@nestjs/common';
import type { Address } from 'viem';
import { ViemClientService } from './viem-client.service';
import {
  MARKET_ABI,
  MIDAS_ADAPTOR_ABI,
  ST_TRANCHE_ABI,
  JT_TRANCHE_ABI,
  MOCK_USDC_ADDRESS,
} from './contracts';

export interface LiveMarketCapabilities {
  depositBaseInstant: boolean;
  depositBaseRequest: boolean;
  withdrawBaseAsync: boolean;
  withdrawBaseInstant: boolean;
}

export interface LiveMarketState {
  address: string;
  ytTokenAddress: string;
  baseTokenAddress: string;
  seniorTrancheAddress: string;
  juniorTrancheAddress: string;
  seniorSymbol: string;
  juniorSymbol: string;
  nav: string;
  navSt: string;
  navJt: string;
  currentStJtRatio: string;
  maxStJtRatio: string;
  latestYtPrice: string;
  lastUpdatedTime: string;
  halted: boolean;
  capabilities: LiveMarketCapabilities;
}

export interface LivePortfolioPosition {
  marketAddress: string;
  marketSymbol: string;
  assetType: 'senior' | 'junior';
  assetSymbol: string;
  tokenAddress: string;
  shares: string;
  assets: string;
  value: string;
}

export interface SimulateDepositBaseInstantInput {
  market: string;
  asSenior: boolean;
  tokenIn: string;
  amountIn: string;
  minYtOut: string;
  receiver: string;
  referrerId: string;
  sender: string;
  trancheToken: string;
}

export type SimulateDepositBaseInstantResult =
  | { ok: true; ytOut: string; sharesOut: string }
  | { ok: false; reason: string; errorName: string | null };

const SCALE = 10n ** 18n;

function toStringValue(value: bigint | number | string | boolean): string {
  return value.toString();
}

function toAddress(value: unknown): Address {
  return value as Address;
}

function computeValue(assets: bigint, latestYtPrice: bigint): string {
  return ((assets * latestYtPrice) / SCALE).toString();
}

function mapSimulationRevertReason(error: unknown): { reason: string; errorName: string | null } {
  const candidate = error as {
    shortMessage?: string;
    details?: string;
    message?: string;
    data?: { errorName?: string };
    cause?: { data?: { errorName?: string }; raw?: string; signature?: string };
  };
  const errorName = candidate.data?.errorName ?? candidate.cause?.data?.errorName ?? null;
  const message = `${candidate.shortMessage ?? ''} ${candidate.details ?? ''} ${candidate.message ?? ''}`;
  const rawRevert = `${candidate.cause?.signature ?? ''} ${candidate.cause?.raw ?? ''}`;

  if (errorName === 'MarketHalted' || message.includes('halted')) {
    return { reason: 'MARKET_HALTED', errorName };
  }

  if (errorName === 'StJtRatioTooHigh' || message.includes('StJtRatioTooHigh')) {
    return { reason: 'SENIOR_CAPACITY_EXCEEDED', errorName };
  }

  if (
    message.includes('allowance') ||
    message.includes('balance') ||
    message.includes('transfer amount exceeds') ||
    rawRevert.includes('0xfb8f41b2') ||
    rawRevert.includes('0xe450d38c')
  ) {
    return { reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE', errorName };
  }

  if (errorName === 'RequestMinYtOutNotMet' || message.includes('minReceive') || message.includes('minYtOut')) {
    return { reason: 'MIN_YT_OUT_NOT_MET', errorName };
  }

  return { reason: 'SIMULATION_REVERTED', errorName };
}

@Injectable()
export class ContractReaderService {
  private readonly logger = new Logger(ContractReaderService.name);

  constructor(private readonly viem: ViemClientService) {}

  async getMarketState(): Promise<LiveMarketState> {
    const client = this.viem.getPublicClient();
    const marketAddress = this.viem.getMarketAddress();

    const [
      ytTokenAddress,
      seniorTrancheAddress,
      juniorTrancheAddress,
      adaptorAddress,
      nav,
      navSt,
      navJt,
      currentStJtRatio,
      maxStJtRatio,
      latestYtPrice,
      lastUpdatedTime,
      halted,
    ] = await Promise.all([
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'yt' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'st' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'jt' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'adaptor' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'nav' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'navSt' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'navJt' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'currentStJtRatio' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'maxStJtRatio' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'latestYtPrice' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'lastUpdatedTime' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'halted' }),
    ]);

    const stAddress = toAddress(seniorTrancheAddress);
    const jtAddress = toAddress(juniorTrancheAddress);
    const adaptor = toAddress(adaptorAddress);

    const [seniorSymbol, juniorSymbol, depositBaseInstant, depositBaseRequest, withdrawBaseAsync, withdrawBaseInstant] =
      await Promise.all([
        client.readContract({ address: stAddress, abi: ST_TRANCHE_ABI, functionName: 'symbol' }),
        client.readContract({ address: jtAddress, abi: JT_TRANCHE_ABI, functionName: 'symbol' }),
        client.readContract({ address: adaptor, abi: MIDAS_ADAPTOR_ABI, functionName: 'isDepositInstantEnabled' }),
        client.readContract({ address: adaptor, abi: MIDAS_ADAPTOR_ABI, functionName: 'isDepositRequestEnabled' }),
        client.readContract({ address: adaptor, abi: MIDAS_ADAPTOR_ABI, functionName: 'isWithdrawRequestEnabled' }),
        client.readContract({ address: adaptor, abi: MIDAS_ADAPTOR_ABI, functionName: 'isWithdrawInstantEnabled' }),
      ]);

    return {
      address: marketAddress,
      ytTokenAddress: toStringValue(ytTokenAddress),
      baseTokenAddress: MOCK_USDC_ADDRESS,
      seniorTrancheAddress: stAddress,
      juniorTrancheAddress: jtAddress,
      seniorSymbol: toStringValue(seniorSymbol),
      juniorSymbol: toStringValue(juniorSymbol),
      nav: toStringValue(nav),
      navSt: toStringValue(navSt),
      navJt: toStringValue(navJt),
      currentStJtRatio: toStringValue(currentStJtRatio),
      maxStJtRatio: toStringValue(maxStJtRatio),
      latestYtPrice: toStringValue(latestYtPrice),
      lastUpdatedTime: toStringValue(lastUpdatedTime),
      halted,
      capabilities: {
        depositBaseInstant,
        depositBaseRequest,
        withdrawBaseAsync,
        withdrawBaseInstant,
      },
    };
  }

  async simulateDepositBaseInstant(input: SimulateDepositBaseInstantInput): Promise<SimulateDepositBaseInstantResult> {
    const client = this.viem.getPublicClient();

    try {
      const { result } = await client.simulateContract({
        address: input.market as Address,
        abi: MARKET_ABI,
        functionName: 'depositInstant',
        args: [
          input.asSenior,
          input.tokenIn as Address,
          BigInt(input.amountIn),
          BigInt(input.minYtOut),
          input.receiver as Address,
          input.referrerId as `0x${string}`,
        ],
        account: input.sender as Address,
      });
      const ytOut = result.toString();
      const shares = await client.readContract({
        address: input.trancheToken as Address,
        abi: input.asSenior ? ST_TRANCHE_ABI : JT_TRANCHE_ABI,
        functionName: 'previewDeposit',
        args: [BigInt(ytOut)],
      });

      return { ok: true, ytOut, sharesOut: shares.toString() };
    } catch (error) {
      const mapped = mapSimulationRevertReason(error);
      const candidate = error as {
        shortMessage?: string;
        details?: string;
        message?: string;
        data?: unknown;
        cause?: unknown;
      };

      this.logger.warn({
        message: 'deposit base simulation reverted',
        reason: mapped.reason,
        errorName: mapped.errorName,
        shortMessage: candidate.shortMessage,
        details: candidate.details,
        errorMessage: candidate.message,
        data: candidate.data,
        cause: candidate.cause,
      });

      return { ok: false, ...mapped };
    }
  }

  async getPortfolioPositions(walletAddress: string): Promise<LivePortfolioPosition[]> {
    const client = this.viem.getPublicClient();
    const market = await this.getMarketState();
    const wallet = walletAddress as Address;
    const stAddress = market.seniorTrancheAddress as Address;
    const jtAddress = market.juniorTrancheAddress as Address;

    const [seniorShares, juniorShares] = await Promise.all([
      client.readContract({ address: stAddress, abi: ST_TRANCHE_ABI, functionName: 'balanceOf', args: [wallet] }),
      client.readContract({ address: jtAddress, abi: JT_TRANCHE_ABI, functionName: 'balanceOf', args: [wallet] }),
    ]);

    const seniorShareBalance = BigInt(seniorShares.toString());
    const juniorShareBalance = BigInt(juniorShares.toString());
    const latestYtPrice = BigInt(market.latestYtPrice);

    const [seniorAssets, juniorAssets] = await Promise.all([
      seniorShareBalance > 0n
        ? client.readContract({
            address: stAddress,
            abi: ST_TRANCHE_ABI,
            functionName: 'convertToAssets',
            args: [seniorShareBalance],
          })
        : Promise.resolve(0n),
      juniorShareBalance > 0n
        ? client.readContract({
            address: jtAddress,
            abi: JT_TRANCHE_ABI,
            functionName: 'convertToAssets',
            args: [juniorShareBalance],
          })
        : Promise.resolve(0n),
    ]);

    const positions: LivePortfolioPosition[] = [];
    const seniorAssetBalance = BigInt(seniorAssets.toString());
    const juniorAssetBalance = BigInt(juniorAssets.toString());

    if (seniorShareBalance > 0n) {
      positions.push({
        marketAddress: market.address,
        marketSymbol: market.seniorSymbol.replace(/^st-/, '') || 'mEDGE',
        assetType: 'senior',
        assetSymbol: market.seniorSymbol,
        tokenAddress: market.seniorTrancheAddress,
        shares: seniorShareBalance.toString(),
        assets: seniorAssetBalance.toString(),
        value: computeValue(seniorAssetBalance, latestYtPrice),
      });
    }

    if (juniorShareBalance > 0n) {
      positions.push({
        marketAddress: market.address,
        marketSymbol: market.juniorSymbol.replace(/^jt-/, '') || 'mEDGE',
        assetType: 'junior',
        assetSymbol: market.juniorSymbol,
        tokenAddress: market.juniorTrancheAddress,
        shares: juniorShareBalance.toString(),
        assets: juniorAssetBalance.toString(),
        value: computeValue(juniorAssetBalance, latestYtPrice),
      });
    }

    return positions;
  }
}
