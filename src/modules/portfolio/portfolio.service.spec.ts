import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [PortfolioService],
    }).compile();
    expect(module.get(PortfolioService)).toBeDefined();
  });
});
