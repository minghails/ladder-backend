# Session 2026-05-08 - Production Claimables Requests Activities

## Scope

Implement Epic 4 Slice 4 — production claimables, requests, activities from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-portfolio-read-models.md`.

## Work completed

- Removed remaining sandbox mock fallback from `GET /portfolio/:address/requests`.
- Removed remaining sandbox mock fallback from `GET /portfolio/:address/claimables`.
- Removed remaining sandbox mock fallback from `GET /portfolio/:address/activities`.
- Kept claimables from rejected, unrefunded async deposit requests exposed through the claimables repository only.
- Kept requests from indexed `deposit_requests` rows only.
- Kept activities from indexed `market_events` mapped by `PortfolioActivityRepository` only.
- Added/updated pagination and `includeMock=true` tests proving empty real rows stay empty and real DB/indexed rows paginate without mock rows.
- Updated Swagger and canonical API wording to say portfolio production endpoints ignore `includeMock`.
- Added Epic 4 API impact summary to tracker.

## Files changed

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/portfolio/portfolio.controller.ts`
- `backend/src/modules/portfolio/dto/portfolio-swagger.dto.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-08-production-claimables-requests-activities.md`

## Docs changed

- `docs/canonical/api-contract.md`: documented that claimables, requests, and activities ignore `includeMock` and return real rows or empty pages only.
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Epic 4 Slice 4 complete, Epic 4 complete, Epic 5 Slice 1 active, and added Epic 4 API impact summary.
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`: updated next-agent prompt to production endpoint audit tests.

## API impact for FE

API data-source/behavior change. `GET /portfolio/:address/claimables`, `/requests`, and `/activities` no longer return mock rows when `includeMock=true` and sandbox fallback is enabled. Endpoint shapes are unchanged. FE action needed: update sandbox fixtures and empty-page handling; no parser change required.

## Verification run

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — failed before implementation for mock requests/claimables/activities; passed after implementation.
- `pnpm test -- portfolio src/swagger.fe-api.spec.ts` — passed with existing DepositRequestProjector warning logs.
- `pnpm lint` — passed.
- `pnpm build` — passed.

## Architecture docs checked

Architecture docs checked; no update needed. `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` already describe Portfolio as live balances plus indexed DB projections, event-derived portfolio accounting projections, and refund-only claimables from rejected/unrefunded async deposit requests. No module boundary, dependency graph, runtime flow, infrastructure, data ownership, schema, or projection model changed.

## Remaining risks

- Full production endpoint audit tests are still pending in Epic 5 Slice 1.
- Claimables remain limited to refund rows; future rewards/airdrops/user-fee claimables require contract/event sources.

## Next step

Start Epic 5 Slice 1 — production endpoint audit tests.
