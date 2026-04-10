import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ViemClientService } from './viem-client.service';

describe('ViemClientService', () => {
  it('should create a public client', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              blockchain: {
                rpcUrl: 'http://localhost:8545',
                marketAddress: '0x1234567890123456789012345678901234567890',
              },
            }),
          ],
        }),
      ],
      providers: [ViemClientService],
    }).compile();

    const service = module.get(ViemClientService);
    expect(service).toBeDefined();
    expect(service.getPublicClient()).toBeDefined();
  });
});
