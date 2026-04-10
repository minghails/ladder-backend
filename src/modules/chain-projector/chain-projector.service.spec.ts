import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { ChainProjectorService } from './chain-projector.service';

describe('ChainProjectorService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [ChainProjectorService],
    }).compile();
    expect(module.get(ChainProjectorService)).toBeDefined();
  });
});
