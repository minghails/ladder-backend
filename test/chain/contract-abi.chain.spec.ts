import { describe, expect, it } from 'vitest';
import { createPublicClient, decodeEventLog, encodeAbiParameters, encodeEventTopics, http, isAddress, type Address } from 'viem';
import { ContractReaderService } from '../../src/shared/blockchain/contract-reader.service';
import {
  BASE_SEPOLIA_ADDRESSES,
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CONTRACTS,
  MARKET_ABI,
} from '../../src/shared/blockchain/contracts';
import { ViemClientService } from '../../src/shared/blockchain/viem-client.service';

function chainRpcUrl(): string {
  return process.env['CHAIN_RPC_URL'] ?? process.env['BASE_SEPOLIA_RPC_URL'] ?? process.env['BLOCKCHAIN_RPC_URL'] ?? 'https://sepolia.base.org';
}

function contractReader(rpcUrl: string): ContractReaderService {
  const publicClient = createPublicClient({ transport: http(rpcUrl) });
  const viem = {
    getPublicClient: () => publicClient,
    getMarketAddress: () => BASE_SEPOLIA_ADDRESSES.market as Address,
    getChainId: () => BASE_SEPOLIA_CHAIN_ID,
  } satisfies Pick<ViemClientService, 'getPublicClient' | 'getMarketAddress' | 'getChainId'>;

  return new ContractReaderService(viem as ViemClientService);
}

describe('Base Sepolia ABI chain smoke', () => {
  it('keeps deployed contract registry addresses valid for the configured chain', () => {
    expect(BASE_SEPOLIA_CHAIN_ID).toBe(84532);

    for (const contract of Object.values(BASE_SEPOLIA_CONTRACTS)) {
      expect(isAddress(contract.address)).toBe(true);
      expect(contract.abi.length).toBeGreaterThan(0);
    }
  });

  it('reads deployed or forked market state through operator ABIs', async () => {
    const reader = contractReader(chainRpcUrl());

    const [market, baseToken, sharePrices] = await Promise.all([
      reader.getMarketState(),
      reader.getTokenMetadata(BASE_SEPOLIA_ADDRESSES.mockUSDC),
      reader.getMarketTrancheSharePrices(),
    ]);

    expect(market.address).toBe(BASE_SEPOLIA_ADDRESSES.market);
    expect(market.ytTokenAddress).toBe(BASE_SEPOLIA_ADDRESSES.mockMToken);
    expect(market.seniorTrancheAddress).toBe(BASE_SEPOLIA_ADDRESSES.stTranche);
    expect(market.juniorTrancheAddress).toBe(BASE_SEPOLIA_ADDRESSES.jtTranche);
    expect(market.seniorSymbol.length).toBeGreaterThan(0);
    expect(market.juniorSymbol.length).toBeGreaterThan(0);
    expect(BigInt(market.maxStJtRatio)).toBeGreaterThan(0n);
    expect(BigInt(market.latestYtPrice)).toBeGreaterThan(0n);
    expect(typeof market.capabilities.depositBaseInstant).toBe('boolean');
    expect(typeof market.capabilities.depositBaseRequest).toBe('boolean');
    expect(baseToken.symbol.length).toBeGreaterThan(0);
    expect(baseToken.decimals).toBeGreaterThan(0);
    expect(BigInt(sharePrices.stSharePrice)).toBeGreaterThan(0n);
    expect(BigInt(sharePrices.jtSharePrice)).toBeGreaterThan(0n);
  });

  it('decodes the deployed Market DepositYT event shape used by projector and portfolio activity reads', () => {
    const user = '0xabcdef0000000000000000000000000000000001';
    const topics = encodeEventTopics({
      abi: MARKET_ABI,
      eventName: 'DepositYT',
      args: {
        user,
        asSenior: false,
      },
    });
    const data = encodeAbiParameters(
      [
        { type: 'uint256', name: 'assets' },
        { type: 'uint256', name: 'shares' },
        { type: 'uint256', name: 'depositValue' },
        { type: 'uint256', name: 'navAfter' },
        { type: 'uint256', name: 'navStAfter' },
        { type: 'uint256', name: 'navJtAfter' },
        { type: 'uint256', name: 'jtStRatioAfter' },
      ],
      [100n, 95n, 90n, 1_000n, 700n, 300n, 2_333_333_333_333_333_333n],
    );

    const decoded = decodeEventLog({
      abi: MARKET_ABI,
      eventName: 'DepositYT',
      topics,
      data,
    });

    expect(decoded.args).toMatchObject({
      asSenior: false,
      assets: 100n,
      shares: 95n,
      depositValue: 90n,
      navAfter: 1_000n,
      navStAfter: 700n,
      navJtAfter: 300n,
      jtStRatioAfter: 2_333_333_333_333_333_333n,
    });
    expect(decoded.args.user.toLowerCase()).toBe(user);
    expect(BASE_SEPOLIA_ADDRESSES.market).toBe(BASE_SEPOLIA_CONTRACTS.market.address);
  });
});
