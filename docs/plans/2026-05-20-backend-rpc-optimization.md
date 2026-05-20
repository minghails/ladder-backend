# Backend RPC Optimization Implementation Plan

> **For agentic workers:** Work one bounded slice per session. Follow `backend/docs/HANDOFF.md` for tracker updates, API impact reporting, and architecture doc sync.

**Goal:** Reduce Alchemy/RPC consumption in the Ladder backend without changing public API shapes or live-data semantics. Target meaningful cuts to per-request and background indexer RPC usage so the one-market pilot stays within paid/free RPC quotas.

**Architecture:** Keep the current NestJS modular monolith and viem-based `ContractReaderService`. Add in-process read caching, viem multicall batching, and projector address lookup from PostgreSQL where safe. Do not add Redis, external cache, RPC provider switching logic, or frontend changes in this plan.

**Tech Stack:** NestJS, TypeScript, viem, PostgreSQL, Drizzle, Vitest.

---

## Source-of-truth docs

Read before implementation:

1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `docs/canonical/backend-architecture.md`
5. `docs/canonical/api-contract.md`
6. `docs/canonical/integration-rules.md`

Backend constraints preserved by this plan:

- Deployed contracts remain execution truth; backend read APIs must still return live contract state when labeled `live_contract`.
- No public API path/shape/auth/error-format changes unless explicitly required and documented.
- Cache TTL must be short enough that pilot users still see fresh NAV/capabilities; default target 10–30s.
- Projector must remain correct when reading watched addresses from DB; refresh live market metadata on a bounded schedule or when DB row is missing.
- Do not disable projector or replace indexed history with stale cached live reads.

## Problem statement

Current backend RPC usage is high because:

| Hot path | Current behavior | Approx RPC |
|---|---|---|
| `ContractReaderService.getMarketState()` | 18 separate `readContract` calls | ~18 / call |
| `getTokenMetadata()` | 2 separate `readContract` calls | ~2 / call |
| Market/portfolio/quotes services | Each request calls live reads independently | multiplies above |
| `PortfolioService.getPortfolio()` | Calls `getPortfolioPositions()` and `getMarketState()` in parallel; positions path already calls `getMarketState()` | duplicate full market read |
| `ChainProjectorService.runOnce()` | Calls `bootstrapConfiguredMarket()` → full `getMarketState()` on every batch with new blocks | ~18 / batch |
| `MarketSnapshotProjector` | May call share-price reads, live fallback, and historical ratio reads per event | variable, heavy during catch-up |

This plan addresses backend-only optimizations. Frontend polling and separate dev/prod RPC keys are ops concerns outside code scope.

## Scope

### In scope

1. **Short-lived in-memory cache** for `getMarketState()` and `getTokenMetadata()`.
2. **Portfolio deduplication** so one request reads market state once.
3. **viem multicall** for market state, token metadata, tranche share prices, and portfolio balance reads where practical.
4. **Lighter projector batches** using `markets` table addresses instead of full live market read every batch.
5. **Reduced snapshot-projector RPC fallbacks** where event/snapshot data already suffices.
6. Config/env for cache TTL and optional projector metadata refresh interval.
7. Unit/integration tests and initiative tracker/session docs.

### Non-goals

- Frontend polling changes.
- RPC provider migration or billing automation.
- Redis/BullMQ/external cache.
- Changing API response fields, types, or endpoint list.
- Contract or indexer event schema changes.
- Disabling projector or health checks permanently.
- Historical re-index strategy changes beyond safer RPC usage during catch-up.

## Current RPC hotspots (verified from source)

| File | Hotspot | Notes |
|---|---|---|
| `backend/src/shared/blockchain/contract-reader.service.ts` | `getMarketState()`, `getTokenMetadata()`, `getPortfolioPositions()`, `getMarketTrancheSharePrices()` | Primary optimization target |
| `backend/src/modules/portfolio/portfolio.service.ts` | `getPortfolio()`, other methods calling `getMarketState()` | Duplicate market read in overview path |
| `backend/src/modules/chain-projector/chain-projector.service.ts` | `bootstrapConfiguredMarket()` inside `runOnce()` | Full live read every batch with blocks |
| `backend/src/modules/chain-projector/market-snapshot.projector.ts` | `snapshotFromEvent()` fallbacks | Extra reads during event projection |
| `backend/src/modules/market-state/market-state.service.ts` | `listMarkets()`, `getMarket()`, etc. | Benefits from shared cache/multicall |
| `backend/src/modules/quotes/quotes.service.ts` | `getLiveMarket()` | Benefits from shared cache/multicall |
| `backend/src/shared/common/health/dependency-health.indicator.ts` | `getBlockNumber()` on readiness | Out of scope unless later slice explicitly requested |

## File/module plan

### Existing files to modify

- `backend/src/shared/blockchain/contract-reader.service.ts`
  - Add cache wrapper and multicall-based reads.
  - Allow optional `LiveMarketState` input for portfolio position reads.

- `backend/src/shared/blockchain/contract-reader.service.spec.ts`
  - Cache hit/miss/TTL tests.
  - Multicall mapping tests with mocked public client.

