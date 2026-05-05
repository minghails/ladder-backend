import { Module } from '@nestjs/common';
import { DatabaseModule } from '@shared/database/database.module';
import { DepositRequestsController } from './deposit-requests.controller';
import { DepositRequestsService } from './deposit-requests.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DepositRequestsController],
  providers: [DepositRequestsService],
  exports: [DepositRequestsService],
})
export class DepositRequestsModule {}
