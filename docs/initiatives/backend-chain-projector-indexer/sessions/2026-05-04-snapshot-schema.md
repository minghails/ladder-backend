# Session — snapshot schema

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-02-market-snapshots-history-apis.md`
- Slice: Slice 1 — snapshot schema

## Files changed

- `backend/src/shared/database/schema/market-snapshots.ts`
- `backend/src/shared/database/schema/projector-schema.spec.ts`
- `backend/src/shared/database/migrations/0002_productive_juggernaut.sql`
- `backend/src/shared/database/migrations/meta/0002_snapshot.json`
- `backend/src/shared/database/migrations/meta/_journal.json`
- `backend/docs/initiatives/backend-chain-projector-indexer/decisions.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-snapshot-schema.md`
- `docs/canonical/backend-architecture.md`

## Tests added/changed

- Extended `backend/src/shared/database/schema/projector-schema.spec.ts`.

The test asserts:

- `market_snapshots.chain_id` is non-null
- `market_snapshots.block_hash` is non-null
- `market_snapshots.source_tx_hash` is non-null
- `market_snapshots.source_log_index` is non-null
- `market_snapshots.yt_price` remains non-null
- legacy `market_snapshots.jt_st_ratio` remains non-null
- snapshots are unique by `(chain_id, market_address, source_tx_hash, source_log_index)`

## Verification run

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts
```

Result: RED first — failed because `market_snapshots.chain_id` was missing.

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts
```

Result: pass — 3 tests passed.

```bash
pnpm db:generate
```

Result: pass — generated `0002_productive_juggernaut.sql`.

```bash
pnpm db:generate
```

Result: pass — no schema changes after manual migration inspection/update.

```bash
pnpm lint
```

Result: pass.

```bash
pnpm build
```

Result: pass.

## Decisions made

- Kept legacy `market_snapshots.jt_st_ratio` storage to avoid a ratio-column rename in the same schema slice.
- Code/API slices must expose semantic `stJtRatio`.
- Kept `market_snapshots.yt_price` non-null; the next projector slice must carry forward price for non-price events.
- Added deterministic snapshot source identity from the originating event: `chain_id`, `market_address`, `source_tx_hash`, and `source_log_index`.
- Added migration stop condition when `market_snapshots` already has rows, requiring reset or explicit backfill before adding non-null identity columns.

## API impact for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Before: No endpoint contract changed.
- After: No endpoint contract changed; backend schema and migration only.
- FE action needed: none
- API docs updated: no

## Architecture/docs check

- Architecture docs updated: `docs/canonical/backend-architecture.md`.
- Rationale: DB schema/projection model changed by adding replay-safe source identity to `market_snapshots`.
- `backend/docs/architecture.md` checked; no update needed because module boundaries and dependency graph did not change.

## Risks / blockers

- Existing `market_snapshots` rows cause the new migration to stop until the table is reset or source identity is backfilled.
- Snapshot projector must use block timestamps from indexed events and carry forward `yt_price` for non-price NAV events.
- Production-like replay still needs the exact Market `DEPLOYMENT_BLOCK`.

## Tracker update

- Marked Epic 2, Slice 1 complete.
- Advanced active slice to Epic 2, Slice 2 — snapshot projector.

## Next step

- Implement Epic 2, Slice 2 — snapshot projector.
