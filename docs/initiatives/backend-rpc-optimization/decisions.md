# Backend RPC Optimization Decisions

## Accepted

1. **Backend-only optimization**
   - Reduce RPC in cache/multicall/projector paths only.
   - No FE work in this initiative.

2. **In-process TTL cache**
   - Cache `getMarketState()` and `getTokenMetadata()`.
   - Default TTL: 15 seconds.
   - Do not cache failures.

3. **Multicall before broader refactors**
   - Highest ROI is batching current sequential `readContract` calls in `ContractReaderService`.

4. **Projector address discovery**
   - Use PostgreSQL `markets` row for ST/JT/market addresses during log fetch when row exists.
   - Do not remove bootstrap path that upserts market metadata from live reads.

5. **API impact default**
   - Expected classification for all slices: `No FE-facing API impact`.

## Open

1. Final TTL default: 15s vs 30s for pilot ops comfort.
2. Projector metadata refresh interval default if timed refresh is implemented.
3. Whether quote simulation RPC should be included in a follow-up slice after Epics 1–3.

## Deferred

- Redis/shared cache.
- Health probe RPC reduction.
- Separate dev/prod RPC key automation.
