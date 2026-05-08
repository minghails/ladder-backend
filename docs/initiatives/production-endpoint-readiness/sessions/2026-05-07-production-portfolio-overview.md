# Session 2026-05-07 - Production Portfolio Overview

## Scope

Implement Epic 4 Slice 2 — production portfolio overview from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-portfolio-read-models.md`.

## Work completed

- Removed mock summary values and mock overview rows from `GET /portfolio/:address` even when sandbox mock fallback is enabled.
- Kept `summary.totalValue` and `portfolioMetrics.totalValue` from live tranche balances/values.
- Kept earnings-derived overview aggregates only when portfolio cost-basis rows exist; otherwise returns zero values with `source = "unavailable"`.
- Kept `portfolioMetrics.netApy` unavailable because no portfolio-level APY projection exists for this slice.
- Kept overview `pendingRequests`, `recentActivities`, and `claimableItems` sourced only from DB/indexed rows.
- Added/updated tests proving overview ignores sandbox mock fallback and returns empty arrays/unavailable sources instead of mock output.
- Fixed TypeScript strict build guards in market APY/chart code that surfaced during `pnpm build` verification.

## Files changed

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/market-state/market-apy.service.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-production-portfolio-overview.md`

## Docs changed

- `docs/canonical/api-contract.md`: documented that overview ignores `includeMock`, uses live/DB rows only, and returns unavailable sources for missing real earnings/APY values.
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Slice 2 complete and Slice 3 active.
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`: updated next-agent prompt to production earnings/history.

## API impact for FE

API data-source/behavior change. `GET /portfolio/:address` no longer returns mock overview values or rows under sandbox mock fallback. Endpoint shape is unchanged. FE action needed: update sandbox fixtures/expectations for overview empty states; no parser change required.

## Verification run

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — failed before implementation for mock `summary.totalValueChange`; passed after implementation.
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — passed.
- `pnpm test -- portfolio` — passed with existing DepositRequestProjector warning logs.
- `pnpm test -- portfolio market-state` — passed with existing DepositRequestProjector warning logs.
- `pnpm lint` — passed.
- `pnpm build` — initially failed on existing strict undefined checks in market APY/chart code plus the updated portfolio signature; passed after guards/signature cleanup.

## Architecture docs checked

Architecture docs checked; no update needed. `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` already describe Portfolio as live balances plus indexed DB projections, event-derived cashflows/cost basis, and refund-only claimables. No module boundary, dependency graph, runtime flow, infrastructure, data ownership, schema, or projection model changed.

## Remaining risks

- Lazy split endpoints can still return sandbox mock data when explicitly enabled; Slice 3 and Slice 4 will remove remaining production/default earnings/history/claimables/requests/activities behavior.
- Portfolio `netApy` remains unavailable until a real portfolio-level APY projection is defined.

## Next step

Start Portfolio Slice 3 — production earnings/history.
