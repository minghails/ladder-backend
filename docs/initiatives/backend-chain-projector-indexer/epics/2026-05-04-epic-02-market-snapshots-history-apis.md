# Epic 2 — Market Snapshots and History APIs

## Goal

Project NAV-bearing events into market snapshots and serve history/chart data from indexed rows.

## Source plan sections

- `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md` §5, Tasks 9–13.

## Scope

- Snapshot schema/source identity.
- Snapshot projector.
- Price update projector.
- `/markets/:address/history` endpoint.
- Indexed `tvl`, `tokenPrice`, and `ratio` chart metrics.

## Non-goals

- No yield/utilization replacement.
- No request lifecycle projection.
- No full market-state rewrite.

## Slice 1 — snapshot schema

**Goal:** Add idempotent source identity for snapshots and settle semantic ratio storage approach.

**Files:**
- Modify: `backend/src/shared/database/schema/market-snapshots.ts`
- Generate: Drizzle migration under existing migrations folder

**Steps:**
- [ ] Read current snapshot schema and migration conventions.
- [ ] Decide whether to add `st_jt_ratio` or retain legacy `jt_st_ratio` storage with code/API mapping; record in `decisions.md`.
- [ ] Add `chain_id`, `block_hash`, `source_tx_hash`, `source_log_index`.
- [ ] Add unique `(chain_id, market_address, source_tx_hash, source_log_index)`.
- [ ] Preserve non-null `yt_price`; plan carry-forward in projector.
- [ ] Generate and inspect migration.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm db:generate` — expected: migration generated and manually inspected.

## Slice 2 — snapshot projector

**Goal:** Create snapshots from NAV-bearing events with correct price carry-forward.

**Files:**
- Create: `backend/src/modules/chain-projector/market-snapshot.projector.ts`
- Create: `backend/src/modules/chain-projector/market-snapshot.projector.spec.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.module.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`

**Steps:**
- [ ] Write failing tests for `PriceUpdated`, `DepositYT`, `WithdrawYT`, `DepositSettled` snapshot creation.
- [ ] Write failing tests for price carry-forward from latest prior snapshot.
- [ ] Write failing test that older replay does not use future price.
- [ ] Write failing test for no prior price using live `latestYtPrice` fallback.
- [ ] Implement projector with idempotent source identity.
- [ ] Wire projector into `ChainProjectorService` after raw event insert.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/chain-projector/market-snapshot.projector.spec.ts src/modules/chain-projector/chain-projector.service.spec.ts` — expected: pass.

## Slice 3 — price update projector

**Goal:** Persist `PriceUpdated` facts into `price_updates` idempotently.

**Files:**
- Create: `backend/src/modules/chain-projector/price-update.projector.ts`
- Create: `backend/src/modules/chain-projector/price-update.projector.spec.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify if needed: `backend/src/shared/database/schema/price-updates.ts`
- Generate migration if schema changes

**Steps:**
- [ ] Write failing tests for `PriceUpdated` insert, semantic `stJtRatioAfter`, and duplicate replay behavior.
- [ ] Add unique `(market_address, tx_hash, log_index)` if schema needs it.
- [ ] Implement projector mapping fields from plan.
- [ ] Wire into `ChainProjectorService`.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/chain-projector/price-update.projector.spec.ts src/modules/chain-projector/chain-projector.service.spec.ts` — expected: pass.

## Slice 4 — `/markets/:address/history`

**Goal:** Serve paginated indexed snapshots through market-state API.

**Files:**
- Modify: `backend/src/modules/market-state/market-state.controller.ts`
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Modify: `backend/src/modules/market-state/dto/market-swagger.dto.ts`
- Modify: `backend/src/modules/market-state/market-state.service.spec.ts`
- Assess/update: `docs/canonical/api-contract.md`

**Steps:**
- [ ] Write failing test for paginated indexed snapshots.
- [ ] Write failing test for invalid market address `NotFoundException` matching current pattern.
- [ ] Implement `GET /markets/:address/history?limit=100&cursor=0`.
- [ ] Return `dataQuality.sources.history = indexed_events`.
- [ ] Update Swagger DTOs.
- [ ] Update canonical API docs if response semantics change from current doc.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/market-state` — expected: pass.

## Slice 5 — indexed chart metrics

**Goal:** Replace chart mock/config data for snapshot-backed metrics.

**Files:**
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Modify: `backend/src/modules/market-state/market-state.service.spec.ts`
- Assess/update: `docs/canonical/api-contract.md`

**Steps:**
- [ ] Write failing tests for `tvl`, `tokenPrice`, and `ratio` reading snapshots.
- [ ] Write failing tests that `yield` and `utilization` keep current mock/config behavior.
- [ ] Write failing test that no snapshots returns empty indexed series, not silent mock.
- [ ] Implement mapping: `tvl -> nav`, `tokenPrice -> ytPrice`, `ratio -> stJtRatio`.
- [ ] Update canonical docs if source semantics changed.
- [ ] Run targeted tests.
- [ ] Update tracker to Epic 3, Slice 1.
- [ ] Write session log.

**Verification:**
- `pnpm test src/modules/market-state` — expected: pass.
