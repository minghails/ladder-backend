import { Controller } from '@nestjs/common';
import { MarketStateService } from './market-state.service';

@Controller('markets')
export class MarketStateController {
  constructor(private readonly marketState: MarketStateService) {}
}
