# Session — 2026-05-06 Epic 3 Live Earnings

## Scope

- Plan: `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
- Initiative: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/`
- Epic: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-3-live-earnings.md`
- Slices: Slice 2 — Live earnings endpoint; Slice 3 — Overview earnings summary

## Work completed

- Wired `PortfolioEarningsRepository` into `PortfolioService` and `PortfolioModule`.
- Updated `GET /portfolio/:address/earnings` live path to read cost-basis rows plus live positions.
- Computed lifetime PnL as `realizedPnl + currentValue - openCostBasis` using bigint.
- Added `indexed_events` and `partial_indexed_events` source labels.
- Kept `earning30d = '0'` and empty history with `historyAvailable = false` until snapshots exist.
- Preserved explicit `includeMock=true` earnings sandbox behavior.
- Updated overview summary earnings fields from the same live projection.
- Updated canonical API docs for live earnings semantics.

## Files changed

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/portfolio/portfolio.module.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-3-live-earnings.md`

## Docs changed

- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-3-live-earnings.md`

## Verification run

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — RED for Slice 2 before implementation: failed because `PortfolioEarningsRepository.findCostBasis` was not called and earnings remained empty.
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS after Slice 2 implementation: 1 file, 16 tests passed.
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — RED for Slice 3 before implementation: failed because overview `currentEarning` was `0` instead of live projected `500`.
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS after Slice 3 implementation: 1 file, 17 tests passed.
- `pnpm test src/modules/portfolio/portfolio-earnings.repository.spec.ts src/modules/portfolio/portfolio.service.spec.ts` — PASS: 2 files, 19 tests passed.
- `pnpm lint` — PASS with 0 errors and 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts` for unused eslint-disable directives.
- `pnpm build` — PASS: TSC found 0 issues; SWC compiled 105 files.

## Architecture docs sync

- Updated: `docs/canonical/api-contract.md` for portfolio earnings behavior and overview live earnings semantics.
- Checked; no update needed: `docs/canonical/backend-architecture.md`; repository/table ownership already documented and no new module boundary beyond existing portfolio read responsibility.
- Checked; no update needed: `backend/docs/architecture.md`; portfolio module remains within existing `portfolio -> shared/database, shared/blockchain` graph.

## API impact for FE

- `API data-source/behavior change`
- `/portfolio/:address/earnings`: now returns event-derived realized/unrealized PnL rows when indexed cost-basis history exists.
- `/portfolio/:address`: overview earnings fields can now use live event-derived projection.
- FE action needed: review `indexed_events`/`partial_indexed_events` labels, empty history copy, and empty-state assumptions.

## Remaining risks

- `earning30d` remains `0`/history unavailable until snapshots exist.
- PnL quality depends on complete historical cashflow indexing; partial history must continue to propagate `partial_indexed_events`.
- Claimables remain mock/empty until Epic 4.
- Lint has 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts`; not introduced by this epic.

## Next step

- Epic 4 Slice 1 — Claimables repository.
