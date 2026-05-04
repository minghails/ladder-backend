# Session — Epic 2 market snapshots and history APIs

## Active scope

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-02-market-snapshots-history-apis.md`
- Slices completed:
  - Slice 2 — snapshot projector
  - Slice 3 — price update projector
  - Slice 4 — `/markets/:address/history`
  - Slice 5 — indexed chart metrics

Slice 1 was already completed in `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-snapshot-schema.md`.

## Files changed

- `backend/src/modules/chain-projector/market-snapshot.projector.ts`
- `backend/src/modules/chain-projector/market-snapshot.projector.spec.ts`
- `backend/src/modules/chain-projector/price-update.projector.ts`
- `backend/src/modules/chain-projector/price-update.projector.spec.ts`
- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/modules/chain-projector/chain-projector.module.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/modules/market-state/market-state.service.spec.ts`
- `backend/src/modules/market-state/market-state.controller.ts`
- `backend/src/modules/market-state/market-state.module.ts`
- `backend/src/modules/market-state/dto/market-swagger.dto.ts`
- `backend/src/shared/database/schema/price-updates.ts`
- `backend/src/shared/database/schema/projector-schema.spec.ts`
- `backend/src/shared/database/migrations/0003_silly_mandroid.sql`
- `backend/src/shared/database/migrations/meta/0003_snapshot.json`
- `backend/src/shared/database/migrations/meta/_journal.json`
- `backend/src/swagger.fe-api.spec.ts`
- `backend/docs/initiatives/backend-chain-projector-indexer/decisions.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-epic-02-complete.md`
- `docs/canonical/api-contract.md`
- `docs/canonical/backend-architecture.md`

## Tests added/changed

- Added `market-snapshot.projector.spec.ts`.
- Added `price-update.projector.spec.ts`.
- Extended `chain-projector.service.spec.ts`.
- Extended `market-state.service.spec.ts`.
- Extended `projector-schema.spec.ts`.
- Extended `swagger.fe-api.spec.ts`.

The tests assert:

- `PriceUpdated`, `DepositYT`, `WithdrawYT`, and `DepositSettled` create market snapshots.
- Non-price NAV events carry forward prior price.
- Older replay does not carry forward future price.
- No prior price uses live `latestYtPrice` fallback.
- Price updates persist with semantic ST/JT ratio mapping and idempotent replay.
- `runOnce()` invokes snapshot and price update projectors before cursor advance.
- `/markets/:address/history` returns paginated indexed snapshots and invalid markets throw `NotFoundException`.
- `tvl`, `tokenPrice`, and `ratio` charts read snapshots; `yield` and `utilization` remain mock-backed.
- Indexed chart metrics return empty series when no snapshots exist.

## Verification run

```bash
pnpm test src/modules/chain-projector/market-snapshot.projector.spec.ts
```

Result: RED first — failed because `market-snapshot.projector.ts` did not exist.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: RED first — failed because `runOnce()` did not call snapshot/price projectors.

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts src/modules/chain-projector/price-update.projector.spec.ts
```

Result: RED first — failed because `price-update.projector.ts` did not exist and `price_updates` lacked source identity.

```bash
pnpm test src/modules/market-state/market-state.service.spec.ts
```

Result: RED first — failed because `getHistory()` did not exist, then failed because indexed chart metrics still returned mock data.

```bash
pnpm test src/modules/chain-projector/market-snapshot.projector.spec.ts src/modules/chain-projector/price-update.projector.spec.ts src/modules/chain-projector/chain-projector.service.spec.ts src/modules/market-state/market-state.service.spec.ts src/shared/database/schema/projector-schema.spec.ts src/swagger.fe-api.spec.ts
```

Result: pass — 47 tests passed.

```bash
pnpm db:generate
```

Result: pass — generated `0003_silly_mandroid.sql`, then no pending schema changes after inspection/update.

```bash
pnpm lint
```

Result: pass.

```bash
pnpm build
```

Result: pass.

## Decisions made

- Snapshot projection writes only NAV-bearing events: `PriceUpdated`, `DepositYT`, `WithdrawYT`, `DepositSettled`.
- Non-price snapshot events use latest prior snapshot price at or before the event identity; future snapshot rows are ignored during older replay.
- When no prior price exists, snapshot projector uses live `latestYtPrice` and live `halted` as explicit bootstrap fallback.
- `price_updates` keeps legacy `jt_st_ratio_after` storage but projector maps semantic `stJtRatioAfter` into it.
- `tvl`, `tokenPrice`, and `ratio` chart metrics are indexed from `market_snapshots`.
- `yield` and `utilization` remain mock-backed.

## API impact for FE

- Slice 2: `No FE-facing API impact`.
- Slice 3: `No FE-facing API impact`.
- Slice 4: `API contract change`.
  - New implemented endpoint: `GET /markets/:address/history?limit=100&cursor=0`.
  - Response includes `market`, `items[]`, `page`, and `dataQuality.sources.history = "indexed_events"`.
  - Each history item exposes semantic `stJtRatio`.
  - Canonical docs updated: `docs/canonical/api-contract.md`.
- Slice 5: `API data-source/behavior change`.
  - Existing chart endpoint path and response shape stay stable.
  - `tvl`, `tokenPrice`, and `ratio` chart metrics now return `source = "indexed_events"`.
  - Empty indexed series is possible when snapshots are absent.
  - `yield` and `utilization` remain `mock`.
  - FE action needed: review empty-state handling for indexed chart metrics.

## Epic 2 API impact summary for FE

- Endpoint added/implemented: `GET /markets/:address/history?limit&cursor`.
- Endpoint behavior changed: `GET /markets/:address/charts` for `tvl`, `tokenPrice`, and `ratio` now uses indexed snapshots.
- Docs updated: `docs/canonical/api-contract.md`.
- Open FE follow-up: handle empty indexed chart series; optionally wire history view to the new endpoint.

## Architecture/docs check

- Architecture docs updated: `docs/canonical/backend-architecture.md`.
- Rationale: schema/projection model changed for idempotent `price_updates`; snapshots were already updated in Slice 1.
- `backend/docs/architecture.md` checked; no update needed because module boundaries and dependency graph remain inside existing modules.

## Risks / blockers

- Existing `market_snapshots` rows stop migration `0002_productive_juggernaut.sql` until reset/backfill.
- Existing `price_updates` rows stop migration `0003_silly_mandroid.sql` until reset/backfill.
- Production-like replay still needs exact Market `DEPLOYMENT_BLOCK`.
- Snapshot fallback to live `latestYtPrice` is only for bootstrap gaps; accurate historical price depends on replaying `PriceUpdated` before non-price NAV events.

## Tracker update

- Marked Epic 2 complete.
- Advanced active slice to Epic 3, Slice 1 — deposit request schema.

## Next step

- Implement Epic 3, Slice 1 — deposit request schema.
