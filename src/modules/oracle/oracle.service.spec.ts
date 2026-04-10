import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { OracleService } from './oracle.service';

describe('OracleService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [OracleService],
    }).compile();
    expect(module.get(OracleService)).toBeDefined();
  });
});
