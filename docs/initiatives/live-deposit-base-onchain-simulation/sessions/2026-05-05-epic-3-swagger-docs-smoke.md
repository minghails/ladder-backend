# Session — Epic 3 Swagger Docs Smoke

Date: 2026-05-05

## Scope

Completed Epic 3 — Swagger, Canonical Docs, and Smoke.

## Files changed

- `backend/src/modules/quotes/dto/quote-swagger.dto.ts`
- `backend/src/swagger.fe-api.spec.ts`
- `docs/canonical/api-contract.md`
- `docs/canonical/integration-rules.md`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/tracker.md`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/session-kickoff-prompt.md`
- `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-epic-3-swagger-docs-smoke.md`

## TDD record

- RED: `pnpm test src/swagger.fe-api.spec.ts`
  - Result: failed as expected because Swagger did not expose deposit-base `sender`.
- GREEN: added Swagger `sender` docs, exact simulation estimate type docs, canonical API contract semantics, and integration current-block simulation rules.
- GREEN verification: `pnpm test src/swagger.fe-api.spec.ts`
  - Result: 6 tests passed.

## API impact for FE

`API contract change`.

- `POST /quotes/deposit-base` requires `sender` for exact current-block simulation.
- Success returns `estimate.estimateType = "simulated_onchain"`.
- Reverts return `estimate.estimateType = "simulation_reverted"` with unavailable reason/warning.
- Missing/zero sender returns `SENDER_REQUIRED` and `estimate.estimateType = "unavailable"`.
- Response still keeps `calldataIncluded = false`; FE builds transactions with ABI/wagmi from action hints.

## Architecture docs

Architecture docs checked.

- Updated `docs/canonical/api-contract.md` because API request/response semantics changed.
- Updated `docs/canonical/integration-rules.md` because FE/backend current-block simulation behavior changed.
- Root/backend architecture docs checked; no update needed because module boundaries, dependency graph, infrastructure, data ownership, schema, and event semantics did not change.

## Verification

- `pnpm test src/swagger.fe-api.spec.ts` passed: 6 tests passed.
- `pnpm test` passed: 22 files, 113 tests passed.
- `pnpm lint` passed.
- `pnpm build` passed with 0 TypeScript issues.
- `docker compose up -d postgres` reported Postgres container running.
- `set -a; source .env; set +a; pnpm db:migrate` passed: migrations applied successfully.
- Deposit-base API smoke returned JSON with `estimate.estimateType = "simulation_reverted"`, `availability.available = false`, `action.calldataIncluded = false`, and no mandatory calldata.

## Remaining risks

- Smoke returned `SIMULATION_REVERTED` for the test wallet, likely because current RPC state/allowance/balance does not support success for that sender.
- Simulation remains exact only for the current block and can differ before mined transaction execution.

## Next step

Initiative implementation complete; review diff and prepare PR/merge when ready.
