import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Address } from 'viem';
import { DEFAULT_RPC_READ_CACHE_TTL_MS, RpcReadCache } from './rpc-read-cache';
import { marketDisplaySymbol } from './token-display.config';
import { ViemClientService } from './viem-client.service';
import {
  ERC20_METADATA_ABI,
  MARKET_ABI,
  MIDAS_ADAPTOR_ABI,
  ST_TRANCHE_ABI,
  JT_TRANCHE_ABI,
} from './contracts';

export interface TrancheSharePrices {
  stSharePrice: string;
  jtSharePrice: string;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  decimals: number;
}

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

export interface PreviewDepositInput {
  trancheToken: string;
  tranche: 'senior' | 'junior';
  amountYt: string;
}

export interface PreviewRedeemInput {
  trancheToken: string;
  tranche: 'senior' | 'junior';
  shares: string;
}

export interface PreviewWithdrawInput {
  trancheToken: string;
  tranche: 'senior' | 'junior';
  amountYt: string;
}

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

function trancheAbi(tranche: 'senior' | 'junior') {
  return tranche === 'senior' ? ST_TRANCHE_ABI : JT_TRANCHE_ABI;
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
  private readonly marketStateCache: RpcReadCache<LiveMarketState>;
  private readonly tokenMetadataCache: RpcReadCache<TokenMetadata>;

  constructor(
    private readonly viem: ViemClientService,
    @Optional() config?: ConfigService,
  ) {
    const ttlMs =
      config?.get<number>('blockchain.readCacheTtlMs') ??
      DEFAULT_RPC_READ_CACHE_TTL_MS;
    this.marketStateCache = new RpcReadCache(ttlMs);
    this.tokenMetadataCache = new RpcReadCache(ttlMs);
  }

  async getTokenMetadata(address: string): Promise<TokenMetadata> {
    const key = `token:${address.toLowerCase()}`;
    const cached = this.tokenMetadataCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await this.fetchTokenMetadata(address);
    this.tokenMetadataCache.set(key, result);
    return result;
  }

  private async fetchTokenMetadata(address: string): Promise<TokenMetadata> {
    const client = this.viem.getPublicClient();
    const tokenAddress = address as Address;
    const [symbol, decimals] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: ERC20_METADATA_ABI, functionName: 'symbol' }),
      client.readContract({ address: tokenAddress, abi: ERC20_METADATA_ABI, functionName: 'decimals' }),
    ]);

    return {
      address,
      symbol: toStringValue(symbol),
      decimals,
    };
  }

  async getMarketState(): Promise<LiveMarketState> {
    const key = `market:${this.viem.getMarketAddress()}`;
    const cached = this.marketStateCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await this.fetchMarketState();
    this.marketStateCache.set(key, result);
    return result;
  }

  private async fetchMarketState(): Promise<LiveMarketState> {
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
      baseTokenAddress: this.viem.getBaseTokenAddress(),
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

  async getMarketTrancheSharePrices(): Promise<TrancheSharePrices> {
    const client = this.viem.getPublicClient();
    const marketAddress = this.viem.getMarketAddress();
    const [seniorTrancheAddress, juniorTrancheAddress] = await Promise.all([
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'st' }),
      client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: 'jt' }),
    ]);
    const [stSharePrice, jtSharePrice] = await Promise.all([
      client.readContract({ address: toAddress(seniorTrancheAddress), abi: ST_TRANCHE_ABI, functionName: 'convertToAssets', args: [SCALE] }),
      client.readContract({ address: toAddress(juniorTrancheAddress), abi: JT_TRANCHE_ABI, functionName: 'convertToAssets', args: [SCALE] }),
    ]);

    return {
      stSharePrice: toStringValue(stSharePrice),
      jtSharePrice: toStringValue(jtSharePrice),
    };
  }

  async getMarketMaxStJtRatioAtBlock(blockNumber: string): Promise<string> {
    const client = this.viem.getPublicClient();
    const marketAddress = this.viem.getMarketAddress();
    const maxStJtRatio = await client.readContract({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: 'maxStJtRatio',
      blockNumber: BigInt(blockNumber),
    });

    return toStringValue(maxStJtRatio);
  }

  async previewDeposit(input: PreviewDepositInput): Promise<string> {
    const client = this.viem.getPublicClient();
    const shares = await client.readContract({
      address: input.trancheToken as Address,
      abi: trancheAbi(input.tranche),
      functionName: 'previewDeposit',
      args: [BigInt(input.amountYt)],
    });

    return shares.toString();
  }

  async previewRedeem(input: PreviewRedeemInput): Promise<string> {
    const client = this.viem.getPublicClient();
    const assets = await client.readContract({
      address: input.trancheToken as Address,
      abi: trancheAbi(input.tranche),
      functionName: 'previewRedeem',
      args: [BigInt(input.shares)],
    });

    return assets.toString();
  }

  async previewWithdraw(input: PreviewWithdrawInput): Promise<string> {
    const client = this.viem.getPublicClient();
    const shares = await client.readContract({
      address: input.trancheToken as Address,
      abi: trancheAbi(input.tranche),
      functionName: 'previewWithdraw',
      args: [BigInt(input.amountYt)],
    });

    return shares.toString();
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

  async getPortfolioPositions(
    walletAddress: string,
    preloadedMarket?: LiveMarketState,
  ): Promise<LivePortfolioPosition[]> {
    const client = this.viem.getPublicClient();
    const market = preloadedMarket ?? (await this.getMarketState());
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

    const portfolioMarketSymbol = marketDisplaySymbol(market);

    if (seniorShareBalance > 0n) {
      positions.push({
        marketAddress: market.address,
        marketSymbol: portfolioMarketSymbol,
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
        marketSymbol: portfolioMarketSymbol,
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
