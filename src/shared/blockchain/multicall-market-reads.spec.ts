import type { Address } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import {
  fetchLiveMarketStateMulticall,
  fetchPortfolioBalanceReadsMulticall,
  fetchTokenMetadataMulticall,
  fetchTrancheSharePricesMulticall,
  MARKET_CORE_MULTICALL_SIZE,
  MARKET_METADATA_MULTICALL_SIZE,
  PORTFOLIO_BALANCE_MULTICALL_SIZE,
  TOKEN_METADATA_MULTICALL_SIZE,
  TRANCHE_ADDRESS_MULTICALL_SIZE,
  TRANCHE_SHARE_PRICE_MULTICALL_SIZE,
} from './multicall-market-reads';

const MARKET = '0x0000000000000000000000000000000000000001' as Address;
const YT = '0x0000000000000000000000000000000000000002' as Address;
const ST = '0x0000000000000000000000000000000000000003' as Address;
const JT = '0x0000000000000000000000000000000000000004' as Address;
const ADAPTOR = '0x0000000000000000000000000000000000000005' as Address;
const BASE = '0x00000000000000000000000000000000000000a0' as Address;
const WALLET = '0x00000000000000000000000000000000000000b0' as Address;
const SCALE = 10n ** 18n;

type MulticallCall = {
  contracts: Array<{
    address: Address;
    functionName: string;
    args?: readonly unknown[];
  }>;
  allowFailure: boolean;
};

type MulticallMock = ReturnType<typeof vi.fn>;

function multicallArgAt(multicall: MulticallMock, index: number): MulticallCall {
  const call = multicall.mock.calls[index]?.[0] as MulticallCall | undefined;
  expect(call).toBeDefined();
  return call as MulticallCall;
}

describe('multicall batch sizes', () => {
  it('documents expected market state RPC batch sizes', () => {
    expect(MARKET_CORE_MULTICALL_SIZE).toBe(12);
    expect(MARKET_METADATA_MULTICALL_SIZE).toBe(6);
    expect(MARKET_CORE_MULTICALL_SIZE + MARKET_METADATA_MULTICALL_SIZE).toBe(18);
    expect(2).toBeLessThan(18);
  });

  it('documents expected token and tranche batch sizes', () => {
    expect(TOKEN_METADATA_MULTICALL_SIZE).toBe(2);
    expect(TRANCHE_ADDRESS_MULTICALL_SIZE + TRANCHE_SHARE_PRICE_MULTICALL_SIZE).toBe(4);
    expect(PORTFOLIO_BALANCE_MULTICALL_SIZE).toBe(2);
  });
});

