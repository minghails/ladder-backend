import { Injectable } from '@nestjs/common';
import {
  ContractReaderService,
  type PreviewDepositInput,
  type PreviewRedeemInput,
  type PreviewWithdrawInput,
  type SimulateDepositBaseInstantInput,
  type SimulateDepositBaseInstantResult,
} from '@shared/blockchain/contract-reader.service';

@Injectable()
export class QuoteSimulationService {
  constructor(private readonly contractReader: ContractReaderService) {}

  simulateDepositBaseInstant(input: SimulateDepositBaseInstantInput): Promise<SimulateDepositBaseInstantResult> {
    return this.contractReader.simulateDepositBaseInstant(input);
  }

  previewDeposit(input: PreviewDepositInput): Promise<string> {
    return this.contractReader.previewDeposit(input);
  }

  previewRedeem(input: PreviewRedeemInput): Promise<string> {
    return this.contractReader.previewRedeem(input);
  }

  previewWithdraw(input: PreviewWithdrawInput): Promise<string> {
    return this.contractReader.previewWithdraw(input);
  }
}
