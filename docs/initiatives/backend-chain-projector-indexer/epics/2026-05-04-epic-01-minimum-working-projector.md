# Epic 1 — Minimum Working Projector

## Goal

Fetch configured Market logs, decode supported events, persist raw events idempotently, and advance cursor safely.

## Source plan sections

- `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md` §4, Tasks 1–8.

## Scope

- Projector env/config.
- `market_events` idempotency schema.
- `projector_cursors` schema.
- Configured market bootstrap.
- Projector event types and argument normalizer.
- `ViemClientService.getChainId()`.
- `ChainProjectorService.runOnce()` core.
- Optional background loop gated by `PROJECTOR_ENABLED`.

## Non-goals

- No snapshots/price updates/request lifecycle beyond raw event storage.
- No read API changes.
- No admin write orchestration.

## Slice 1 — projector config

**Goal:** Add validated projector config that keeps disabled local startup cheap and requires deployment block only when enabled.

**Files:**
- Modify: `backend/.env.example`
- Modify: `backend/src/shared/config/env.validation.ts`
- Modify: `backend/src/shared/config/env.validation.spec.ts`
- Modify: `backend/src/shared/config/app.config.ts`

**Steps:**
- [ ] Read existing config files and tests.
- [ ] Add failing tests for valid projector config, negative `DEPLOYMENT_BLOCK`, invalid `PROJECTOR_ENABLED`, and enabled projector with `DEPLOYMENT_BLOCK=0`.
- [ ] Run `pnpm test src/shared/config/env.validation.spec.ts` and confirm fail.
- [ ] Add env validation fields: `CHAIN_ID`, `DEPLOYMENT_BLOCK`, `PROJECTOR_ENABLED`, `PROJECTOR_CONFIRMATIONS`, `PROJECTOR_BATCH_SIZE`, `PROJECTOR_POLL_INTERVAL_MS`.
- [ ] Add refinement: `PROJECTOR_ENABLED=true` requires `DEPLOYMENT_BLOCK > 0`.
- [ ] Add `projectorConfig` return shape in `app.config.ts`.
- [ ] Update `backend/.env.example`.
- [ ] Run targeted test and confirm pass.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/shared/config/env.validation.spec.ts` — expected: pass.

## Slice 2 — idempotent event and cursor schema

**Goal:** Add source identity fields for raw events and per-market cursor safety.

**Files:**
- Modify: `backend/src/shared/database/schema/market-events.ts`
- Modify: `backend/src/shared/database/schema/projector-cursors.ts`
- Generate: Drizzle migration under existing migrations folder

**Steps:**
- [ ] Read current schema files and migration conventions.
- [ ] Add schema tests if project has schema tests; otherwise inspect generated SQL manually.
- [ ] Add `market_events.chain_id`, `block_hash`, `block_timestamp`.
- [ ] Add unique constraint: `(chain_id, market_address, tx_hash, log_index)`.
- [ ] Add `projector_cursors.chain_id`, `market_address`, `last_block_hash`.
- [ ] Preserve existing cursor number field style.
- [ ] Generate migration with `pnpm db:generate`.
- [ ] Inspect migration for unsafe `NOT NULL` additions; add backfill/default strategy or require dev DB reset approval.
- [ ] Run relevant schema/type checks.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm db:generate` — expected: migration generated.
- Run targeted test/typecheck used by backend — expected: pass.

## Slice 3 — market bootstrap and projector types

**Goal:** Ensure configured market row exists before projected rows and create typed event/range contracts.

**Files:**
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- Create: `backend/src/modules/chain-projector/projector.types.ts`

**Steps:**
- [ ] Read existing `ChainProjectorService` and tests.
- [ ] Add failing test: `runOnce()` upserts configured market before event insert.
- [ ] Add failing test: bootstrap uses `ContractReaderService.getMarketState()`.
- [ ] Add `ProjectedEventName`, `ProjectorRange`, and `DecodedMarketEvent` types from plan.
- [ ] Implement idempotent market bootstrap skeleton without full log indexing.
- [ ] Ensure repeated bootstrap updates same `markets` row.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts` — expected: pass.

## Slice 4 — event normalizer and viem chain ID

**Goal:** Normalize decoded event args predictably and expose chain ID through viem client service.

**Files:**
- Create: `backend/src/modules/chain-projector/projector-events.ts`
- Create: `backend/src/modules/chain-projector/projector-events.spec.ts`
- Modify: `backend/src/shared/blockchain/viem-client.service.ts`
- Modify: `backend/src/shared/blockchain/viem-client.service.spec.ts`

**Steps:**
- [ ] Write failing tests for bigint-to-string, `jtStRatioAfter` to `stJtRatioAfter`, and unknown arg handling.
- [ ] Write failing test for `getChainId()`.
- [ ] Implement `normalizeEventArgs` and supported event names.
- [ ] Add `getChainId(): number` without changing existing methods.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/chain-projector/projector-events.spec.ts src/shared/blockchain/viem-client.service.spec.ts` — expected: pass.

## Slice 5 — `runOnce()` fetch/decode/persist/cursor core

**Goal:** Process one confirmed block range with idempotent raw event writes and safe cursor advancement.

**Files:**
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.spec.ts`

**Steps:**
- [ ] Add failing tests for no cursor start block, confirmations no-op, batch cap, duplicate inserts, and cursor-not-advanced-on-write-failure.
- [ ] Implement head/safe range computation.
- [ ] Read cursor by `market:<chainId>:<marketAddressLowercase>`.
- [ ] Fetch logs for Market address and batch range.
- [ ] Fetch unique block timestamps via `getBlock`.
- [ ] Decode supported events with `MARKET_ABI`.
- [ ] Normalize args and insert into `market_events` with `onConflictDoNothing`.
- [ ] Update cursor only after writes succeed.
- [ ] Return summary shape from plan.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts` — expected: pass.

## Slice 6 — optional background loop and README baseline

**Goal:** Gate background indexing behind `PROJECTOR_ENABLED` and document basic run controls.

**Files:**
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- Modify: `backend/src/modules/chain-projector/README.md`

**Steps:**
- [ ] Add failing tests that loop does not start by default and starts when enabled.
- [ ] Implement `OnApplicationBootstrap` behavior only for enabled projector.
- [ ] Add `isRunning` guard.
- [ ] Run immediate `runOnce()` on bootstrap when enabled.
- [ ] Schedule interval with `PROJECTOR_POLL_INTERVAL_MS`.
- [ ] Log batch summaries.
- [ ] Update README with config/run basics.
- [ ] Run targeted tests.
- [ ] Update tracker to Epic 2, Slice 1.
- [ ] Write session log.

**Verification:**
- `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts` — expected: pass.
