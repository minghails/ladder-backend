# Session — deposit request projector

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- Slice: Slice 2 — deposit request projector

## Files changed

- `backend/src/modules/chain-projector/deposit-request.projector.ts`
- `backend/src/modules/chain-projector/deposit-request.projector.spec.ts`
- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/modules/chain-projector/chain-projector.module.ts`
- `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-deposit-request-projector.md`

## Tests added/changed

- Added `backend/src/modules/chain-projector/deposit-request.projector.spec.ts`.
- Extended `backend/src/modules/chain-projector/chain-projector.service.spec.ts` for `DepositRequestProjector` wiring.

Coverage added:

- `DepositRequested` upserts request rows idempotently.
- `DepositBasePulled` updates status to `pulled`.
- `DepositRequestLinked` stores `adaptorRequestId` and updates status to `linked`.
- `DepositSettled` updates status to `settled` and sets `settledAt` from block timestamp.
- `DepositRejected` stores `reasonCode`, rejected tx, and rejected timestamp.
- `DepositRefunded` updates status to `refunded` and sets refunded timestamp.
- Out-of-order lifecycle updates log warning and continue without crash.
- `ChainProjectorService.runOnce()` invokes deposit request projector before cursor advance.

## Verification run

```bash
pnpm test src/modules/chain-projector/deposit-request.projector.spec.ts
```

Result: RED first — failed because `./deposit-request.projector` did not exist.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: RED first for service wiring — failed because `DepositRequestProjector.projectEvents` was not called.

```bash
pnpm test src/modules/chain-projector/deposit-request.projector.spec.ts src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: pass — 20 tests passed.

```bash
pnpm lint
```

Result: pass.

```bash
pnpm build
```

Result: pass — TSC found 0 issues; SWC compiled 89 files.

## Decisions made

- Used event-derived lifecycle state only; no signer/admin write orchestration added.
- Used existing `deposit_requests` schema fields from Slice 1.
- Did not add settlement value fields because columns do not exist and current slice scope says only use them if columns exist.
- Out-of-order lifecycle events do not create placeholder rows; they log warning and continue.

## API impact for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Before: No endpoint exposed this projected lifecycle in this slice.
- After: No endpoint contract changed; backend projector now populates existing table fields for future reads.
- FE action needed: none
- API docs updated: no

## Architecture/docs check

- Architecture docs checked; no update needed.
- Rationale: Module boundary, dependency graph, runtime flow, infrastructure, API, schema, and event-facing semantics already documented by prior Epic 3 Slice 1 architecture update and plan/tracker scope.

## Risks / blockers

- Production-like replay still needs exact Market `DEPLOYMENT_BLOCK`.
- Out-of-order lifecycle event handling depends on replay eventually seeing `DepositRequested`; no placeholder/backfill logic added.
- Request detail endpoint remains unimplemented until Slice 3.

## Tracker update

- Marked Epic 3, Slice 2 complete.
- Advanced active slice to Epic 3, Slice 3 — deposit request detail endpoint.

## Next step

- Implement Epic 3, Slice 3 — deposit request detail endpoint.
