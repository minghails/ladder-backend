# Backend RPC Optimization Architecture Notes

## Architecture boundary

This initiative keeps the current NestJS modular monolith and viem-based blockchain module. Contracts remain execution truth. Optimizations happen inside read/projection paths only.

## Data ownership

- Contracts own live execution state.
- PostgreSQL `markets` table owns persisted market/tranche address metadata for indexer address discovery once bootstrapped.
- In-process TTL cache owns short-lived copies of live reads; it is not a source of truth.

## Read path after optimization

```text
API / projector request
  -> ContractReaderService
    -> RPC read cache (TTL)
      -> multicall batch (on cache miss)
        -> viem public client
```

Projector batch path after Epic 3:

```text
runOnce()
  -> getBlockNumber
  -> if new blocks:
       load watched addresses from markets table when row exists
       getLogs
       decode/project
       bootstrap/refresh market row only on missing row or refresh interval
```

## Locked decisions

1. **Cache location:** process-local in-memory only for MVP.
2. **Default cache TTL:** 15s via `RPC_READ_CACHE_TTL_MS`.
3. **API stability:** no endpoint or response shape changes expected.
4. **Projector correctness:** DB address lookup is allowed only after market row bootstrap; full live refresh remains available on bounded schedule or missing row.

## Non-goals

- External cache layer.
- FE polling guidance.
- RPC provider migration.
