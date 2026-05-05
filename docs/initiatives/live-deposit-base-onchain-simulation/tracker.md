# Tracker — Live Deposit-Base Onchain Simulation

## Active

- Epic: Epic 1 — Contract Simulation Service
- Slice: Slice 1 — Add simulation helper
- Session kickoff: `backend/docs/initiatives/live-deposit-base-onchain-simulation/session-kickoff-prompt.md`
- Latest session: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-activation.md`

## Active plan

- `backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`

## Planned

1. Epic 1 — Contract Simulation Service
2. Epic 2 — Deposit-Base Quote Integration
3. Epic 3 — Swagger, Canonical Docs, and Smoke

## In Progress

- Epic 1 Slice 1 — Add simulation helper.

## Next Up

1. Implement Epic 1 Slice 1 with TDD.
2. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` for RED/GREEN.
3. Update this tracker and write a new session log.

## Done

- Initiative generated from plan.
- Epics and bounded slices generated from plan scope.

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

- 2026-05-05: Initiative activated from `backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`. API impact expected: `API contract change` once quote integration/docs land. Next: Epic 1 Slice 1 — Add simulation helper.
