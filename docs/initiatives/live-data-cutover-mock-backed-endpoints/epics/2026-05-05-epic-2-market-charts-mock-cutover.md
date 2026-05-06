# Epic 2 — Market Charts Mock Cutover

## Goal

Stop returning mock `yield` and `utilization` chart fixtures in live mode.

## Scope

- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/modules/market-state/market-state.service.spec.ts`
- `docs/canonical/api-contract.md`

## Slices

### Slice 1 — Yield and utilization charts return unavailable

Tasks:

1. Read only:
   - active plan
   - tracker
   - this epic
   - latest Epic 1 Slice 3 session log
   - `backend/src/modules/market-state/market-state.service.ts`
   - `backend/src/modules/market-state/market-state.service.spec.ts`
   - chart section of `docs/canonical/api-contract.md`
2. Add failing tests from plan Task 4:
   - `metric='yield'` returns headline source `unavailable`, empty `series`, `dataQuality.sources.series = 'unavailable'`.
   - `metric='utilization'` returns headline source `unavailable`, empty `series`, `dataQuality.sources.series = 'unavailable'`.
3. Run `pnpm test src/modules/market-state/market-state.service.spec.ts` and record RED because current code returns mock fixtures.
4. Replace non-indexed mock chart branch for `yield` and `utilization` with empty unavailable response.
5. Remove `chartTimestamps()` only if it becomes unused.
6. Update chart note in `docs/canonical/api-contract.md`:
   - `tvl`, `tokenPrice`, `ratio` remain indexed snapshot-backed.
   - `yield` and `utilization` return empty unavailable until dedicated projections exist.
   - no mock fixtures in live mode.
7. Run `pnpm test src/modules/market-state/market-state.service.spec.ts` and record GREEN.
8. Check architecture docs sync. Expected: `Architecture docs checked; no update needed`.
9. Write session log `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-2-slice-1-market-charts.md`.
10. Update tracker next slice to Epic 3 Slice 1.

## API impact for FE

`API data-source/behavior change`.

- `/markets/:address/charts?metric=yield`: empty/unavailable instead of mock series.
- `/markets/:address/charts?metric=utilization`: empty/unavailable instead of mock series.
- FE action needed: review chart empty states and copy for unavailable series.

## Verification

- `pnpm test src/modules/market-state/market-state.service.spec.ts`
- Epic-level later: `pnpm test`, `pnpm lint`, `pnpm build`

## Architecture docs check

Expected no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes. Do not invent utilization formula. Record `Architecture docs checked; no update needed` unless implementation expands scope.
