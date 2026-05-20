# Epic: Multicall Contract Reads

## Goal

Replace many sequential viem `readContract` calls with batched multicall operations in shared blockchain read helpers.

## Source plan

`backend/docs/plans/2026-05-20-backend-rpc-optimization.md` — Milestone 2 / Epic 2.

## Status

Completed (2026-05-20).

## Slices

### Slice 1 — Multicall market state

**Status:** completed (2026-05-20).

**Scope**

- Batch all fields currently assembled in `getMarketState()`.
- Keep cache layer from Epic 1 on top of multicall path.
- Preserve exact `LiveMarketState` output.

**Files likely touched**

- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.spec.ts`
- `backend/src/shared/blockchain/multicall-market-reads.ts` (if split out)

**Acceptance**

- Fewer RPC operations than 18 separate reads on cache miss.
- Existing market-state dependent tests pass.
- API impact: `No FE-facing API impact`.

### Slice 2 — Multicall token metadata and tranche share prices

**Status:** completed (2026-05-20).

**Scope**

- Batch ERC20 metadata reads.
- Batch ST/JT `convertToAssets(1e18)` reads.

**Files likely touched**

- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.spec.ts`

**Acceptance**

- Metadata and share-price helpers use multicall.
- Snapshot/APY dependent tests still pass.
- API impact: `No FE-facing API impact`.

### Slice 3 — Multicall portfolio wallet reads

**Status:** completed (2026-05-20).

**Scope**

- Batch wallet `balanceOf` reads.
- Batch conditional `convertToAssets` reads.
- Reuse preloaded market state from Epic 1.

**Files likely touched**

- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.spec.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`

**Acceptance**

- Portfolio position path uses fewer RPC operations on cache miss.
- Zero-balance behavior unchanged.
- API impact: `No FE-facing API impact`.
