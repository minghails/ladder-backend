import { Logger } from '@nestjs/common';
import { describe, it, expect, vi, afterEach } from 'vitest';
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

describe('ContractReaderService', () => {
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
    vi.restoreAllMocks();
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
