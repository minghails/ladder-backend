import { Module } from '@nestjs/common';
import { BlockchainModule } from '@shared/blockchain/blockchain.module';
import { DatabaseModule } from '@shared/database/database.module';
import { ChainProjectorService } from './chain-projector.service';
import { MarketSnapshotProjector } from './market-snapshot.projector';
import { PriceUpdateProjector } from './price-update.projector';
import { DepositRequestProjector } from './deposit-request.projector';

@Module({
  imports: [BlockchainModule, DatabaseModule],
  providers: [
    ChainProjectorService,
    MarketSnapshotProjector,
    PriceUpdateProjector,
    DepositRequestProjector,
  ],
  exports: [ChainProjectorService],
})
export class ChainProjectorModule {}
