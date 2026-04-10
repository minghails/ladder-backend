import { Module } from '@nestjs/common';
import { DepositRequestsController } from './deposit-requests.controller';
import { DepositRequestsService } from './deposit-requests.service';

@Module({
  controllers: [DepositRequestsController],
  providers: [DepositRequestsService],
  exports: [DepositRequestsService],
})
export class DepositRequestsModule {}
