# Session — deposit request detail endpoint

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- Slice: Slice 3 — deposit request detail endpoint

## Files changed

- `backend/src/modules/deposit-requests/deposit-requests.service.ts`
- `backend/src/modules/deposit-requests/deposit-requests.controller.ts`
- `backend/src/modules/deposit-requests/deposit-requests.module.ts`
- `backend/src/modules/deposit-requests/deposit-requests.service.spec.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-deposit-request-detail-endpoint.md`

## Tests added/changed

- Extended `backend/src/modules/deposit-requests/deposit-requests.service.spec.ts`.

Coverage added:

- `getRequest(id)` returns indexed request detail with `dataQuality.sources.request = indexed_events`.
- Missing request throws `NotFoundException`.

## Verification run

```bash
pnpm test src/modules/deposit-requests
```

Result: RED first — failed because `service.getRequest` was missing.

```bash
pnpm test src/modules/deposit-requests
```

Result: pass — 3 tests passed.

## Decisions made

- `POST /deposit-requests` remains deferred; no backend write-side registration added.
- `GET /deposit-requests/:id` uses event-projected `deposit_requests` rows as source of truth.
- Response includes lifecycle tx hashes/timestamps and `adaptorRequestId` when linked.

## API impact for FE

- Classification: `API contract change`
- Endpoint added/concretized: `GET /deposit-requests/:id`
- Before: API docs listed request detail conceptually; service/controller did not expose concrete behavior.
- After: `GET /deposit-requests/:id` returns indexed event-derived detail with `dataQuality.sources.request = indexed_events`; missing rows return 404.
- `POST /deposit-requests` is documented as deferred.
- FE action needed: wire detail call only if async request detail UI is in scope; handle 404 and indexed source label.
- API docs updated: `docs/canonical/api-contract.md`

## Architecture/docs check

- `docs/canonical/api-contract.md` updated because endpoint/response behavior changed.
- `docs/canonical/backend-architecture.md` checked; no update needed because module boundary and data ownership match existing documented architecture.
- `backend/docs/architecture.md` checked; no update needed because dependency graph did not change beyond existing `deposit-requests -> shared/database` edge.

## Risks / blockers

- Request detail only exists after projector indexes `DepositRequested`.
- Production-like replay still needs exact Market `DEPLOYMENT_BLOCK`.

## Tracker update

- Marked Epic 3, Slice 3 complete.
- Advanced active slice to Epic 3, Slice 4 — portfolio request mapping check.

## Next step

- Implement Epic 3, Slice 4 — portfolio request mapping check.
