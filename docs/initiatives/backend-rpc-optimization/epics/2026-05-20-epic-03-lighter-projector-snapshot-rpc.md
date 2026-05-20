# Epic: Lighter Projector and Snapshot RPC Reduction

## Goal

Reduce background indexer RPC usage by reusing persisted market metadata and tightening snapshot projection fallbacks.

## Source plan

`backend/docs/plans/2026-05-20-backend-rpc-optimization.md` — Milestone 3 / Epic 3.

## Status

Completed (2026-05-20).

## Slices

### Slice 1 — Projector watched addresses from DB

**Status:** completed (2026-05-20).

**Scope**

- Read market/ST/JT addresses from `markets` table for `getLogs` when row exists.
- Keep bootstrap upsert path for initial market row creation.

**Files likely touched**

- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`

**Acceptance**

- Batch with existing market row does not require full `getMarketState()` only for address discovery.
- Cursor and decode behavior unchanged.
- API impact: `No FE-facing API impact`.

### Slice 2 — Bounded live metadata refresh for projector bootstrap

**Status:** completed (2026-05-20).

**Scope**

- Add refresh policy env (for example `PROJECTOR_MARKET_REFRESH_MS`).
- Refresh live market metadata on missing row or interval, not every batch.

**Files likely touched**

- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/shared/config/app.config.ts`
- `backend/src/shared/config/env.validation.ts`
- `backend/.env.example`

**Acceptance**

- Synced batches avoid per-batch metadata refresh.
- Missing market row still bootstraps successfully.
- API impact: `No FE-facing API impact`.

### Slice 3 — Snapshot projector fallback tightening

**Status:** completed (2026-05-20).

**Scope**

- Prefer prior snapshot/event args before RPC in `market-snapshot.projector.ts`.
- Use multicall share-price helper when RPC remains necessary.

**Files likely touched**

- `backend/src/modules/chain-projector/market-snapshot.projector.ts`
- `backend/src/modules/chain-projector/market-snapshot.projector.spec.ts`

**Acceptance**

- Snapshot correctness preserved in covered tests.
- Reduced RPC usage on common event paths.
- API impact: `No FE-facing API impact`.
