# Epic 4 — Cross-Endpoint Verification And Handoff

## Goal

Verify all live-data cutover behavior, complete docs sync, and prepare implementation handoff for review/merge.

## Scope

- Check `docs/canonical/api-contract.md`
- Check `docs/canonical/backend-architecture.md`
- Check `backend/docs/architecture.md`
- Check active initiative tracker/session logs
- Run targeted/full verification commands

## Slices

### Slice 1 — Full verification, docs sync, and FE API impact summary

Tasks:

1. Read only:
   - active plan
   - tracker
   - this epic
   - latest Epic 3 Slice 1 session log
   - `docs/canonical/api-contract.md`
   - `docs/canonical/backend-architecture.md`
   - `backend/docs/architecture.md`
2. Run targeted tests:
   - `pnpm test src/modules/portfolio/portfolio.service.spec.ts src/modules/market-state/market-state.service.spec.ts src/modules/quotes/quotes.service.spec.ts`
3. Run full backend tests:
   - `pnpm test`
4. Run lint:
   - `pnpm lint`
5. Run build/typecheck:
   - `pnpm build`
6. Confirm `docs/canonical/api-contract.md` includes all FE-visible behavior changes from Epics 1-3.
7. Compare implementation against architecture docs:
   - `docs/canonical/backend-architecture.md`
   - `backend/docs/architecture.md`
8. If no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changed, record exactly:
   - `Architecture docs checked; no update needed`
9. If Task 5 expanded into new contract-reader preview/simulation RPC, update both architecture docs before marking done.
10. Write consolidated API impact summary:

```md
API impact for FE: API data-source/behavior change.
- `/portfolio/:address/earnings`: default live mode now returns empty/unavailable instead of mock earnings/history.
- `/portfolio/:address/claimables`: default live mode now returns empty list instead of mock claim rows.
- `/portfolio/:address`: money-like aggregates now use source `unavailable` unless `includeMock=true`; no default mock claimable preview.
- `/markets/:address/charts?metric=yield|utilization`: now empty/unavailable instead of mock series.
- `/quotes/withdraw-yt`: output source no longer `placeholder`; uses derived labels.
FE action needed: review empty states and source-label copy.
```

11. Write session log `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-4-slice-1-verification-handoff.md`.
12. Update tracker status to complete and next step to review diff / prepare PR or merge.

## API impact for FE

`API data-source/behavior change` consolidated across all endpoints. FE should review empty states and source-label copy; no endpoint shape change expected.

## Verification

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts src/modules/market-state/market-state.service.spec.ts src/modules/quotes/quotes.service.spec.ts`
- `pnpm test`
- `pnpm lint`
- `pnpm build`

## Architecture docs check

Required before initiative completion. Expected: no architecture update needed unless implementation adds new contract-reader calls or changes module ownership/dependency flow.
