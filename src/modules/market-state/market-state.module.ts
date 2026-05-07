import { Module } from '@nestjs/common';
import { BlockchainModule } from '@shared/blockchain/blockchain.module';
import { DatabaseModule } from '@shared/database/database.module';
import { MarketApyService } from './market-apy.service';
import { MarketStateController } from './market-state.controller';
import { MarketStateService } from './market-state.service';

@Module({
  imports: [BlockchainModule, DatabaseModule],
  controllers: [MarketStateController],
  providers: [MarketStateService, MarketApyService],
  exports: [MarketStateService],
})
export class MarketStateModule {}
