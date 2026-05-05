# Initiative — Live Deposit-Base Onchain Simulation

## Plan

`backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`

## Goal

Make `POST /quotes/deposit-base` return exact current-block on-chain simulation output for `Market.depositInstant(...)` so FE can display `you will get` from live contract execution.

## Scope

- Extend existing Quotes and ContractReader services only.
- Use viem `simulateContract`/`eth_call` against deployed Market with operator-supplied ABI.
- Require `sender` for exact current-block simulation.
- Default `receiver` to `sender`.
- Return simulated output or deterministic simulation-revert availability.
- Update Swagger and canonical API/integration docs during implementation.

## Non-goals

- No backend signing.
- No private keys.
- No backend transaction submission.
- No mandatory calldata.
- No async `depositRequest(...)` quote.
- No contract changes.
- No yield projection work.

## Source-of-truth order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. Active plan file
5. `tracker.md`
6. Active epic file only
7. Latest session log only

## Current status

Prepared for implementation. No source code changed by initiative activation.
