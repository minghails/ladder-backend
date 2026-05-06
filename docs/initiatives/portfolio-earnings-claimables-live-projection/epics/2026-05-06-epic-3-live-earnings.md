# Epic 3 — Live Earnings Endpoint And Overview Summary

## Goal

Serve live event-derived portfolio earnings and overview earnings summary from cost basis plus live positions.

## Scope

- `backend/src/modules/portfolio/portfolio-earnings.repository.ts`
- `backend/src/modules/portfolio/portfolio-earnings.repository.spec.ts`
- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/portfolio/portfolio.module.ts`
- `docs/canonical/api-contract.md`

## Slices

### Slice 1 — Earnings repository

Tasks:

1. Read only active plan Task 5 and existing portfolio/repository test patterns.
2. Add failing repository test for wallet cost-basis rows mapped by wallet/market/tranche.
3. Run `pnpm test src/modules/portfolio/portfolio-earnings.repository.spec.ts`; record RED.
4. Implement `findCostBasis(walletAddress)` and `findCashflowsSince(walletAddress, since)`.
5. Normalize wallet address consistently with existing portfolio service behavior.
6. Run repository test; record GREEN.
7. Update tracker/session kickoff/session log.

### Slice 2 — Live earnings endpoint

Tasks:

1. Read only active plan Task 6, portfolio service/spec, portfolio module, earnings repository, and contract reader position shape.
2. Add failing service test where cost basis plus live position returns lifetime PnL.
3. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts`; record RED.
4. Preserve `includeMock=true` behavior.
5. For live path, load positions and cost-basis rows.
6. Compute `unrealized = currentValue - openCostBasis`; `lifetime = realizedPnl + unrealized` using bigint.
7. Return `source = indexed_events` for full rows and `partial_indexed_events` for partial rows.
8. Keep `earning30d = '0'` and history unavailable/empty until snapshots exist.
9. Run portfolio service tests; record GREEN.
10. Update canonical API docs for earnings semantics.
11. Update tracker/session kickoff/session log.

### Slice 3 — Overview earnings summary

Tasks:

1. Read only active plan Task 7 and portfolio overview service tests.
2. Add failing overview test for `currentEarning`, `currentEarningSource`, `earning30d`, and `totalValueChange.source`.
3. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts`; record RED.
4. Extract/reuse helper such as `computePortfolioEarningsSummary(costBasisRows, livePositions)` if idiomatic.
5. Sum total PnL across cost-basis rows using live position current values.
6. Source rules: `indexed_events` when all full, `partial_indexed_events` when any partial, `unavailable` when no rows.
7. Keep 30d source unavailable until snapshots exist.
8. Run portfolio service tests; record GREEN.
9. Update tracker/session kickoff/session log.

## API impact for FE

`API data-source/behavior change`.

- `/portfolio/:address/earnings` changes from empty/mock fallback to event-derived PnL when history exists.
- `/portfolio/:address` overview earnings fields can become live.
- FE action needed: review source labels, partial-history copy, empty-state assumptions.

## Verification

- `pnpm test src/modules/portfolio/portfolio-earnings.repository.spec.ts`
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts`

## Architecture docs check

Canonical API docs must be updated in this epic. Backend architecture/integration docs can be completed in Epic 5 if tracker records pending doc sync.
