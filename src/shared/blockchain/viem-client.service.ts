import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http, type PublicClient, type Address, type Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';

@Injectable()
export class ViemClientService {
  private readonly publicClient: PublicClient;
  private readonly marketAddress: Address;
  private readonly baseTokenAddress: Address;
  private readonly chainId: number;

  constructor(private readonly config: ConfigService) {
    const rpcUrl = this.config.getOrThrow<string>('blockchain.rpcUrl');
    this.marketAddress = this.config.getOrThrow<string>(
      'blockchain.marketAddress',
    ) as Address;
    this.baseTokenAddress = this.config.getOrThrow<string>(
      'blockchain.baseTokenAddress',
    ) as Address;
    this.chainId = this.config.getOrThrow<number>('projector.chainId');

    this.publicClient = createPublicClient({
      chain: chainForId(this.chainId),
      transport: http(rpcUrl),
    });
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getMarketAddress(): Address {
    return this.marketAddress;
  }

  getBaseTokenAddress(): Address {
    return this.baseTokenAddress;
  }

  getChainId(): number {
    return this.chainId;
  }
}

function chainForId(chainId: number): Chain | undefined {
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }
  if (chainId === base.id) {
    return base;
  }
  return undefined;
}
