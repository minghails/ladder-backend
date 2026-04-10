# Blockchain Module

Provides viem-based Ethereum client for contract reads, event decoding, and calldata preparation.

## Services

- `ViemClientService` — creates and manages `PublicClient` instance

## Contract ABIs

- `contracts/market-abi.ts` — Market.sol event ABI (from `docs/canonical/smartcontract-events.md`)

## Usage

Inject `ViemClientService` to access the public client:

```typescript
constructor(private readonly viemClient: ViemClientService) {}

async getBlockNumber() {
  return this.viemClient.getPublicClient().getBlockNumber();
}
```
