# Tracker — Live Data Cutover For Mock-Backed Endpoints

## Active

- Epic: Complete
- Slice: Complete
- Session kickoff: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/session-kickoff-prompt.md`
- Latest session: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-4-slice-1-verification-handoff.md`.

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

1. Review diff and prepare PR/merge when ready.

## Done

- Initiative generated from plan.
- Epics and bounded slices generated from plan scope.
- Epic 1 Slice 1 — Portfolio earnings default unavailable.
- Epic 1 Slice 2 — Portfolio claimables default empty.
- Epic 1 Slice 3 — Portfolio overview unavailable aggregates.
- Epic 2 Slice 1 — Yield and utilization charts return unavailable.
- Epic 3 Slice 1 — Withdraw output uses derived labels.
- Epic 4 Slice 1 — Full verification, docs sync, and FE API impact summary.
- Architecture docs checked; no update needed.

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

- 2026-05-05: Initiative implementation completed with targeted tests, full tests, lint, build, canonical API docs sync, and architecture docs check. API impact: `API data-source/behavior change`; FE should review empty states and source-label copy. Architecture docs checked; no update needed. Latest session: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-4-slice-1-verification-handoff.md`. Next: review diff and prepare PR/merge when ready.
- 2026-05-05: Epic 3 completed withdraw quote placeholder cutover. API impact: `API data-source/behavior change`; FE should review withdraw source-label copy and shares-mode preflight copy. Architecture docs checked; no update needed. Latest session: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-3-slice-1-withdraw-quotes.md`. Next: Epic 4 Slice 1 — Full verification, docs sync, and FE API impact summary.
- 2026-05-05: Epic 2 completed market chart mock cutover for `yield` and `utilization`. API impact: `API data-source/behavior change`; FE should review chart empty states and unavailable-series copy. Architecture docs checked; no update needed. Latest session: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-2-slice-1-market-charts.md`. Next: Epic 3 Slice 1 — Withdraw output uses derived labels.
- 2026-05-05: Epic 1 completed portfolio earnings, claimables, and overview unavailable/mock cutover. API impact: `API data-source/behavior change`; FE should review portfolio empty states/source-label copy and branches on `placeholder` vs `unavailable`. Architecture docs checked; no update needed. Latest session: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-1-slice-3-portfolio-overview.md`. Next: Epic 2 Slice 1 — Yield and utilization charts return unavailable.
- 2026-05-05: Epic 1 Slice 2 completed portfolio claimables default empty cutover. API impact: `API data-source/behavior change`; FE should review claimables empty-state copy. Architecture docs checked; no update needed. Latest session: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-1-slice-2-portfolio-claimables.md`. Next: Epic 1 Slice 3 — Portfolio overview unavailable aggregates.
- 2026-05-05: Epic 1 Slice 1 completed portfolio earnings default unavailable cutover. API impact: `API data-source/behavior change`; FE should review earnings empty state/source-label copy. Architecture docs checked; no update needed. Latest session: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-1-slice-1-portfolio-earnings.md`. Next: Epic 1 Slice 2 — Portfolio claimables default empty.
- 2026-05-05: Initiative activated from `backend/docs/plans/2026-05-05-live-data-cutover-mock-backed-endpoints.md`. Epics/slices generated. Next: Epic 1 Slice 1 — Portfolio earnings default unavailable.
