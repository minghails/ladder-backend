import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http, type PublicClient, type Address } from 'viem';

@Injectable()
export class ViemClientService {
  private readonly publicClient: PublicClient;
  private readonly marketAddress: Address;
  private readonly chainId: number;

  constructor(private readonly config: ConfigService) {
    const rpcUrl = this.config.getOrThrow<string>('blockchain.rpcUrl');
    this.marketAddress = this.config.getOrThrow<string>(
      'blockchain.marketAddress',
    ) as Address;
    this.chainId = this.config.getOrThrow<number>('projector.chainId');

    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
    });
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getMarketAddress(): Address {
    return this.marketAddress;
  }

  getChainId(): number {
    return this.chainId;
  }
}
