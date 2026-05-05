# Session — Epic 2 Slice 2 Quote Simulation Reverts

Date: 2026-05-05

## Scope

Completed Epic 2 Slice 2 — Simulation revert mapping in quote response.

## Files changed

- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/quotes/quotes.service.spec.ts`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/tracker.md`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/session-kickoff-prompt.md`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-2-slice-2-quote-simulation-reverts.md`

## TDD record

- RED: `pnpm test src/modules/quotes/quotes.service.spec.ts`
  - Result: failed as expected because simulation revert left availability true with null reason.
- GREEN: mapped `{ ok: false }` simulation results to unavailable quote responses with same reason, warning, null outputs, and `estimateType = simulation_reverted`.
- GREEN verification: `pnpm test src/modules/quotes/quotes.service.spec.ts`
  - Result: 12 tests passed.

## API impact for FE

`API contract change`.

- `POST /quotes/deposit-base` now reports reverted simulations as unavailable quote responses.
- Reverted simulations return `estimate.estimateType = simulation_reverted`, null `estimatedYtOut`, null `sharesOut`, and warning/reason such as `INSUFFICIENT_ALLOWANCE_OR_BALANCE`.

Canonical API/integration docs must be updated in Epic 3 before initiative completion.

## Architecture docs

Runtime quote behavior changed. Per epic guidance, canonical API/integration docs update is deferred to Epic 3 before initiative completion.

No module boundary, dependency graph, infrastructure, data ownership, schema, or event semantics changed.

## Verification

- `pnpm test src/modules/quotes/quotes.service.spec.ts` passed: 12 tests passed.
- `pnpm lint` passed.
- `pnpm build` passed with 0 TypeScript issues.

## Remaining risks

- Canonical Swagger/API/integration docs still need Epic 3 update.
- Full suite and API smoke still need Epic 3 verification.

## Next step

Implement Epic 3 Slice 1 — Swagger and canonical API docs.
