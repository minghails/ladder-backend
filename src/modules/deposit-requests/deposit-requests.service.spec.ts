import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { DepositRequestsService } from './deposit-requests.service';

describe('DepositRequestsService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [DepositRequestsService],
    }).compile();
    expect(module.get(DepositRequestsService)).toBeDefined();
  });
});
