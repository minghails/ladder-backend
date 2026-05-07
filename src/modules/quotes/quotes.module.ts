import { Module } from '@nestjs/common';
import { BlockchainModule } from '@shared/blockchain/blockchain.module';
import { QuoteSimulationService } from './quote-simulation.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [BlockchainModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuoteSimulationService],
  exports: [QuotesService],
})
export class QuotesModule {}
