# Session — optional background loop and README baseline

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-01-minimum-working-projector.md`
- Slice: Slice 6 — optional background loop and README baseline

## Files changed

- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/modules/chain-projector/README.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-background-loop-readme.md`

## Tests added/changed

- Extended `backend/src/modules/chain-projector/chain-projector.service.spec.ts`.

The tests assert:

- background loop does not start when `PROJECTOR_ENABLED=false`
- background loop runs immediately and then on interval when `PROJECTOR_ENABLED=true`

## Verification run

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: RED first — failed because lifecycle methods did not exist.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: pass — 10 tests passed.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts src/modules/chain-projector/projector-events.spec.ts src/shared/blockchain/viem-client.service.spec.ts src/shared/database/schema/projector-schema.spec.ts src/shared/config/env.validation.spec.ts
```

Result: pass — 26 tests passed.

```bash
pnpm lint
```

Result: pass.

```bash
pnpm build
```

Result: pass.

## Decisions made

- Background indexing only starts when `projector.enabled` is true.
- `runOnce()` runs immediately at application bootstrap when enabled.
- Interval runs use `projector.pollIntervalMs`.
- `isRunning` prevents overlapping projector batches.
- `onApplicationShutdown()` clears the interval.
- README documents env setup, migration/replay controls, DB checks, API checks for later slices, and stop conditions.

## API impact for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Before: No endpoint contract changed.
- After: No endpoint contract changed; backend runtime/background behavior and docs changed only.
- FE action needed: none
- API docs updated: no

## Epic 1 API impact summary for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Contract changes: none
- Data-source/behavior changes visible to FE: none yet
- Backend-only changes: projector env config, idempotent event/cursor schema, market bootstrap, event arg normalization, `runOnce()` raw event indexing, optional background loop, README baseline
- FE action needed: none
- API docs updated: no

## Architecture/docs check

- Architecture docs checked; no update needed.
- Rationale: background indexing is already part of the Chain Projector MVP architecture and remains inside the existing NestJS modular monolith with no new infrastructure.

## Risks / blockers

- Real replay still needs exact `DEPLOYMENT_BLOCK`.
- Migration stops if legacy projector rows exist and need reset/backfill.
- Reorg handling remains confirmation-based only.
- Snapshots, price update projection, and request lifecycle are still pending in later epics.

## Tracker update

- Marked Epic 1 complete.
- Advanced active slice to Epic 2, Slice 1 — snapshot schema.

## Next step

- Implement Epic 2, Slice 1 — snapshot schema.
