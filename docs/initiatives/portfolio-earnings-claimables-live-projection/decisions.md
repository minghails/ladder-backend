# Decisions — Portfolio Earnings And Claimables Live Projection

## Accepted decisions

- Use average-cost accounting for MVP realized/unrealized PnL.
- Store portfolio cashflows as immutable event-idempotent rows.
- Store cost basis as aggregate per wallet/market/tranche.
- Use existing Market events and tranche ERC-4626 events only; no contract or ABI changes.
- Derive refund claimables from `deposit_requests`; no `portfolio_claimables` table for MVP.
- Do not expose user rewards, airdrops, or user-fee claimables without future contract sources.
- Keep `earning30d` unavailable/zero until snapshots exist; do not fake 30d performance.
- Mark incomplete historical coverage as `partial`.

## Proposed decisions

- Add `partial_indexed_events` as source literal, or represent partial history through a separate coverage field.
- Return disabled rejected refund rows with reason, or omit non-actionable rows.
- If `DepositYT` direct-vs-instant classification is unreliable, require same-transaction tranche `Deposit.owner` correlation for every `DepositYT`.
- For multi-token refund summaries, avoid summing into one display token unless conversion is explicit.

## Rejected decisions

- Contract changes for earnings or claimables in this initiative.
- ABI changes for event coverage.
- Claiming carry fees as user claimables.
- Adding APY/net yield model in this initiative.
- Backend signing or transaction submission.
