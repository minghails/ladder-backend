import type { Address, PublicClient } from 'viem';
import {
  ERC20_METADATA_ABI,
  MARKET_ABI,
  MIDAS_ADAPTOR_ABI,
  ST_TRANCHE_ABI,
  JT_TRANCHE_ABI,
} from './contracts';
import type { LiveMarketCapabilities, LiveMarketState, TokenMetadata, TrancheSharePrices } from './contract-reader.service';

export const MARKET_CORE_MULTICALL_SIZE = 12;
export const MARKET_METADATA_MULTICALL_SIZE = 6;
export const TOKEN_METADATA_MULTICALL_SIZE = 2;
export const TRANCHE_ADDRESS_MULTICALL_SIZE = 2;
export const TRANCHE_SHARE_PRICE_MULTICALL_SIZE = 2;
export const PORTFOLIO_BALANCE_MULTICALL_SIZE = 2;

const SCALE = 10n ** 18n;

export type MulticallClient = Pick<PublicClient, 'multicall'>;

export type PortfolioBalanceReads = {
  seniorShares: bigint;
  juniorShares: bigint;
  seniorAssets: bigint;
  juniorAssets: bigint;
};

function toStringValue(value: bigint | number | string | boolean): string {
  return value.toString();
}

function toAddress(value: unknown): Address {
  return value as Address;
}

function buildMarketCoreContracts(marketAddress: Address) {
  return [
    { address: marketAddress, abi: MARKET_ABI, functionName: 'yt' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'st' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'jt' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'adaptor' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'nav' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'navSt' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'navJt' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'currentStJtRatio' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'maxStJtRatio' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'latestYtPrice' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'lastUpdatedTime' as const },
    { address: marketAddress, abi: MARKET_ABI, functionName: 'halted' as const },
  ];
}

function buildMarketMetadataContracts(
  stAddress: Address,
  jtAddress: Address,
  adaptorAddress: Address,
) {
  return [
    { address: stAddress, abi: ST_TRANCHE_ABI, functionName: 'symbol' as const },
    { address: jtAddress, abi: JT_TRANCHE_ABI, functionName: 'symbol' as const },
    { address: adaptorAddress, abi: MIDAS_ADAPTOR_ABI, functionName: 'isDepositInstantEnabled' as const },
    { address: adaptorAddress, abi: MIDAS_ADAPTOR_ABI, functionName: 'isDepositRequestEnabled' as const },
    { address: adaptorAddress, abi: MIDAS_ADAPTOR_ABI, functionName: 'isWithdrawRequestEnabled' as const },
    { address: adaptorAddress, abi: MIDAS_ADAPTOR_ABI, functionName: 'isWithdrawInstantEnabled' as const },
  ];
}

export async function fetchLiveMarketStateMulticall(
  client: MulticallClient,
  marketAddress: Address,
  baseTokenAddress: Address,
): Promise<LiveMarketState> {
  const core = (await client.multicall({
    contracts: buildMarketCoreContracts(marketAddress),
    allowFailure: false,
  })) as [
    Address,
    Address,
    Address,
    Address,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean,
  ];

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
  ] = core;

  const stAddress = toAddress(seniorTrancheAddress);
  const jtAddress = toAddress(juniorTrancheAddress);
  const adaptor = toAddress(adaptorAddress);

  const metadata = (await client.multicall({
    contracts: buildMarketMetadataContracts(stAddress, jtAddress, adaptor),
    allowFailure: false,
  })) as [string, string, boolean, boolean, boolean, boolean];

  const [
    seniorSymbol,
    juniorSymbol,
    depositBaseInstant,
    depositBaseRequest,
    withdrawBaseAsync,
    withdrawBaseInstant,
  ] = metadata;

  const capabilities: LiveMarketCapabilities = {
    depositBaseInstant,
    depositBaseRequest,
    withdrawBaseAsync,
    withdrawBaseInstant,
  };

  return {
    address: marketAddress,
    ytTokenAddress: toStringValue(ytTokenAddress),
    baseTokenAddress,
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
    capabilities,
  };
}

