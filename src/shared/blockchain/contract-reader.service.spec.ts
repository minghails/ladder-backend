import { Logger } from '@nestjs/common';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ContractReaderService } from './contract-reader.service';

const INPUT = {
  market: '0x0000000000000000000000000000000000000001',
  asSenior: false,
  tokenIn: '0x0000000000000000000000000000000000000002',
  amountIn: '1000000',
  minYtOut: '0',
  receiver: '0x0000000000000000000000000000000000000003',
  referrerId: '0x0000000000000000000000000000000000000000000000000000000000000000',
  sender: '0x0000000000000000000000000000000000000004',
  trancheToken: '0x0000000000000000000000000000000000000005',
};

const SCALE = 10n ** 18n;

function marketCoreMulticallResults() {
  return [
    '0x0000000000000000000000000000000000000002',
    '0x0000000000000000000000000000000000000003',
    '0x0000000000000000000000000000000000000004',
    '0x0000000000000000000000000000000000000005',
    100n,
    60n,
    40n,
    1500000000000000000n,
    6000000000000000000n,
    1000000000000000000n,
    123n,
    false,
  ];
}

function marketMetadataMulticallResults(
  overrides: Partial<{
    seniorSymbol: string;
    juniorSymbol: string;
    depositBaseInstant: boolean;
    depositBaseRequest: boolean;
    withdrawBaseAsync: boolean;
    withdrawBaseInstant: boolean;
  }> = {},
) {
  return [
    overrides.seniorSymbol ?? 'stYT',
    overrides.juniorSymbol ?? 'jtYT',
    overrides.depositBaseInstant ?? true,
    overrides.depositBaseRequest ?? true,
    overrides.withdrawBaseAsync ?? false,
    overrides.withdrawBaseInstant ?? false,
  ];
}

function createMulticallMock(
  options: {
    onMulticall?: (contracts: Array<{ functionName?: string; args?: readonly unknown[] }>) => unknown[];
  } = {},
) {
  const multicall = vi.fn(
    ({ contracts }: { contracts: Array<{ functionName?: string; args?: readonly unknown[] }> }) => {
      if (options.onMulticall) {
        return Promise.resolve(options.onMulticall(contracts));
      }

      const size = contracts.length;
      const first = contracts[0];

      if (size === 12) {
        return Promise.resolve(marketCoreMulticallResults());
      }
      if (size === 6) {
        return Promise.resolve(marketMetadataMulticallResults());
      }
      if (size === 2 && first?.functionName === 'symbol') {
        return Promise.resolve(['USDC', 6]);
      }
      if (size === 2 && first?.functionName === 'st') {
        return Promise.resolve([
          '0x0000000000000000000000000000000000000005',
          '0x0000000000000000000000000000000000000006',
        ]);
      }
      if (size === 2 && first?.functionName === 'convertToAssets' && first.args?.[0] === SCALE) {
        return Promise.resolve([1010000000000000000n, 970000000000000000n]);
      }
      if (size === 2 && first?.functionName === 'balanceOf') {
        return Promise.resolve([2n, 3n]);
      }
      if (size === 2 && first?.functionName === 'convertToAssets') {
        return Promise.resolve([2n, 3n]);
      }
      if (size === 1 && first?.functionName === 'convertToAssets') {
        return Promise.resolve([2n]);
      }

      throw new Error(
        `Unexpected multicall batch size ${String(size)} for ${first?.functionName ?? 'unknown'}`,
      );
    },
  );

  return {
    multicall,
    readContract: vi.fn(),
  };
}

