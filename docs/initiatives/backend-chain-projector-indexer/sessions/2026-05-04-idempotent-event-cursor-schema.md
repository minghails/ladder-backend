# Session — idempotent event and cursor schema

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-01-minimum-working-projector.md`
- Slice: Slice 2 — idempotent event and cursor schema

## Files changed

- `backend/src/shared/database/schema/market-events.ts`
- `backend/src/shared/database/schema/projector-cursors.ts`
- `backend/src/shared/database/schema/projector-schema.spec.ts`
- `backend/src/shared/database/migrations/0001_fluffy_winter_soldier.sql`
- `backend/src/shared/database/migrations/meta/_journal.json`
- `backend/src/shared/database/migrations/meta/0001_snapshot.json`
- `docs/canonical/backend-architecture.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-idempotent-event-cursor-schema.md`

## Tests added/changed

- Added `backend/src/shared/database/schema/projector-schema.spec.ts`.

The schema tests assert:

- `market_events` has `chain_id`, `block_hash`, and `block_timestamp` as non-null columns.
- `market_events` has unique `(chain_id, market_address, tx_hash, log_index)` identity.
- `projector_cursors` has non-null `chain_id` and `market_address`.
- `projector_cursors.last_block_hash` remains nullable.

## Verification run

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts
```

Result: RED first — failed because the new columns and unique constraint did not exist.

```bash
pnpm db:generate
```

Result: pass — generated `0001_fluffy_winter_soldier.sql`.

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts src/shared/config/env.validation.spec.ts
```

Result: pass — 10 tests passed.

```bash
pnpm lint
```

Result: pass.

```bash
pnpm build
```

Result: pass.

## Decisions made

- Added a focused schema unit test because no existing schema unit test pattern existed.
- Used Drizzle composite unique constraint name `market_events_chain_market_tx_log_unique`.
- Preserved cursor block number and log index as text.
- Kept `last_block_hash` nullable.
- Added a migration stop condition for non-empty `market_events` or `projector_cursors` instead of fabricating historical `block_hash`, `block_timestamp`, `chain_id`, or `market_address` values.

## API impact for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Before: No public/admin endpoint contract changed.
- After: No public/admin endpoint contract changed; backend persistence identity changed only.
- FE action needed: none
- API docs updated: no

## Architecture/docs check

- Updated `docs/canonical/backend-architecture.md`.
- Rationale: DB schema/projection identity changed for projector idempotency and cursor safety.
- No `docs/canonical/api-contract.md` update needed because no endpoint, request, response, auth, or error behavior changed.

## Risks / blockers

- Applying the migration to a DB with existing `market_events` or `projector_cursors` rows will stop with a clear error. Reset dev DB or backfill chain/block identity before applying.
- `pnpm db:migrate` was not run because no `DATABASE_URL` is present in the shell environment.

## Tracker update

- Marked Epic 1, Slice 2 complete.
- Advanced active slice to Epic 1, Slice 3 — market bootstrap and projector types.

## Next step

- Implement Epic 1, Slice 3 — market bootstrap and projector types.
