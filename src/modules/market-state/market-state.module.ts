import { Module } from '@nestjs/common';
import { MarketStateController } from './market-state.controller';
import { MarketStateService } from './market-state.service';

@Module({
  controllers: [MarketStateController],
  providers: [MarketStateService],
  exports: [MarketStateService],
})
export class MarketStateModule {}