describe('ContractReaderService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reads ERC20 token symbol and decimals via multicall', async () => {
    const client = createMulticallMock();
    const service = new ContractReaderService({
      getPublicClient: () => client,
    } as never);

    const metadata = await service.getTokenMetadata('0x0000000000000000000000000000000000000002');

    expect(metadata).toEqual({
      address: '0x0000000000000000000000000000000000000002',
      symbol: 'USDC',
      decimals: 6,
    });
    expect(client.multicall).toHaveBeenCalledTimes(1);
    expect(client.readContract).not.toHaveBeenCalled();
  });

  it('caches getTokenMetadata within TTL', async () => {
    const client = createMulticallMock();
    const service = new ContractReaderService({
      getPublicClient: () => client,
    } as never);

    await service.getTokenMetadata('0x0000000000000000000000000000000000000002');
    await service.getTokenMetadata('0x0000000000000000000000000000000000000002');

    expect(client.multicall).toHaveBeenCalledTimes(1);
  });

  it('does not cache getTokenMetadata when read fails', async () => {
    const multicall = vi.fn().mockRejectedValue(new Error('rpc down'));
    const service = new ContractReaderService({
      getPublicClient: () => ({ multicall, readContract: vi.fn() }),
    } as never);

    await expect(
      service.getTokenMetadata('0x0000000000000000000000000000000000000002'),
    ).rejects.toThrow('rpc down');
    await expect(
      service.getTokenMetadata('0x0000000000000000000000000000000000000002'),
    ).rejects.toThrow('rpc down');

    expect(multicall).toHaveBeenCalledTimes(2);
  });

  it('fetches market state with two multicall batches instead of 18 readContract calls', async () => {
    const client = createMulticallMock();
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => client,
    } as never);

    await service.getMarketState();

    expect(client.multicall).toHaveBeenCalledTimes(2);
    expect(client.readContract).not.toHaveBeenCalled();
  });

  it('caches getMarketState within TTL', async () => {
    const client = createMulticallMock();
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => client,
    } as never);

    await service.getMarketState();
    await service.getMarketState();

    expect(client.multicall).toHaveBeenCalledTimes(2);
  });

  it('normalizes getMarketState cache keys by market address casing', async () => {
    const client = createMulticallMock();
    const getMarketAddress = vi
      .fn()
      .mockReturnValueOnce('0x00000000000000000000000000000000000000A1')
      .mockReturnValueOnce('0x00000000000000000000000000000000000000A1')
      .mockReturnValue('0x00000000000000000000000000000000000000a1');
    const service = new ContractReaderService({
      getMarketAddress,
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => client,
    } as never);

    await service.getMarketState();
    await service.getMarketState();

    expect(client.multicall).toHaveBeenCalledTimes(2);
  });

  it('does not cache getMarketState when read fails', async () => {
    const multicall = vi.fn().mockRejectedValue(new Error('rpc down'));
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => ({ multicall, readContract: vi.fn() }),
    } as never);

    await expect(service.getMarketState()).rejects.toThrow('rpc down');
    await expect(service.getMarketState()).rejects.toThrow('rpc down');

    expect(multicall).toHaveBeenCalledTimes(2);
  });

  it('skips convertToAssets multicall when wallet tranche balances are zero', async () => {
    const client = createMulticallMock({
      onMulticall: (contracts) => {
        if (contracts.length === 2 && contracts[0]?.functionName === 'balanceOf') {
          return [0n, 0n];
        }
        throw new Error(`Unexpected multicall batch: ${contracts[0]?.functionName ?? 'unknown'}`);
      },
    });
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => client,
    } as never);
    const market = {
      address: '0x0000000000000000000000000000000000000001',
      ytTokenAddress: '0x0000000000000000000000000000000000000002',
      baseTokenAddress: '0x00000000000000000000000000000000000000a0',
      seniorTrancheAddress: '0x0000000000000000000000000000000000000005',
      juniorTrancheAddress: '0x0000000000000000000000000000000000000006',
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
    };

    const positions = await service.getPortfolioPositions(
      '0x0000000000000000000000000000000000000004',
      market,
    );

    expect(positions).toEqual([]);
    expect(client.multicall).toHaveBeenCalledTimes(1);
  });

  it('uses preloaded market state for portfolio positions without fetching market again', async () => {
    const client = createMulticallMock();
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => client,
    } as never);
    const market = {
      address: '0x0000000000000000000000000000000000000001',
      ytTokenAddress: '0x7060176d148D07834050473C8a9123244c0B44CD',
      baseTokenAddress: '0x00000000000000000000000000000000000000a0',
      seniorTrancheAddress: '0x0000000000000000000000000000000000000005',
      juniorTrancheAddress: '0x0000000000000000000000000000000000000006',
      seniorSymbol: 'LST',
      juniorSymbol: 'LJT',
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
    };

    const positions = await service.getPortfolioPositions(
      '0x0000000000000000000000000000000000000004',
      market,
    );

    expect(positions).toHaveLength(2);
    expect(client.multicall).toHaveBeenCalledTimes(2);
    expect(client.readContract).not.toHaveBeenCalled();
  });

  it('reads tranche share prices via multicall', async () => {
    const client = createMulticallMock();
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getPublicClient: () => client,
    } as never);

    const result = await service.getMarketTrancheSharePrices();

    expect(result).toEqual({
      stSharePrice: '1010000000000000000',
      jtSharePrice: '970000000000000000',
    });
    expect(client.multicall).toHaveBeenCalledTimes(2);
    expect(client.readContract).not.toHaveBeenCalled();
  });

  it('uses mEDGE as portfolio market display symbol for the production YT address', async () => {
    const client = createMulticallMock({
      onMulticall: (contracts) => {
        const size = contracts.length;
        const first = contracts[0];
        if (size === 12) {
          return [
            '0x7060176d148D07834050473C8a9123244c0B44CD',
            '0x0000000000000000000000000000000000000005',
            '0x0000000000000000000000000000000000000006',
            '0x0000000000000000000000000000000000000007',
            100n,
            60n,
            40n,
            1500000000000000000n,
            6000000000000000000n,
            1000000000000000000n,
            123n,
            false,
          ];
        }
        if (size === 6) {
          return marketMetadataMulticallResults({ seniorSymbol: 'LST', juniorSymbol: 'LJT' });
        }
        if (size === 2 && first?.functionName === 'balanceOf') {
          return [2n, 3n];
        }
        if (size === 2 && first?.functionName === 'convertToAssets') {
          return [2n, 3n];
        }
        throw new Error(`Unexpected multicall batch size ${String(size)}`);
      },
    });
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => client,
    } as never);

    const positions = await service.getPortfolioPositions('0x0000000000000000000000000000000000000004');

    expect(positions).toEqual([
      expect.objectContaining({
        marketSymbol: 'mEDGE',
        assetType: 'senior',
        assetSymbol: 'LST',
      }),
      expect.objectContaining({
        marketSymbol: 'mEDGE',
        assetType: 'junior',
        assetSymbol: 'LJT',
      }),
    ]);
    expect(client.multicall).toHaveBeenCalledTimes(4);
  });

  it('uses configured base token address when reading live market state', async () => {
    const baseTokenAddress = '0x00000000000000000000000000000000000000a0';
    const client = createMulticallMock();
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => baseTokenAddress,
      getPublicClient: () => client,
    } as never);

    const result = await service.getMarketState();

    expect(result.baseTokenAddress).toBe(baseTokenAddress);
  });

  it('reads historical max ST/JT ratio at a specific block', async () => {
    const readContract = vi.fn().mockResolvedValue(6000000000000000000n);
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getPublicClient: () => ({ multicall: vi.fn(), readContract }),
    } as never);

    const result = await service.getMarketMaxStJtRatioAtBlock('100');

    expect(result).toBe('6000000000000000000');
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'maxStJtRatio',
        blockNumber: 100n,
      }),
    );
  });

  it('previews deposit shares from selected tranche contract', async () => {
    const readContract = vi.fn().mockResolvedValue(950000000000000000n);
    const service = new ContractReaderService({
      getPublicClient: () => ({ multicall: vi.fn(), readContract }),
    } as never);

    const result = await service.previewDeposit({
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'junior',
      amountYt: '1000000000000000000',
    });

    expect(result).toBe('950000000000000000');
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x0000000000000000000000000000000000000005',
        functionName: 'previewDeposit',
        args: [1000000000000000000n],
      }),
    );
  });

  it('previews redeemed assets from selected tranche contract', async () => {
    const readContract = vi.fn().mockResolvedValue(480000000000000000n);
    const service = new ContractReaderService({
      getPublicClient: () => ({ multicall: vi.fn(), readContract }),
    } as never);

    const result = await service.previewRedeem({
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'junior',
      shares: '500000000000000000',
    });

    expect(result).toBe('480000000000000000');
  });

  it('previews shares required from selected tranche contract', async () => {
    const readContract = vi.fn().mockResolvedValue(1050000000000000000n);
    const service = new ContractReaderService({
      getPublicClient: () => ({ multicall: vi.fn(), readContract }),
    } as never);

    const result = await service.previewWithdraw({
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'senior',
      amountYt: '1000000000000000000',
    });

    expect(result).toBe('1050000000000000000');
  });

  it('maps undecoded ERC20 insufficient allowance selector from viem raw revert', async () => {
    const error = {
      shortMessage: 'The contract function "depositInstant" reverted with the following signature:\n0xfb8f41b2',
      details: 'execution reverted',
      message: 'Unable to decode signature "0xfb8f41b2" Contract Call: depositInstant(bool asSenior, address tokenIn, uint256 amountIn, uint256 minYtOut, address receiver, bytes32 referrerId)',
      cause: {
        signature: '0xfb8f41b2',
        raw: '0xfb8f41b20000000000000000000000003ada769dc813e3376fcd40d05bea12263048a487000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f4240',
      },
    };
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const service = new ContractReaderService({
      getPublicClient: () => ({
        multicall: vi.fn(),
        simulateContract: vi.fn().mockRejectedValue(error),
      }),
    } as never);

    const result = await service.simulateDepositBaseInstant(INPUT);

    expect(result).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
      errorName: null,
    });
  });

  it('logs raw simulation revert diagnostics without exposing them in the result', async () => {
    const error = {
      shortMessage: 'Execution reverted',
      details: 'ERC20: insufficient allowance',
      message: 'Contract function execution reverted',
      data: { errorName: 'ERC20InsufficientAllowance' },
      cause: { data: { errorName: 'ERC20InsufficientAllowance' } },
    };
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const service = new ContractReaderService({
      getPublicClient: () => ({
        multicall: vi.fn(),
        simulateContract: vi.fn().mockRejectedValue(error),
      }),
    } as never);

    const result = await service.simulateDepositBaseInstant(INPUT);

    expect(result).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
      errorName: 'ERC20InsufficientAllowance',
    });
    expect(warn).toHaveBeenCalled();
  });
});
