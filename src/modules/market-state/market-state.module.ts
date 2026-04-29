import { Module } from '@nestjs/common';
import { BlockchainModule } from '@shared/blockchain/blockchain.module';
import { MarketStateController } from './market-state.controller';
import { MarketStateService } from './market-state.service';

@Module({
  imports: [BlockchainModule],
  controllers: [MarketStateController],
  providers: [MarketStateService],
  exports: [MarketStateService],
})
export class MarketStateModule {}
