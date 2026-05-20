# Epic: RPC Read Cache and Portfolio Dedup

## Goal

Reduce repeated live RPC reads across API requests with a short TTL cache and remove duplicate market-state fetches in portfolio overview.

## Source plan

`backend/docs/plans/2026-05-20-backend-rpc-optimization.md` — Milestone 1 / Epic 1.

## Status

Completed (2026-05-20).

## Slices

### Slice 1 — RPC read cache utility and env

**Status:** completed (2026-05-20).

**Scope**

- Add small TTL cache helper.
- Add `RPC_READ_CACHE_TTL_MS` env/config validation.
- Document env in `.env.example`.

**Files likely touched**

- `backend/src/shared/blockchain/rpc-read-cache.ts`
- `backend/src/shared/blockchain/rpc-read-cache.spec.ts`
- `backend/src/shared/config/app.config.ts`
- `backend/src/shared/config/env.validation.ts`
- `backend/src/shared/config/env.validation.spec.ts`
- `backend/.env.example`

**Acceptance**

- Cache hit/miss/expiry behavior covered by tests.
- Env default is 15000 ms.
- API impact: `No FE-facing API impact`.

### Slice 2 — Cache getMarketState and getTokenMetadata

**Status:** completed (2026-05-20).

**Scope**

- Integrate cache into `ContractReaderService`.
- Do not cache thrown errors.
- Preserve existing return shapes.

**Files likely touched**

- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.spec.ts`

**Acceptance**

- Repeated calls within TTL avoid duplicate underlying reads.
- Existing contract-reader tests pass.
- API impact: `No FE-facing API impact`.

### Slice 3 — Portfolio overview market read dedup

**Status:** completed (2026-05-20).

**Scope**

- Fetch live market once in `getPortfolio()`.
- Pass preloaded market into portfolio position read path.
- Keep other portfolio methods behavior-compatible.

**Files likely touched**

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/shared/blockchain/contract-reader.service.ts`

**Acceptance**

- One `getMarketState()` equivalent per portfolio overview request.
- Portfolio tests pass.
- API impact: `No FE-facing API impact`.
