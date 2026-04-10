import { Module } from '@nestjs/common';
import { RiskMonitoringService } from './risk-monitoring.service';

@Module({
  providers: [RiskMonitoringService],
  exports: [RiskMonitoringService],
})
export class RiskMonitoringModule {}
