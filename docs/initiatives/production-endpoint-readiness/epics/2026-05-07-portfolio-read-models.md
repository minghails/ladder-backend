# Epic: Portfolio Read Models Without Mocks

## Goal

Ensure portfolio endpoints use live reads plus indexed DB projections only in production/default mode.

## Source plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md` Chunk 4.

## Slices

### Slice 1 — validate projector event coverage

**Plan task:** Task 10

**Scope**

- Verify event coverage for portfolio projections.
- Confirm projector writes `market_events`, `deposit_requests`, `portfolio_cashflows`, and `portfolio_cost_basis` consistently.
- Add partial-history detection if missing.

**Likely files**

- `backend/src/modules/chain-projector/*`
- `backend/src/modules/portfolio/*repository*.ts`
- `backend/src/shared/database/schema/portfolio-cashflows.ts`
- `backend/src/shared/database/schema/portfolio-cost-basis.ts`
- chain projector + portfolio projection specs

**Acceptance**

- Required events are documented/test-covered: `DepositYT`, `WithdrawYT`, `DepositRequested`, `DepositBasePulled`, `DepositRequestLinked`, `DepositSettled`, `DepositRejected`, `DepositRefunded`, and tranche ERC-4626 events if needed.
- Replay tests prove deterministic portfolio projection.
- Partial history yields `partial_indexed_events`, not full quality.

### Slice 2 — production portfolio overview

**Plan task:** Task 11

**Scope**

- Remove mock summary values from default/production overview.
- Keep `summary.totalValue` from live tranche balances + price.
- Return unavailable source for missing real earnings/APY values.
- Return DB rows only for pending requests, recent activities, claimables.

**Likely files**

- `backend/src/modules/portfolio/portfolio.service.ts`
- portfolio service specs
- `docs/canonical/api-contract.md` if source semantics change

**Acceptance**

- Empty DB returns empty arrays/unavailable, not mock.
- Default/production overview contains no mock source.

### Slice 3 — production earnings/history

**Plan task:** Task 12

**Scope**

- Keep earnings table from cost basis + live positions.
- Implement history only from real snapshot/cashflow data.
- If no history projection exists, return empty series + `historyAvailable=false` + unavailable source.

**Likely files**

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio-earnings.repository.ts`
- optional `backend/src/shared/database/schema/portfolio-earnings-snapshots.ts`
- portfolio earnings specs

**Acceptance**

- No mock earnings/history in default/production mode.
- Tests cover full, partial, and empty history.

### Slice 4 — production claimables, requests, activities

**Plan task:** Task 13

**Scope**

- Claimables only from rejected, unrefunded async deposit requests where refund is actually available.
- Requests only from indexed `deposit_requests` rows.
- Activities only from indexed `market_events` mapped to product activity types.
- Add pagination tests.

**Likely files**

- `backend/src/modules/portfolio/portfolio.service.ts`
- portfolio repositories as needed
- portfolio claimables/requests/activities specs
- `docs/canonical/api-contract.md` if source semantics change

**Acceptance**

- `includeMock=true` does not affect production mode.
- Empty real data stays empty and source-labelled.

## Epic completion criteria

- Portfolio endpoints have no default/production mock output.
- Portfolio quality labels distinguish full/partial/unavailable real data.
- API impact summary added to tracker.