describe('multicall market read helpers', () => {
  it('maps live market state from core and metadata multicalls', async () => {
    const multicall = vi
      .fn()
      .mockResolvedValueOnce([
        YT,
        ST,
        JT,
        ADAPTOR,
        100n,
        60n,
        40n,
        1500000000000000000n,
        6000000000000000000n,
        1000000000000000000n,
        123n,
        false,
      ])
      .mockResolvedValueOnce(['stYT', 'jtYT', true, true, false, false]);

    const result = await fetchLiveMarketStateMulticall({ multicall } as never, MARKET, BASE);

    expect(result).toEqual({
      address: MARKET,
      ytTokenAddress: YT,
      baseTokenAddress: BASE,
      seniorTrancheAddress: ST,
      juniorTrancheAddress: JT,
      seniorSymbol: 'stYT',
      juniorSymbol: 'jtYT',
      nav: '100',
      navSt: '60',
      navJt: '40',
      currentStJtRatio: '1500000000000000000',
      maxStJtRatio: '6000000000000000000',
      latestYtPrice: '1000000000000000000',
      lastUpdatedTime: '123',
      halted: false,
      capabilities: {
        depositBaseInstant: true,
        depositBaseRequest: true,
        withdrawBaseAsync: false,
        withdrawBaseInstant: false,
      },
    });

    const coreCall = multicallArgAt(multicall, 0);
    expect(coreCall.allowFailure).toBe(false);
    expect(coreCall.contracts.map((contract) => contract.address)).toEqual(
      Array(MARKET_CORE_MULTICALL_SIZE).fill(MARKET),
    );
    expect(coreCall.contracts.map((contract) => contract.functionName)).toEqual([
      'yt',
      'st',
      'jt',
      'adaptor',
      'nav',
      'navSt',
      'navJt',
      'currentStJtRatio',
      'maxStJtRatio',
      'latestYtPrice',
      'lastUpdatedTime',
      'halted',
    ]);

    const metadataCall = multicallArgAt(multicall, 1);
    expect(metadataCall.allowFailure).toBe(false);
    expect(metadataCall.contracts.map((contract) => contract.address)).toEqual([
      ST,
      JT,
      ADAPTOR,
      ADAPTOR,
      ADAPTOR,
      ADAPTOR,
    ]);
    expect(metadataCall.contracts.map((contract) => contract.functionName)).toEqual([
      'symbol',
      'symbol',
      'isDepositInstantEnabled',
      'isDepositRequestEnabled',
      'isWithdrawRequestEnabled',
      'isWithdrawInstantEnabled',
    ]);
  });

  it('builds token metadata multicall with allowFailure disabled', async () => {
    const multicall = vi.fn().mockResolvedValueOnce(['USDC', 6]);

    const result = await fetchTokenMetadataMulticall({ multicall } as never, BASE);

    expect(result).toEqual({ address: BASE, symbol: 'USDC', decimals: 6 });
    const call = multicallArgAt(multicall, 0);
    expect(call.allowFailure).toBe(false);
    expect(call.contracts.map((contract) => contract.address)).toEqual([BASE, BASE]);
    expect(call.contracts.map((contract) => contract.functionName)).toEqual(['symbol', 'decimals']);
  });

  it('reads tranche share prices from tranche addresses', async () => {
    const multicall = vi
      .fn()
      .mockResolvedValueOnce([ST, JT])
      .mockResolvedValueOnce([1010000000000000000n, 970000000000000000n]);

    const result = await fetchTrancheSharePricesMulticall({ multicall } as never, MARKET);

    expect(result).toEqual({
      stSharePrice: '1010000000000000000',
      jtSharePrice: '970000000000000000',
    });

    const trancheCall = multicallArgAt(multicall, 0);
    expect(trancheCall.allowFailure).toBe(false);
    expect(trancheCall.contracts.map((contract) => contract.address)).toEqual([MARKET, MARKET]);
    expect(trancheCall.contracts.map((contract) => contract.functionName)).toEqual(['st', 'jt']);

    const priceCall = multicallArgAt(multicall, 1);
    expect(priceCall.allowFailure).toBe(false);
    expect(priceCall.contracts.map((contract) => contract.address)).toEqual([ST, JT]);
    expect(priceCall.contracts.map((contract) => contract.functionName)).toEqual([
      'convertToAssets',
      'convertToAssets',
    ]);
    expect(priceCall.contracts.map((contract) => contract.args)).toEqual([[SCALE], [SCALE]]);
  });

  it('reads portfolio balances and converts only non-zero share balances', async () => {
    const multicall = vi.fn().mockResolvedValueOnce([2n, 0n]).mockResolvedValueOnce([20n]);

    const result = await fetchPortfolioBalanceReadsMulticall({ multicall } as never, ST, JT, WALLET);

    expect(result).toEqual({
      seniorShares: 2n,
      juniorShares: 0n,
      seniorAssets: 20n,
      juniorAssets: 0n,
    });

    const balanceCall = multicallArgAt(multicall, 0);
    expect(balanceCall.allowFailure).toBe(false);
    expect(balanceCall.contracts.map((contract) => contract.address)).toEqual([ST, JT]);
    expect(balanceCall.contracts.map((contract) => contract.functionName)).toEqual([
      'balanceOf',
      'balanceOf',
    ]);
    expect(balanceCall.contracts.map((contract) => contract.args)).toEqual([[WALLET], [WALLET]]);

    const convertCall = multicallArgAt(multicall, 1);
    expect(convertCall.allowFailure).toBe(false);
    expect(convertCall.contracts.map((contract) => contract.address)).toEqual([ST]);
    expect(convertCall.contracts.map((contract) => contract.functionName)).toEqual(['convertToAssets']);
    expect(convertCall.contracts.map((contract) => contract.args)).toEqual([[2n]]);
  });
});
