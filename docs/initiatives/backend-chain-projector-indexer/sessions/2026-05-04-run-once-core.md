# Session — runOnce fetch/decode/persist/cursor core

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-01-minimum-working-projector.md`
- Slice: Slice 5 — `runOnce()` fetch/decode/persist/cursor core

## Files changed

- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-run-once-core.md`

## Tests added/changed

- Extended `backend/src/modules/chain-projector/chain-projector.service.spec.ts`.

The tests assert:

- no cursor starts from `DEPLOYMENT_BLOCK`
- safe head below deployment block returns no-op
- batch size caps `toBlock`
- duplicate raw logs use idempotent event insert
- cursor is not advanced when event insert fails

## Verification run

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: RED first — failed because batch/cursor/log behavior did not exist.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: pass — 8 tests passed.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts src/modules/chain-projector/projector-events.spec.ts src/shared/blockchain/viem-client.service.spec.ts src/shared/database/schema/projector-schema.spec.ts src/shared/config/env.validation.spec.ts
```

Result: pass — 24 tests passed.

```bash
pnpm lint
```

Result: pass after tightening type-safe test assertions.

```bash
pnpm build
```

Result: pass.

## Decisions made

- `runOnce()` returns the plan summary shape.
- Cursor ID format is `market:<chainId>:<marketAddressLowercase>`.
- `safeToBlock = head - confirmations`; if `fromBlock > safeToBlock`, `runOnce()` returns no-op and does not bootstrap or fetch logs.
- Event rows are inserted in one batch with `onConflictDoNothing`.
- Cursor upsert happens only after event insert succeeds.
- Unknown, incomplete, or undecodable logs are skipped.

## API impact for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Before: No endpoint contract changed.
- After: No endpoint contract changed; backend indexing internals changed only.
- FE action needed: none
- API docs updated: no

## Architecture/docs check

- Architecture docs checked; no update needed.
- Rationale: implemented behavior matches existing Chain Projector architecture and previously updated projector identity/cursor docs.

## Risks / blockers

- Reorg handling is still confirmation-based only.
- `last_block_hash` remains available in schema but is not populated by this slice.
- Production-like replay still needs the exact deployment block.

## Tracker update

- Marked Epic 1, Slice 5 complete.
- Advanced active slice to Epic 1, Slice 6 — optional background loop and README baseline.

## Next step

- Implement Epic 1, Slice 6 — optional background loop and README baseline.
