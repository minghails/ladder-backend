import { Module } from '@nestjs/common';
import { DatabaseModule } from '@shared/database/database.module';
import { TxStatusController } from './tx-status.controller';
import { TxStatusService } from './tx-status.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TxStatusController],
  providers: [TxStatusService],
  exports: [TxStatusService],
})
export class TxStatusModule {}
