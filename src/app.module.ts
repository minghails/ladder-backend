import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { BlockchainModule } from './shared/blockchain/blockchain.module';

@Module({
  imports: [ConfigModule, DatabaseModule, BlockchainModule],
})
export class AppModule {}
