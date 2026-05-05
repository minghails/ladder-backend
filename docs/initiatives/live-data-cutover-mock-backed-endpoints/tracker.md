# Tracker — Live Data Cutover For Mock-Backed Endpoints

## Active

- Epic: Epic 1 — Portfolio Mock Cutover
- Slice: Epic 1 Slice 1 — Portfolio earnings default unavailable
- Session kickoff: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/session-kickoff-prompt.md`
- Latest session: None.

## Active plan

- `backend/docs/plans/2026-05-05-live-data-cutover-mock-backed-endpoints.md`

## Planned

1. Epic 1 — Portfolio Mock Cutover
2. Epic 2 — Market Charts Mock Cutover
3. Epic 3 — Withdraw Quote Placeholder Cutover
4. Epic 4 — Cross-Endpoint Verification And Handoff

## In Progress

- None.

## Next Up

1. Epic 1 Slice 1 — Portfolio earnings default unavailable.

## Done

- Initiative generated from plan.
- Epics and bounded slices generated from plan scope.

## Blocked

- None.

## Risks

- Empty/unavailable data is intentionally not full live projection; FE may need empty-state/copy review.
- `PORTFOLIO_MOCK_FALLBACK` may leak mock money-like data if not separated from explicit `includeMock=true`.
- Existing tests may assert `placeholder` or mock defaults and must be updated to intended live behavior.
- Withdraw `mode='shares'` remains identity-derived until tranche `previewRedeem` simulation exists.
- Chart utilization formula is product-specific and must not be invented from `navSt/navJt`.

## Needs Decision

- None before Epic 1 Slice 1.
- If Task 5 proposes adding live tranche `previewRedeem`, decide whether to expand scope and update architecture docs.

## API impact expectation for FE

`API data-source/behavior change`.

- `/portfolio/:address/earnings`: default live mode returns empty/unavailable instead of mock earnings/history.
- `/portfolio/:address/claimables`: default live mode returns empty list instead of mock claim rows.
- `/portfolio/:address`: money-like aggregates use source `unavailable` unless `includeMock=true`; no default mock claimable preview.
- `/markets/:address/charts?metric=yield|utilization`: empty/unavailable instead of mock series.
- `/quotes/withdraw-yt`: output source no longer `placeholder`; uses derived labels.
- FE action needed: review empty states and source-label copy.

## Recently Updated

- 2026-05-05: Initiative activated from `backend/docs/plans/2026-05-05-live-data-cutover-mock-backed-endpoints.md`. Epics/slices generated. Next: Epic 1 Slice 1 — Portfolio earnings default unavailable.
