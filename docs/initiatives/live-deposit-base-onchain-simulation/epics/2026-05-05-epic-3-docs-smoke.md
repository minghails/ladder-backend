# Epic 3 — Swagger, Canonical Docs, and Smoke

## Goal

Document the new exact current-block simulation contract and verify it works end-to-end.

## Scope

- `backend/src/modules/quotes/dto/quote-swagger.dto.ts`
- `backend/src/swagger.fe-api.spec.ts`
- `docs/canonical/api-contract.md`
- `docs/canonical/integration-rules.md`
- Initiative tracker/session/kickoff docs

## Slices

### Slice 1 — Swagger and canonical API docs

Tasks:

1. Read only:
   - active plan
   - tracker
   - latest Epic 2 session log
   - `quote-swagger.dto.ts`
   - `swagger.fe-api.spec.ts`
   - `docs/canonical/api-contract.md`
   - `docs/canonical/integration-rules.md`
2. Add failing Swagger/API doc test for `sender`, `simulated_onchain`, and no mandatory calldata.
3. Run `pnpm test src/swagger.fe-api.spec.ts` and record RED.
4. Update Swagger DTO for deposit-base `sender` and estimate types.
5. Update `docs/canonical/api-contract.md` with exact simulation request/response/revert semantics.
6. Update `docs/canonical/integration-rules.md` with current-block, not future-mining guarantee.
7. Run `pnpm test src/swagger.fe-api.spec.ts` and record GREEN.

### Slice 2 — Full verification and API smoke

Tasks:

1. Run:
   - `pnpm test`
   - `pnpm lint`
   - `pnpm build`
2. Run Docker DB migration smoke:
   - `cd backend/docker && docker compose up -d postgres`
   - `cd .. && set -a; source .env; set +a; pnpm db:migrate`
3. Run deposit-base API smoke with `sender`.
4. Verify response has no calldata and has `estimateType = simulated_onchain`, `simulation_reverted`, or `unavailable`.
5. Apply architecture doc sync rules.
6. Update tracker, session log, and kickoff prompt.

## API impact for FE

`API contract change`.

FE must pass `sender` for exact simulation and handle `simulation_reverted`/`unavailable` estimate states.

## Verification

- `pnpm test src/swagger.fe-api.spec.ts`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm db:migrate`
- deposit-base API smoke

## Architecture docs check

Update canonical API and integration rules. Root/backend architecture docs likely no update if module boundaries stay unchanged; record the check in session handoff.
