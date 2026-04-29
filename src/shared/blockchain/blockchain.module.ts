import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@shared/config/config.module';
import { ViemClientService } from './viem-client.service';
import { ContractReaderService } from './contract-reader.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ViemClientService, ContractReaderService],
  exports: [ViemClientService, ContractReaderService],
})
export class BlockchainModule {}
