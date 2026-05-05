# Session — Epic 1 Slice 1 Simulation Helper

Date: 2026-05-05

## Scope

Implemented Epic 1 Slice 1 — Add simulation helper.

## Files changed

- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/modules/quotes/quotes.service.spec.ts`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/tracker.md`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/session-kickoff-prompt.md`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-1-slice-1-simulation-helper.md`

## TDD record

- RED: `pnpm test src/modules/quotes/quotes.service.spec.ts`
  - Result: failed as expected because `simulateDepositBaseInstant` was not called by `quoteDepositBase`.
- GREEN for slice helper: added simulation input/result types, revert reason mapper, `simulateDepositBaseInstant(...)`, and tranche `previewDeposit` read.
- Post-helper check: `pnpm test src/modules/quotes/quotes.service.spec.ts`
  - Result: still failed as expected at the same quotes integration assertion because Epic 2 owns quote service integration.

## API impact for FE

`No FE-facing API impact` for this slice.

The helper is backend-only and `quoteDepositBase` response behavior is not changed in this slice.

## Architecture docs

Architecture docs checked; no update needed.

No module boundary, dependency graph, infrastructure, data ownership, API contract, schema, or event semantics changed.

## Verification

- `pnpm test src/modules/quotes/quotes.service.spec.ts` failed as expected after RED test because Epic 2 integration is next.
- `pnpm lint` passed.
- `pnpm build` passed with 0 TypeScript issues.

## Remaining risks

- Simulation helper is not yet wired into `quoteDepositBase`.
- Viem revert decoding may not expose every custom error name; unknown failures map to `SIMULATION_REVERTED`.
- Shares depend on tranche `previewDeposit(ytOut)` at current state.

## Next step

Implement Epic 2 Slice 1 — Integrate simulation into deposit-base quotes.
