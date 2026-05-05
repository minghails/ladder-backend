# Tracker — Backend FE Wagmi Trade Support

## Active

- Epic: Complete
- Slice: Complete
- Session kickoff: `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md`
- Latest session: `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-epic-4-docs-smoke.md`

## Active plan

- `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`

## Planned

1. Epic 1 — Correct and complete quote/preflight support
2. Epic 2 — Complete trade constraints for FE forms
3. Epic 3 — Add tx status endpoint backed by indexed events
4. Epic 4 — Docs, integration checklist, and demo smoke

## In Progress

- None.

## Next Up

1. Archive or merge the completed initiative.
2. Share FE API impact summary with frontend implementer.
3. Keep `PROJECTOR_BATCH_SIZE=10` for Alchemy free-tier demo smoke unless RPC tier changes.

## Done

- Initiative docs generated from plan.
- Epics and bounded slices generated from plan scope.
- Epic 1 Slice 1 — Direct YT deposit quote.
- Epic 1 Slice 2 — Correct withdraw quote.
- Epic 1 Slice 3 — Upgrade base instant quote hints.
- Epic 1 — Correct and complete quote/preflight support.
- Epic 2 — Complete trade constraints for FE forms.
- Epic 3 — Add tx status endpoint backed by indexed events.
- Epic 4 — Docs, integration checklist, and demo smoke.
- Backend FE wagmi trade support initiative implementation complete.

## Blocked

- None.

## Risks

- Exact `depositInstant` output may require adaptor quote not currently available; label source honestly.
- Direct YT deposit/withdraw use stale `latestYtPrice`; keep warnings.
- Projector lag can keep tx status `not_indexed` after wallet success.
- Backend quote is preflight only; chain can still revert before mining.

## Needs Decision

- Include ordered args array only if FE requests it.

## Recently Updated

- 2026-05-05: Epic 4 completed. Added FE wagmi demo smoke checklist to canonical API docs, FE wagmi transaction boundary rules to integration rules, doc coverage test, full backend verification, Docker DB migration smoke, and API smoke. API impact: `No FE-facing API impact` for this slice; end-of-initiative impact remains `API contract change` from Epics 1-3. Architecture docs checked; no update needed. Next: archive/merge completed initiative.
- 2026-05-05: Epic 3 completed. Added `GET /tx/:hash` backed by indexed `market_events`, normalized hash lookup, Swagger docs, API contract docs, and architecture docs. API impact: `API contract change`. Next: Epic 4 docs, integration checklist, and demo smoke.
- 2026-05-05: Epic 2 completed. Expanded `GET /markets/:address/trade-constraints` with YT token metadata, approval targets, method names, YT capacity aliases, and raw ratio fields. API impact: `API contract change`. Architecture docs checked; no update needed. Next: Epic 3 tx status endpoint.
- 2026-05-05: Epic 1 completed. Added direct YT deposit quote, corrected withdraw quote to Market `withdraw`, upgraded base instant quote hints, updated tests/DTOs/API docs. API impact: `API contract change`. Architecture docs checked; no update needed. Next: Epic 2 trade constraints.
- 2026-05-05: Epic 1 Slice 1 completed. Added `POST /quotes/deposit-yt`, direct YT quote math, action/approval hints, service tests, Swagger DTOs, and API contract docs. API impact: `API contract change`. Architecture docs checked; no update needed. Next: Epic 1 Slice 2.
- 2026-05-05: Initiative activated for implementation docs only; no code changed.