- `backend/src/shared/blockchain/blockchain.module.ts`
  - Wire new helper/provider only if needed.

- `backend/src/shared/config/app.config.ts`
  - Add `blockchain.readCacheTtlMs` and optional projector metadata refresh config if used.

- `backend/src/shared/config/env.validation.ts`
  - Validate new env vars.

- `backend/src/shared/config/env.validation.spec.ts`
  - Env validation coverage.

- `backend/.env.example`
  - Document new env vars.

- `backend/src/modules/portfolio/portfolio.service.ts`
  - Deduplicate market reads in overview and related paths.

- `backend/src/modules/portfolio/portfolio.service.spec.ts`
  - Assert single `getMarketState()` per portfolio overview request.

- `backend/src/modules/chain-projector/chain-projector.service.ts`
  - Load watched addresses from `markets` table when available.
  - Restrict full `bootstrapConfiguredMarket()` live read to bootstrap/refresh paths.

- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
  - Batch with existing DB market row does not require full live read for address discovery.

- `backend/src/modules/chain-projector/market-snapshot.projector.ts`
  - Reduce unnecessary live/historical RPC fallbacks.

- `backend/src/modules/chain-projector/market-snapshot.projector.spec.ts`
  - Preserve snapshot correctness with fewer RPC calls.

- `backend/test/chain/contract-abi.chain.spec.ts`
  - Extend or add smoke assertions if multicall path is covered on live/fork RPC.

### New files likely needed

- `backend/src/shared/blockchain/rpc-read-cache.ts`
  - Small TTL cache utility keyed by method + address/market.

- `backend/src/shared/blockchain/multicall-market-reads.ts` (optional split if `contract-reader.service.ts` grows too large)
  - Pure helpers building multicall batches for market/token/tranche reads.

## Milestones

### Milestone 1 — Quick wins (Epic 1)

Reduce duplicate and repeated reads with minimal behavior risk.

- Add in-memory TTL cache for live reads.
- Deduplicate portfolio overview market state fetch.
- Expected impact: large reduction for repeated API hits within TTL; portfolio overview ~50% fewer market-state RPC equivalents.

### Milestone 2 — Multicall reads (Epic 2)

Replace many sequential `readContract` calls with viem multicall.

- Multicall `getMarketState()`.
- Multicall token metadata and tranche share price helpers.
- Multicall portfolio balance/asset conversions where safe.
- Expected impact: `/markets`-class requests from ~20 RPC to ~2–3 RPC on cache miss.

### Milestone 3 — Indexer RPC reduction (Epic 3)

Reduce background indexing cost.

- Projector reads watched addresses from `markets` table.
- Refresh live market metadata on missing row or scheduled interval only.
- Tighten snapshot projector fallbacks.
- Expected impact: batch indexing drops ~18 live-read RPC per batch when only address lookup was needed.

## Execution tasks

### Epic 1: RPC read cache and portfolio dedup

#### Slice 1 — RPC read cache utility and env

- [ ] Add failing tests for TTL cache get/set/expiry and key isolation.
- [ ] Implement `rpc-read-cache.ts`.
- [ ] Add `RPC_READ_CACHE_TTL_MS` env (default `15000`).
- [ ] Wire config through `app.config.ts` and `env.validation.ts`.
- [ ] Update `.env.example`.

**Acceptance**

- Cache returns same object within TTL.
- Expired entries trigger fresh read on next call.
- Invalid/non-positive TTL rejected or falls back to documented default.

#### Slice 2 — Cache `getMarketState()` and `getTokenMetadata()`

- [ ] Add failing tests in `contract-reader.service.spec.ts` for cache hit/miss behavior.
- [ ] Wrap live reads with cache in `ContractReaderService`.
- [ ] Ensure errors are not cached.
- [ ] Document behavior in initiative architecture/decisions if TTL trade-offs need noting.

**Acceptance**

- Second call within TTL does not invoke underlying `readContract` mocks/spies again.
- Response values unchanged vs uncached path.
- API impact: `No FE-facing API impact`.

#### Slice 3 — Portfolio overview market read dedup

- [ ] Add failing portfolio spec asserting duplicate `getMarketState()` today.
- [ ] Refactor `getPortfolio()` to fetch market once and pass into position read path.
- [ ] Adjust `getPortfolioPositions()` signature to accept optional preloaded market state.
- [ ] Keep backward-compatible behavior for callers without preloaded state.

**Acceptance**

- `getPortfolio()` causes one `getMarketState()` equivalent per request.
- Portfolio tests pass.
- API impact: `No FE-facing API impact`.

### Epic 2: Multicall contract reads

#### Slice 1 — Multicall market state

- [ ] Add failing tests expecting one multicall (or bounded small number of RPC operations) for market state assembly.
- [ ] Implement multicall batch for all current `getMarketState()` fields.
- [ ] Preserve exact returned `LiveMarketState` shape and string normalization.
- [ ] Keep cache layer from Epic 1 on top of multicall path.

**Acceptance**

- Unit tests prove fewer RPC operations than 18 separate reads.
- Existing market-state and contract-reader tests pass.
- Optional chain smoke still passes if environment available.

