import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    }).compile();

    const controller = module.get(HealthController);
    expect(controller).toBeDefined();
  });
});
