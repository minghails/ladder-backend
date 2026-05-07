# Session 2026-05-07 - Production Earnings History

## Scope

Implement Epic 4 Slice 3 — production earnings/history from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-portfolio-read-models.md`.

## Work completed

- Removed sandbox mock fallback from `GET /portfolio/:address/earnings`.
- Kept earnings table from portfolio cost-basis rows plus live positions.
- Added earnings history from real `portfolio_cashflows` rows only.
- Returned empty `history.series`, `historyAvailable=false`, and `source="unavailable"` when no real cashflow history exists.
- Marked history source as `indexed_events` for full cost-basis coverage and `partial_indexed_events` when cost-basis rows are partial.
- Updated Swagger descriptions and FE Swagger tests from chart/mock wording to history/indexed-cashflow wording.

## Files changed

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/portfolio/portfolio.controller.ts`
- `backend/src/modules/portfolio/dto/portfolio-swagger.dto.ts`
- `backend/src/swagger.fe-api.spec.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-production-earnings-history.md`

## Docs changed

- `docs/canonical/api-contract.md`: documented earnings/history source behavior and that `includeMock` is ignored for earnings/history.
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Slice 3 complete and Slice 4 active.
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`: updated next-agent prompt to production claimables, requests, activities.

## API impact for FE

API data-source/behavior change. `GET /portfolio/:address/earnings` no longer returns mock earnings or mock history when sandbox mock fallback is enabled. Endpoint shape is unchanged. History can now contain indexed cashflow series with `indexed_events` or `partial_indexed_events`; otherwise it returns an empty series with `unavailable`. FE action needed: update sandbox fixtures/empty-state assumptions and history source-label expectations; no parser change required.

## Verification run

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — failed before implementation for mock earnings/history and missing cashflow history; passed after implementation.
- `pnpm test -- portfolio` — initially failed on Swagger wording after API behavior update, then passed after Swagger docs/tests were updated.
- `pnpm test -- portfolio src/swagger.fe-api.spec.ts` — passed with existing DepositRequestProjector warning logs.
- `pnpm lint` — passed.
- `pnpm build` — passed.

## Architecture docs checked

Architecture docs checked; no update needed. `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` already describe Portfolio as event-derived portfolio accounting projections backed by `portfolio_cashflows` and `portfolio_cost_basis`; no module boundary, dependency graph, runtime flow, infrastructure, data ownership, schema, or projection model changed.

## Remaining risks

- Claimables, requests, and activities split endpoints can still use sandbox mock fallback; Slice 4 will remove remaining mock/default rows there.
- Earnings history currently aggregates indexed cashflow `valueDelta` by tranche/date; no dedicated earnings snapshot table exists yet.

## Next step

Start Portfolio Slice 4 — production claimables, requests, activities.
