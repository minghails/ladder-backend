import { Controller, Get, Param } from '@nestjs/common';
import { MarketStateService } from './market-state.service';

@Controller('markets')
export class MarketStateController {
  constructor(private readonly marketState: MarketStateService) {}

  @Get()
  listMarkets() {
    return this.marketState.listMarkets();
  }

  @Get(':address')
  getMarket(@Param('address') address: string) {
    return this.marketState.getMarket(address);
  }
}