export async function fetchTokenMetadataMulticall(
  client: MulticallClient,
  address: string,
): Promise<TokenMetadata> {
  const tokenAddress = address as Address;
  const [symbol, decimals] = (await client.multicall({
    contracts: [
      { address: tokenAddress, abi: ERC20_METADATA_ABI, functionName: 'symbol' as const },
      { address: tokenAddress, abi: ERC20_METADATA_ABI, functionName: 'decimals' as const },
    ],
    allowFailure: false,
  }));

  return {
    address,
    symbol: toStringValue(symbol),
    decimals,
  };
}

export async function fetchTrancheSharePricesMulticall(
  client: MulticallClient,
  marketAddress: Address,
): Promise<TrancheSharePrices> {
  const [seniorTrancheAddress, juniorTrancheAddress] = (await client.multicall({
    contracts: [
      { address: marketAddress, abi: MARKET_ABI, functionName: 'st' as const },
      { address: marketAddress, abi: MARKET_ABI, functionName: 'jt' as const },
    ],
    allowFailure: false,
  }));

  const stAddress = toAddress(seniorTrancheAddress);
  const jtAddress = toAddress(juniorTrancheAddress);

  const [stSharePrice, jtSharePrice] = (await client.multicall({
    contracts: [
      {
        address: stAddress,
        abi: ST_TRANCHE_ABI,
        functionName: 'convertToAssets' as const,
        args: [SCALE] as const,
      },
      {
        address: jtAddress,
        abi: JT_TRANCHE_ABI,
        functionName: 'convertToAssets' as const,
        args: [SCALE] as const,
      },
    ],
    allowFailure: false,
  }));

  return {
    stSharePrice: toStringValue(stSharePrice),
    jtSharePrice: toStringValue(jtSharePrice),
  };
}

export async function fetchPortfolioBalanceReadsMulticall(
  client: MulticallClient,
  stAddress: Address,
  jtAddress: Address,
  wallet: Address,
): Promise<PortfolioBalanceReads> {
  const [seniorShares, juniorShares] = (await client.multicall({
    contracts: [
      { address: stAddress, abi: ST_TRANCHE_ABI, functionName: 'balanceOf' as const, args: [wallet] as const },
      { address: jtAddress, abi: JT_TRANCHE_ABI, functionName: 'balanceOf' as const, args: [wallet] as const },
    ],
    allowFailure: false,
  }));

  const seniorShareBalance = BigInt(seniorShares.toString());
  const juniorShareBalance = BigInt(juniorShares.toString());

  const convertContracts: Array<{
    address: Address;
    abi: typeof ST_TRANCHE_ABI | typeof JT_TRANCHE_ABI;
    functionName: 'convertToAssets';
    args: readonly [bigint];
  }> = [];

  if (seniorShareBalance > 0n) {
    convertContracts.push({
      address: stAddress,
      abi: ST_TRANCHE_ABI,
      functionName: 'convertToAssets',
      args: [seniorShareBalance],
    });
  }

  if (juniorShareBalance > 0n) {
    convertContracts.push({
      address: jtAddress,
      abi: JT_TRANCHE_ABI,
      functionName: 'convertToAssets',
      args: [juniorShareBalance],
    });
  }

  let seniorAssets = 0n;
  let juniorAssets = 0n;

  if (convertContracts.length > 0) {
    const assets = (await client.multicall({
      contracts: convertContracts,
      allowFailure: false,
    })) as bigint[];

    let index = 0;
    if (seniorShareBalance > 0n) {
      const seniorAssetValue = assets[index];
      if (seniorAssetValue !== undefined) {
        seniorAssets = BigInt(seniorAssetValue.toString());
      }
      index += 1;
    }
    if (juniorShareBalance > 0n) {
      const juniorAssetValue = assets[index];
      if (juniorAssetValue !== undefined) {
        juniorAssets = BigInt(juniorAssetValue.toString());
      }
    }
  }

  return {
    seniorShares: seniorShareBalance,
    juniorShares: juniorShareBalance,
    seniorAssets,
    juniorAssets,
  };
}
