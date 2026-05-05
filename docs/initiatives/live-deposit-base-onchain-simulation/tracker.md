# Tracker — Live Deposit-Base Onchain Simulation

## Active

- Epic: Complete
- Slice: Complete
- Session kickoff: `backend/docs/initiatives/live-deposit-base-onchain-simulation/session-kickoff-prompt.md`
- Latest session: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-3-swagger-docs-smoke.md`

## Active plan

- `backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`

## Planned

1. Epic 1 — Contract Simulation Service
2. Epic 2 — Deposit-Base Quote Integration
3. Epic 3 — Swagger, Canonical Docs, and Smoke

## In Progress

- None.

## Next Up

1. Review diff and prepare PR/merge when ready.

## Done

- Initiative generated from plan.
- Epics and bounded slices generated from plan scope.
- Epic 1 Slice 1 — Add simulation helper.
- Epic 2 Slice 1 — Simulation-backed quote success and sender requirement.
- Epic 2 Slice 2 — Simulation revert mapping in quote response.
- Epic 3 Slice 1 — Swagger and canonical API docs.
- Epic 3 Slice 2 — Full verification and API smoke.
- Architecture docs checked; canonical API and integration docs updated.

## Blocked

- None.

## Risks

- Simulation can fail before approval because `eth_call` sees current allowance/balance.
- Simulation is exact for current block only; mined tx can differ if state changes.
- Viem may not decode every revert name; unknown failures should map to `SIMULATION_REVERTED`.
- Exact shares require selected tranche `previewDeposit(ytOut)`; do not assume 1:1 if tranche rate changes.

## Needs Decision

- None for Epic 1.

## Recently Updated

- 2026-05-05: Epic 3 completed Swagger docs, canonical API/integration docs, full verification, DB migration smoke, and deposit-base API smoke. API impact: `API contract change` documented for FE. Latest session: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-3-swagger-docs-smoke.md`. Next: review diff and prepare PR/merge.
- 2026-05-05: Epic 2 completed quote integration for successful and reverted deposit-base simulation. API impact: `API contract change`; FE must pass `sender` and handle `SENDER_REQUIRED`, `simulated_onchain`, and `simulation_reverted`. Canonical API/integration docs pending Epic 3. Latest session: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-2-slice-2-quote-simulation-reverts.md`. Next: Epic 3 Slice 1 — Swagger and canonical API docs.
- 2026-05-05: Epic 2 Slice 1 wired successful deposit-base simulation and `SENDER_REQUIRED` handling. API impact: `API contract change`; canonical API/integration docs pending Epic 3. Latest session: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-2-slice-1-quote-simulation-success.md`. Next: Epic 2 Slice 2 — Simulation revert mapping in quote response.
- 2026-05-05: Epic 1 Slice 1 added `simulateDepositBaseInstant(...)` helper and RED quotes test. API impact: `No FE-facing API impact`. Architecture docs checked; no update needed. Latest session: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-1-slice-1-simulation-helper.md`. Next: Epic 2 Slice 1 — Integrate simulation into deposit-base quotes.
- 2026-05-05: Initiative activated from `backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`. API impact expected: `API contract change` once quote integration/docs land. Next: Epic 1 Slice 1 — Add simulation helper.
