import { Module } from '@nestjs/common';
import { BlockchainModule } from '@shared/blockchain/blockchain.module';
import { DatabaseModule } from '@shared/database/database.module';
import { MarketApyService } from '../market-state/market-apy.service';
import { PortfolioActivityRepository } from './portfolio-activity.repository';
import { PortfolioAccountingRepository } from './portfolio-accounting.repository';
import { PortfolioClaimablesRepository } from './portfolio-claimables.repository';
import { PortfolioController } from './portfolio.controller';
import { PortfolioEarningsRepository } from './portfolio-earnings.repository';
import { PortfolioService } from './portfolio.service';

@Module({
  imports: [BlockchainModule, DatabaseModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    MarketApyService,
    PortfolioActivityRepository,
    PortfolioAccountingRepository,
    PortfolioClaimablesRepository,
    PortfolioEarningsRepository,
  ],
  exports: [PortfolioService, PortfolioAccountingRepository, PortfolioClaimablesRepository, PortfolioEarningsRepository],
})
export class PortfolioModule {}
