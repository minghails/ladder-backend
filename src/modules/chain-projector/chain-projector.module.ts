import { Module } from '@nestjs/common';
import { BlockchainModule } from '@shared/blockchain/blockchain.module';
import { DatabaseModule } from '@shared/database/database.module';
import { ChainProjectorService } from './chain-projector.service';

@Module({
  imports: [BlockchainModule, DatabaseModule],
  providers: [ChainProjectorService],
  exports: [ChainProjectorService],
})
export class ChainProjectorModule {}
