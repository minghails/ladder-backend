import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { MarketStateService } from './market-state.service';

describe('MarketStateService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [MarketStateService],
    }).compile();
    expect(module.get(MarketStateService)).toBeDefined();
  });
});
