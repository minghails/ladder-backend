import { describe, expect, it, vi } from 'vitest';
import { ContractReaderService } from '@shared/blockchain/contract-reader.service';
import { QuoteSimulationService } from './quote-simulation.service';

describe('QuoteSimulationService', () => {
  function createService() {
    const contractReader = {
      simulateDepositBaseInstant: vi.fn().mockResolvedValue({
        ok: true,
        ytOut: '998000000000000000',
        sharesOut: '998000000000000000',
      }),
      previewDeposit: vi.fn().mockResolvedValue('950000000000000000'),
      previewRedeem: vi.fn().mockResolvedValue('480000000000000000'),
      previewWithdraw: vi.fn().mockResolvedValue('1050000000000000000'),
    };

    return {
      service: new QuoteSimulationService(contractReader as unknown as ContractReaderService),
      contractReader,
    };
  }

  it('delegates deposit-base instant simulation to contract reader', async () => {
    const { service, contractReader } = createService();
    const input = {
      market: '0x0000000000000000000000000000000000000001',
      asSenior: false,
      tokenIn: '0x0000000000000000000000000000000000000002',
      amountIn: '1000000',
      minYtOut: '900000000000000000',
      receiver: '0x0000000000000000000000000000000000000003',
      referrerId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      sender: '0x0000000000000000000000000000000000000004',
      trancheToken: '0x0000000000000000000000000000000000000005',
    };

    const result = await service.simulateDepositBaseInstant(input);

    expect(contractReader.simulateDepositBaseInstant).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      ok: true,
      ytOut: '998000000000000000',
      sharesOut: '998000000000000000',
    });
  });

  it('delegates deposit preview to contract reader', async () => {
    const { service, contractReader } = createService();
    const input = {
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'junior' as const,
      amountYt: '1000000000000000000',
    };

    const result = await service.previewDeposit(input);

    expect(contractReader.previewDeposit).toHaveBeenCalledWith(input);
    expect(result).toBe('950000000000000000');
  });

  it('delegates redeem preview to contract reader', async () => {
    const { service, contractReader } = createService();
    const input = {
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'junior' as const,
      shares: '500000000000000000',
    };

    const result = await service.previewRedeem(input);

    expect(contractReader.previewRedeem).toHaveBeenCalledWith(input);
    expect(result).toBe('480000000000000000');
  });

  it('delegates withdraw preview to contract reader', async () => {
    const { service, contractReader } = createService();
    const input = {
      trancheToken: '0x0000000000000000000000000000000000000005',
      tranche: 'senior' as const,
      amountYt: '1000000000000000000',
    };

    const result = await service.previewWithdraw(input);

    expect(contractReader.previewWithdraw).toHaveBeenCalledWith(input);
    expect(result).toBe('1050000000000000000');
  });

  it('preserves mapped simulation reverts', async () => {
    const { service, contractReader } = createService();
    contractReader.simulateDepositBaseInstant.mockResolvedValueOnce({
      ok: false,
      reason: 'MIN_YT_OUT_NOT_MET',
      errorName: 'RequestMinYtOutNotMet',
    });

    const result = await service.simulateDepositBaseInstant({
      market: '0x0000000000000000000000000000000000000001',
      asSenior: true,
      tokenIn: '0x0000000000000000000000000000000000000002',
      amountIn: '1000000',
      minYtOut: '900000000000000000',
      receiver: '0x0000000000000000000000000000000000000003',
      referrerId: '0x0000000000000000000000000000000000000000000000000000000000000000',
      sender: '0x0000000000000000000000000000000000000004',
      trancheToken: '0x0000000000000000000000000000000000000005',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'MIN_YT_OUT_NOT_MET',
      errorName: 'RequestMinYtOutNotMet',
    });
  });
});
