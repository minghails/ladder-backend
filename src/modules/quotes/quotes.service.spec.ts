import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { QuotesService } from './quotes.service';

describe('QuotesService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [QuotesService],
    }).compile();
    expect(module.get(QuotesService)).toBeDefined();
  });
});
