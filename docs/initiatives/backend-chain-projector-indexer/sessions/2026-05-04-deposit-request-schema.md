# Session — deposit request schema

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- Slice: Slice 1 — deposit request schema

## Files changed

- `backend/src/shared/database/schema/deposit-requests.ts`
- `backend/src/shared/database/schema/projector-schema.spec.ts`
- `backend/src/shared/database/migrations/0004_previous_ikaris.sql`
- `backend/src/shared/database/migrations/meta/0004_snapshot.json`
- `backend/src/shared/database/migrations/meta/_journal.json`
- `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-deposit-request-schema.md`
- `docs/canonical/backend-architecture.md`

## Tests added/changed

- Extended `backend/src/shared/database/schema/projector-schema.spec.ts`.

The test asserts nullable projection fields on `deposit_requests`:

- `adaptor_request_id`
- `pulled_tx_hash`
- `linked_tx_hash`
- `settled_tx_hash`
- `rejected_tx_hash`
- `refunded_tx_hash`
- `settled_at`
- `rejected_at`
- `refunded_at`

## Verification run

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts
```

Result: RED first — failed because `deposit_requests.adaptor_request_id` was missing.

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts
```

Result: pass — 5 tests passed.

```bash
pnpm db:generate
```

Result: pass — generated `0004_previous_ikaris.sql`.

```bash
pnpm db:generate
```

Result: pass — no schema changes after migration generation.

```bash
pnpm lint
```

Result: pass.

```bash
pnpm build
```

Result: pass.

## Decisions made

- Added nullable lifecycle columns only, so existing `deposit_requests` rows remain valid.
- Added `adaptor_request_id` because `DepositRequestLinked` projection needs it.
- Added lifecycle transaction hash columns and terminal timestamps for pulled, linked, settled, rejected, and refunded event projection.
- Did not add optional settlement value columns (`yt_in`, `shares_minted`, `deposit_value`) because current slice has no endpoint or FE requirement for them.

## API impact for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Before: No endpoint contract changed.
- After: No endpoint contract changed; backend schema and migration only.
- FE action needed: none
- API docs updated: no

## Architecture/docs check

- Architecture docs updated: `docs/canonical/backend-architecture.md`.
- Rationale: DB schema/projection model changed by adding event-derived async deposit request lifecycle fields.
- `backend/docs/architecture.md` checked; no update needed because module boundaries and dependency graph did not change.

## Risks / blockers

- Settlement value columns remain deferred; Slice 2 should either omit those fields or add a new schema slice if endpoint/FE requirements need them.
- Production-like replay still needs the exact Market `DEPLOYMENT_BLOCK`.

## Tracker update

- Marked Epic 3, Slice 1 complete.
- Advanced active slice to Epic 3, Slice 2 — deposit request projector.

## Next step

- Implement Epic 3, Slice 2 — deposit request projector.
