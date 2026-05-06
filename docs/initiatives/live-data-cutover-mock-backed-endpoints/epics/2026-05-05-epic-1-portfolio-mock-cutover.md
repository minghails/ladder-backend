# Epic 1 — Portfolio Mock Cutover

## Goal

Remove default mock/placeholder money-like portfolio data while preserving explicit sandbox mock mode.

## Scope

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `docs/canonical/api-contract.md`

## Slices

### Slice 1 — Portfolio earnings default unavailable

Tasks:

1. Read only:
   - active plan
   - tracker
   - this epic
   - `backend/src/modules/portfolio/portfolio.service.ts`
   - `backend/src/modules/portfolio/portfolio.service.spec.ts`
   - portfolio section of `docs/canonical/api-contract.md`
2. Add failing/default-guard tests from plan Task 1 for `getEarnings(...)`:
   - default response has `earnings: []`, empty history, `mockEnabled: false`, `mockedSections: []`.
   - sources include `earnings: 'unavailable'` and `earningsHistory: 'unavailable'`.
   - explicit `includeMock: true` still returns mock earnings/history for sandbox.
3. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts` and record RED or current-pass guard result.
4. Add `explicitMockRequested(options)` helper and make `getEarnings(...)` use only explicit `includeMock === true`.
5. Update earnings row in `docs/canonical/api-contract.md` with empty/unavailable default and sandbox-only `includeMock=true` behavior.
6. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts` and record GREEN.
7. Check architecture docs sync. Expected: `Architecture docs checked; no update needed`.
8. Write session log `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-1-slice-1-portfolio-earnings.md`.
9. Update tracker next slice to Epic 1 Slice 2.

API impact for FE: `API data-source/behavior change` — `/portfolio/:address/earnings` default live mode returns empty/unavailable instead of mock rows. FE action needed: review empty state/source-label copy.

### Slice 2 — Portfolio claimables default empty

Tasks:

1. Read only:
   - active plan
   - tracker
   - this epic
   - latest Slice 1 session log
   - `backend/src/modules/portfolio/portfolio.service.ts`
   - `backend/src/modules/portfolio/portfolio.service.spec.ts`
   - portfolio section of `docs/canonical/api-contract.md`
2. Add failing/default-guard tests from plan Task 2 for `getClaimables(...)`:
   - default response has `items: []` and standard empty page.
   - explicit `includeMock: true` still returns disabled mock claimable rows for sandbox.
3. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts` and record RED or current-pass guard result.
4. Make `getClaimables(...)` use only explicit `includeMock === true`.
5. Update portfolio overview claimable preview to use same explicit sandbox mock rule.
6. Update claimables row in `docs/canonical/api-contract.md` with empty live list and sandbox-only `includeMock=true` behavior.
7. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts` and record GREEN.
8. Check architecture docs sync. Expected: `Architecture docs checked; no update needed`.
9. Write session log `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-1-slice-2-portfolio-claimables.md`.
10. Update tracker next slice to Epic 1 Slice 3.

API impact for FE: `API data-source/behavior change` — `/portfolio/:address/claimables` default live mode returns empty list instead of mock rows. FE action needed: review empty-state copy.

### Slice 3 — Portfolio overview unavailable aggregates

Tasks:

1. Read only:
   - active plan
   - tracker
   - this epic
   - latest Slice 2 session log
   - `backend/src/modules/portfolio/portfolio.service.ts`
   - `backend/src/modules/portfolio/portfolio.service.spec.ts`
   - portfolio section of `docs/canonical/api-contract.md`
2. Add failing overview test from plan Task 3:
   - `summary.totalValueChange.source = 'unavailable'`
   - `summary.currentEarningSource = 'unavailable'`
   - `summary.earning30dSource = 'unavailable'`
   - `summary.claimable.source = 'unavailable'`
   - `portfolioMetrics.netApySource = 'unavailable'`
   - `dataQuality.mockedSections = []`
3. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts` and record expected failure if current code uses `placeholder` or env mock fallback.
4. Separate explicit sandbox mock from any DB/activity fallback in `getPortfolio(...)`.
5. Change overview money-like fields to zero/unavailable unless `includeMock=true` is explicit.
6. Adjust `dataQuality(...)` so `mockedSections` only reports money-like mock sections when explicit sandbox mock is enabled.
7. Add portfolio overview note in `docs/canonical/api-contract.md` that unavailable financial aggregates return zero values with `source = "unavailable"` unless `includeMock=true`.
8. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts` and record GREEN.
9. Check architecture docs sync. Expected: `Architecture docs checked; no update needed`.
10. Write session log `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-1-slice-3-portfolio-overview.md`.
11. Update tracker next slice to Epic 2 Slice 1.

API impact for FE: `API data-source/behavior change` — `/portfolio/:address` money-like aggregates become unavailable/zero instead of placeholder/mock defaults. FE action needed: review copy and any branches on `placeholder`.

## Verification

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts`
- Epic-level later: `pnpm test`, `pnpm lint`, `pnpm build`

## Architecture docs check

Expected no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes. Record `Architecture docs checked; no update needed` after each slice unless implementation expands scope.