#### Slice 2 — Multicall token metadata and tranche share prices

- [ ] Multicall `symbol` + `decimals`.
- [ ] Multicall ST/JT `convertToAssets(1e18)` path used by snapshot/APY flows.
- [ ] Tests for decoding and error propagation.

**Acceptance**

- Metadata/share-price helpers use multicall.
- No response shape changes.

#### Slice 3 — Multicall portfolio wallet reads

- [ ] Batch `balanceOf` and conditional `convertToAssets` reads where balances > 0.
- [ ] Reuse preloaded market state from Epic 1 Slice 3.
- [ ] Portfolio specs updated for reduced RPC count where mockable.

**Acceptance**

- Portfolio position path uses fewer RPC operations on cache miss.
- Correct zero-balance behavior preserved.

### Epic 3: Lighter projector and snapshot RPC reduction

#### Slice 1 — Projector watched addresses from DB

- [ ] Add failing projector spec: when `markets` row exists, batch does not call full `getMarketState()` only to discover ST/JT addresses.
- [ ] Read `seniorTrancheAddress` / `juniorTrancheAddress` from DB for `getLogs` address filter.
- [ ] Keep `bootstrapConfiguredMarket()` for initial insert/update of market row.

**Acceptance**

- Projector batch with existing market row avoids full live read for address discovery.
- Cursor/log decoding behavior unchanged.
- API impact: `No FE-facing API impact`.

#### Slice 2 — Bounded live metadata refresh for projector bootstrap

- [ ] Add refresh policy env (for example `PROJECTOR_MARKET_REFRESH_MS`, default 15 minutes) or refresh-on-missing-row only.
- [ ] Ensure halted/token address updates eventually propagate without per-batch full read.
- [ ] Log when refresh occurs for ops visibility.

**Acceptance**

- Synced projector batches no longer require per-batch metadata refresh.
- Missing `markets` row still bootstraps correctly.

#### Slice 3 — Snapshot projector fallback tightening

- [ ] Audit `market-snapshot.projector.ts` live/historical fallbacks.
- [ ] Prefer prior snapshot/event args before RPC.
- [ ] Use multicall share-price helper from Epic 2 when RPC is still required.
- [ ] Extend projector specs for event paths with reduced RPC spy counts.

**Acceptance**

- Snapshot rows remain correct for covered test fixtures.
- Fewer RPC calls on common event paths.

## Verification gates

Run after every slice:

```bash
cd backend
pnpm test <changed-spec-files>
pnpm lint
pnpm build
```

Run before marking an epic complete:

```bash
cd backend
pnpm test src/shared/blockchain/contract-reader.service.spec.ts
pnpm test src/modules/portfolio/portfolio.service.spec.ts
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
pnpm test src/modules/chain-projector/market-snapshot.projector.spec.ts
pnpm lint
pnpm build
```

Optional when RPC env available:

```bash
cd backend
pnpm test:chain
```

Architecture doc sync per slice:

- Compare against `docs/canonical/backend-architecture.md`.
- If only internal RPC/cache/projector behavior changed with no API/schema/event semantics change, record `Architecture docs checked; no update needed`.

## Expected outcomes

| Scenario | Before | After plan |
|---|---|---|
| `GET /markets` cache miss | ~20 RPC | ~2–3 RPC |
| `GET /markets` cache hit within TTL | ~20 RPC | ~0 RPC |
| `GET /portfolio/:wallet` | ~36–40 RPC | ~5–8 RPC on cache miss |
| Projector batch with new blocks (synced market row) | ~20+ RPC | ~2–3 RPC + logs/blocks |
| Catch-up indexing | very high | materially lower, still non-trivial |

## Open decisions

1. **Default cache TTL:** recommend `15000` ms; confirm with ops if 30s is acceptable for pilot.
2. **Projector metadata refresh:** refresh-on-missing-row only vs timed refresh (recommend timed 15m plus missing-row bootstrap).
3. **Cache scope:** process-local only (recommended for MVP) vs shared cache later.
4. **Quote simulation paths:** keep unchanged in first pass unless profiling shows they dominate quota after Epics 1–3.

## Risks

| Risk | Mitigation |
|---|---|
| Stale NAV/capabilities within cache TTL | Keep TTL short; do not cache errors; document ops trade-off |
| Projector uses stale ST/JT addresses if market migrated | Refresh market row on timed bootstrap; deployment changes remain rare in one-market pilot |
| Multicall decode regressions | Preserve existing unit tests; add chain smoke |
| False confidence after catch-up | This plan reduces steady-state RPC; historical catch-up still costly |
| Multiple backend replicas with independent caches | Acceptable for MVP; each replica may refresh cache separately |

## API impact expectation

All slices in this plan should default to **`No FE-facing API impact`** unless a visible freshness regression is discovered during verification. If any endpoint semantics change, classify per `backend/docs/HANDOFF.md` and update `docs/canonical/api-contract.md`.

## Initiative activation

When activated, create:

```text
backend/docs/initiatives/backend-rpc-optimization/
```

Active first slice:

```text
Epic 1, Slice 1 — RPC read cache utility and env
```
