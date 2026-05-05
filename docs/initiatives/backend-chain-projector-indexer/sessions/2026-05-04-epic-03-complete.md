# Session — Epic 3 complete

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- Slice: Slice 4 — portfolio request mapping check

## Files changed

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/portfolio/dto/portfolio-swagger.dto.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-03-async-deposit-request-lifecycle.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-epic-03-complete.md`

## Tests added/changed

- Extended `backend/src/modules/portfolio/portfolio.service.spec.ts` to cover `adaptorRequestId` on DB-backed portfolio request rows.

## Verification run

```bash
pnpm test src/modules/portfolio
```

Result: pass — 9 tests passed.

## Decisions made

- Added nullable `adaptorRequestId` to portfolio request rows because projected rows now store adaptor/underlying request IDs.
- Kept mock rows with `adaptorRequestId: null`.
- Did not add activity derivation; optional Epic 4 remains deferred unless explicitly requested.

## API impact for FE

- Classification: `API contract change`
- Endpoint shapes affected: `/portfolio/:address` `pendingRequests[]`; `/portfolio/:address/requests` `requests[]`.
- Before: portfolio request rows had `ladderRequestId` but no `adaptorRequestId`.
- After: portfolio request rows include nullable `adaptorRequestId`; populated after `DepositRequestLinked`, null before link or for mock rows.
- FE action needed: tolerate nullable `adaptorRequestId`; optionally display/link adaptor request when non-null.
- API docs updated: `docs/canonical/api-contract.md`

## Epic 3 API impact summary for FE

- `GET /deposit-requests/:id` now returns indexed async request detail with lifecycle fields and `dataQuality.sources.request = indexed_events`.
- Missing `GET /deposit-requests/:id` rows return 404.
- `POST /deposit-requests` remains deferred; no signer/admin write orchestration added.
- `/portfolio/:address` pending request previews and `/portfolio/:address/requests` rows now include nullable `adaptorRequestId`.
- FE follow-up: handle request detail 404, indexed source labels, nullable `adaptorRequestId`, and deferred POST flow.

## Architecture/docs check

- `docs/canonical/api-contract.md` updated because endpoint/response shapes changed.
- `docs/canonical/backend-architecture.md` checked; no update needed because architecture already documents async lifecycle projection and portfolio request views.
- `backend/docs/architecture.md` checked; no update needed because dependency graph did not change.

## Risks / blockers

- Production-like replay still needs exact Market `DEPLOYMENT_BLOCK`.
- Request detail and portfolio adaptor links appear only after projector indexes relevant events.
- Optional user activity derivation remains deferred.

## Tracker update

- Marked Epic 3 complete.
- Deferred optional Epic 4 activities unless explicitly requested.
- Advanced active slice to Epic 5, Slice 1 — projector runbook.

## Next step

- Start Epic 5, Slice 1 — projector runbook.
