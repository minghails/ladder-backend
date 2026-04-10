import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { RiskMonitoringService } from './risk-monitoring.service';

describe('RiskMonitoringService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [RiskMonitoringService],
    }).compile();
    expect(module.get(RiskMonitoringService)).toBeDefined();
  });
});
