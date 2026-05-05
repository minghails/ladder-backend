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
  afterEach(() => {
    vi.restoreAllMocks();
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
