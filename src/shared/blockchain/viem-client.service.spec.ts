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
                baseTokenAddress: '0x00000000000000000000000000000000000000a0',
              },
              projector: {
                chainId: 84532,
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

  it('should configure Base Sepolia chain metadata for multicall', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              blockchain: {
                rpcUrl: 'http://localhost:8545',
                marketAddress: '0x1234567890123456789012345678901234567890',
                baseTokenAddress: '0x00000000000000000000000000000000000000a0',
              },
              projector: {
                chainId: 84532,
              },
            }),
          ],
        }),
      ],
      providers: [ViemClientService],
    }).compile();

    const service = module.get(ViemClientService);
    const client = service.getPublicClient();

    expect(client.chain?.id).toBe(84532);
    expect(client.chain?.contracts?.multicall3?.address).toBeDefined();
  });

  it('should expose configured chain ID', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              blockchain: {
                rpcUrl: 'http://localhost:8545',
                marketAddress: '0x1234567890123456789012345678901234567890',
                baseTokenAddress: '0x00000000000000000000000000000000000000a0',
              },
              projector: {
                chainId: 84532,
              },
            }),
          ],
        }),
      ],
      providers: [ViemClientService],
    }).compile();

    const service = module.get(ViemClientService);
    expect(service.getChainId()).toBe(84532);
  });
});
