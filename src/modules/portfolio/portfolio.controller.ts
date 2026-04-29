import { Controller, Get, Param } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get(':address/requests')
  getRequests(@Param('address') address: string) {
    return this.portfolio.getRequests(address);
  }

  @Get(':address')
  getPortfolio(@Param('address') address: string) {
    return this.portfolio.getPortfolio(address);
  }
}
