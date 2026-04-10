import { Global, Module } from '@nestjs/common';
import { ViemClientService } from './viem-client.service';

@Global()
@Module({
  providers: [ViemClientService],
  exports: [ViemClientService],
})
export class BlockchainModule {}
