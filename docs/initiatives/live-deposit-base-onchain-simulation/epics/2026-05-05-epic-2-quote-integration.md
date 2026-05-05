# Epic 2 — Deposit-Base Quote Integration

## Goal

Wire `POST /quotes/deposit-base` to exact current-block simulation output.

## Scope

- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/quotes/quotes.service.spec.ts`

## Slices

### Slice 1 — Simulation-backed quote success and sender requirement

Tasks:

1. Read only:
   - active plan
   - tracker
   - latest Epic 1 session log
   - `quotes.service.ts`
   - `quotes.service.spec.ts`
2. Add `sender?: string` to `DepositBaseQuoteRequest`.
3. Default `receiver` to `sender`.
4. If sender missing/zero, return `availability.reason = SENDER_REQUIRED`, `estimateType = unavailable`, and do not call simulation.
5. On simulation success, return `estimatedYtOut`, `sharesOut`, `estimateType = simulated_onchain`, `dataQuality.sources.estimate = simulated_onchain`.
6. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` and record RED/GREEN.

### Slice 2 — Simulation revert mapping in quote response

Tasks:

1. Add failing test for `{ ok: false, reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE' }`.
2. Return `availability.available = false`, same reason, warning, `estimatedYtOut = null`, `sharesOut = null`, `estimateType = simulation_reverted`.
3. Preserve existing halted/capacity/instant-disabled behavior.
4. Run `pnpm test src/modules/quotes/quotes.service.spec.ts`.
5. Update tracker/session.

## API impact for FE

`API contract change`.

- `POST /quotes/deposit-base` request adds `sender` for exact simulation semantics.
- Successful estimates change source from `placeholder` to `simulated_onchain`.
- Reverted simulations become explicit unavailable quote responses.

## Verification

- `pnpm test src/modules/quotes/quotes.service.spec.ts`
- `pnpm lint`
- `pnpm build`

## Architecture docs check

Runtime quote behavior changes, so canonical API/integration docs must be updated in Epic 3 before completion of initiative.
