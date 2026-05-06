# Architecture — Portfolio Earnings And Claimables Live Projection

## Purpose

Coordinate implementation of live portfolio accounting and claimables from existing deployed contract events and backend projections.

## Operating flow

```text
plan
  -> tracker
    -> epic contract
      -> one bounded slice
        -> tests + implementation
        -> verification
        -> tracker + session log + kickoff update
```

## Plan boundaries

- Backend projection/read API only.
- Existing deployed Market and tranche ABI surface only.
- No contract, ABI, signing, transaction submission, or future rewards scope.

## Backend module boundaries

- `shared/database/schema`: owns new Drizzle table definitions and migration output.
- `chain-projector`: indexes Market/tranche events and dispatches portfolio cashflow projection.
- `portfolio`: owns accounting math, accounting repository, earnings repository, claimables repository, and REST service mapping.
- `contract-reader`: remains source for live positions; do not duplicate on-chain balance reads unless plan requires it.
- `docs/canonical`: updated when API behavior, data ownership, integration, or schema semantics change.

## Data ownership

- `portfolio_cashflows`: immutable event-idempotent ledger keyed by chain/market/tx/log.
- `portfolio_cost_basis`: average-cost aggregate per wallet/market/tranche.
- `deposit_requests`: source for refund claimables; do not create `portfolio_claimables` table for MVP.

## Event ownership rules

- Direct deposits: `DepositYT.user` can be owner only when safe.
- Instant deposits with receiver override: correlate same-transaction tranche ERC-4626 `Deposit(sender, owner, assets, shares)`.
- Async settlements: `DepositSettled.receiver` is owner.
- Withdrawals: `WithdrawYT.user` is share owner whose shares are burned.
- Ambiguous ownership: skip or mark partial; never assign to guessed wallet.

## Handoff quality bar

Every implementation session must record:

- active plan path
- active epic/slice path
- files touched
- verification command and result
- architecture docs updated, or `Architecture docs checked; no update needed`
- API impact for FE using `backend/docs/HANDOFF.md` categories
- unresolved risks
- next exact action
