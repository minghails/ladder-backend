import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { AdminOpsService } from './admin-ops.service';

describe('AdminOpsService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [AdminOpsService],
    }).compile();
    expect(module.get(AdminOpsService)).toBeDefined();
  });
});
