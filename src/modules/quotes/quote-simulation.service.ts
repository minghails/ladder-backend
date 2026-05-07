import { Injectable } from '@nestjs/common';
import {
  ContractReaderService,
  type SimulateDepositBaseInstantInput,
  type SimulateDepositBaseInstantResult,
} from '@shared/blockchain/contract-reader.service';

@Injectable()
export class QuoteSimulationService {
  constructor(private readonly contractReader: ContractReaderService) {}

  simulateDepositBaseInstant(input: SimulateDepositBaseInstantInput): Promise<SimulateDepositBaseInstantResult> {
    return this.contractReader.simulateDepositBaseInstant(input);
  }
}
