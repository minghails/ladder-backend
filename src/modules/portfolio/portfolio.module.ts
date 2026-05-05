import { Module } from '@nestjs/common';
import { BlockchainModule } from '@shared/blockchain/blockchain.module';
import { DatabaseModule } from '@shared/database/database.module';
import { PortfolioActivityRepository } from './portfolio-activity.repository';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  imports: [BlockchainModule, DatabaseModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioActivityRepository],
  exports: [PortfolioService],
})
export class PortfolioModule {}
