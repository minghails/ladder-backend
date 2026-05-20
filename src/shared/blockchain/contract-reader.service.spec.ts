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

function marketStateReadMocks(): ReturnType<typeof vi.fn> {
  return vi
    .fn()
    .mockResolvedValueOnce('0x0000000000000000000000000000000000000002')
    .mockResolvedValueOnce('0x0000000000000000000000000000000000000003')
    .mockResolvedValueOnce('0x0000000000000000000000000000000000000004')
    .mockResolvedValueOnce('0x0000000000000000000000000000000000000005')
    .mockResolvedValueOnce(100n)
    .mockResolvedValueOnce(60n)
    .mockResolvedValueOnce(40n)
    .mockResolvedValueOnce(1500000000000000000n)
    .mockResolvedValueOnce(6000000000000000000n)
    .mockResolvedValueOnce(1000000000000000000n)
    .mockResolvedValueOnce(123n)
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce('stYT')
    .mockResolvedValueOnce('jtYT')
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(false);
}

describe('ContractReaderService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('reads ERC20 token symbol and decimals from live contract metadata', async () => {
    const readContract = vi.fn()
      .mockResolvedValueOnce('USDC')
      .mockResolvedValueOnce(6);
    const service = new ContractReaderService({
      getPublicClient: () => ({ readContract }),
    } as never);

    const metadata = await service.getTokenMetadata('0x0000000000000000000000000000000000000002');

    expect(metadata).toEqual({
      address: '0x0000000000000000000000000000000000000002',
      symbol: 'USDC',
      decimals: 6,
    });
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x0000000000000000000000000000000000000002',
        functionName: 'symbol',
      }),
    );
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x0000000000000000000000000000000000000002',
        functionName: 'decimals',
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('caches getTokenMetadata within TTL', async () => {
    const readContract = vi.fn().mockResolvedValueOnce('USDC').mockResolvedValueOnce(6);
    const service = new ContractReaderService({
      getPublicClient: () => ({ readContract }),
    } as never);

    await service.getTokenMetadata('0x0000000000000000000000000000000000000002');
    await service.getTokenMetadata('0x0000000000000000000000000000000000000002');

    expect(readContract).toHaveBeenCalledTimes(2);
  });

  it('does not cache getTokenMetadata when read fails', async () => {
    const readContract = vi.fn().mockRejectedValue(new Error('rpc down'));
    const service = new ContractReaderService({
      getPublicClient: () => ({ readContract }),
    } as never);

    await expect(
      service.getTokenMetadata('0x0000000000000000000000000000000000000002'),
    ).rejects.toThrow('rpc down');
    await expect(
      service.getTokenMetadata('0x0000000000000000000000000000000000000002'),
    ).rejects.toThrow('rpc down');

    expect(readContract).toHaveBeenCalledTimes(4);
  });

  it('caches getMarketState within TTL', async () => {
    const readContract = marketStateReadMocks();
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => ({ readContract }),
    } as never);

    await service.getMarketState();
    await service.getMarketState();

    expect(readContract).toHaveBeenCalledTimes(18);
  });

  it('does not cache getMarketState when read fails', async () => {
    const readContract = vi.fn().mockRejectedValue(new Error('rpc down'));
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => ({ readContract }),
    } as never);

    await expect(service.getMarketState()).rejects.toThrow('rpc down');
    await expect(service.getMarketState()).rejects.toThrow('rpc down');

    expect(readContract.mock.calls.length).toBeGreaterThan(18);
  });

  it('uses preloaded market state for portfolio positions without fetching market again', async () => {
    const readContract = vi
      .fn()
      .mockResolvedValueOnce(2n)
      .mockResolvedValueOnce(3n)
      .mockResolvedValueOnce(2n)
      .mockResolvedValueOnce(3n);
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => ({ readContract }),
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
    expect(readContract).toHaveBeenCalledTimes(4);
  });

  it('reads tranche share prices from convertToAssets(1e18)', async () => {
    const readContract = vi.fn()
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000005')
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000006')
      .mockResolvedValueOnce(1010000000000000000n)
      .mockResolvedValueOnce(970000000000000000n);
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getPublicClient: () => ({ readContract }),
    } as never);

    const result = await service.getMarketTrancheSharePrices();

    expect(result).toEqual({
      stSharePrice: '1010000000000000000',
      jtSharePrice: '970000000000000000',
    });
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: 'convertToAssets', args: [1000000000000000000n] }),
    );
  });

  it('uses mEDGE as portfolio market display symbol for the production YT address', async () => {
    const readContract = vi.fn()
      .mockResolvedValueOnce('0x7060176d148D07834050473C8a9123244c0B44CD')
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000005')
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000006')
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000007')
      .mockResolvedValueOnce(100n)
      .mockResolvedValueOnce(60n)
      .mockResolvedValueOnce(40n)
      .mockResolvedValueOnce(1500000000000000000n)
      .mockResolvedValueOnce(6000000000000000000n)
      .mockResolvedValueOnce(1000000000000000000n)
      .mockResolvedValueOnce(123n)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce('LST')
      .mockResolvedValueOnce('LJT')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(2n)
      .mockResolvedValueOnce(3n)
      .mockResolvedValueOnce(2n)
      .mockResolvedValueOnce(3n);
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => '0x00000000000000000000000000000000000000a0',
      getPublicClient: () => ({ readContract }),
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
  });

  it('uses configured base token address when reading live market state', async () => {
    const baseTokenAddress = '0x00000000000000000000000000000000000000a0';
    const readContract = vi.fn()
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000002')
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000003')
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000004')
      .mockResolvedValueOnce('0x0000000000000000000000000000000000000005')
      .mockResolvedValueOnce(100n)
      .mockResolvedValueOnce(60n)
      .mockResolvedValueOnce(40n)
      .mockResolvedValueOnce(1500000000000000000n)
      .mockResolvedValueOnce(6000000000000000000n)
      .mockResolvedValueOnce(1000000000000000000n)
      .mockResolvedValueOnce(123n)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce('stYT')
      .mockResolvedValueOnce('jtYT')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getBaseTokenAddress: () => baseTokenAddress,
      getPublicClient: () => ({ readContract }),
    } as never);

    const result = await service.getMarketState();

    expect(result.baseTokenAddress).toBe(baseTokenAddress);
  });

  it('reads historical max ST/JT ratio at a specific block', async () => {
    const readContract = vi.fn().mockResolvedValue(6000000000000000000n);
    const service = new ContractReaderService({
      getMarketAddress: () => '0x0000000000000000000000000000000000000001',
      getPublicClient: () => ({ readContract }),
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
      getPublicClient: () => ({ readContract }),
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
      getPublicClient: () => ({ readContract }),
    } as never);

    const result = await service.previewRedeem({
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'junior',
      shares: '500000000000000000',
    });

    expect(result).toBe('480000000000000000');
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x0000000000000000000000000000000000000005',
        functionName: 'previewRedeem',
        args: [500000000000000000n],
      }),
    );
  });

  it('previews shares required from selected tranche contract', async () => {
    const readContract = vi.fn().mockResolvedValue(1050000000000000000n);
    const service = new ContractReaderService({
      getPublicClient: () => ({ readContract }),
    } as never);

    const result = await service.previewWithdraw({
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'senior',
      amountYt: '1000000000000000000',
    });

    expect(result).toBe('1050000000000000000');
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x0000000000000000000000000000000000000005',
        functionName: 'previewWithdraw',
        args: [1000000000000000000n],
      }),
    );
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
        simulateContract: vi.fn().mockRejectedValue(error),
      }),
    } as never);

    const result = await service.simulateDepositBaseInstant(INPUT);

    expect(result).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
      errorName: 'ERC20InsufficientAllowance',
    });
    expect(warn).toHaveBeenCalledWith({
      message: 'deposit base simulation reverted',
      reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
      errorName: 'ERC20InsufficientAllowance',
      shortMessage: 'Execution reverted',
      details: 'ERC20: insufficient allowance',
      errorMessage: 'Contract function execution reverted',
      data: { errorName: 'ERC20InsufficientAllowance' },
      cause: { data: { errorName: 'ERC20InsufficientAllowance' } },
    });
  });
});
