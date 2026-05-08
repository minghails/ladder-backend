# Session 2026-05-07 - Portfolio Event Coverage

## Scope

Implement Epic 4 Slice 1 — validate projector event coverage from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-portfolio-read-models.md`.

## Work completed

- Added explicit `REQUIRED_PORTFOLIO_EVENT_NAMES` contract for portfolio projection coverage.
- Confirmed market event coverage includes `DepositYT`, `WithdrawYT`, `DepositRequested`, `DepositBasePulled`, `DepositRequestLinked`, `DepositSettled`, `DepositRejected`, and `DepositRefunded`.
- Confirmed tranche ERC-4626 `Deposit` event is needed and used for direct `DepositYT` owner correlation.
- Added tests documenting required coverage.
- Added replay/idempotency test proving duplicate cashflow inserts do not re-apply cost basis.
- Added partial-history test proving withdrawals without prior indexed deposits mark cost basis `partial`.

## Files changed

- `backend/src/modules/chain-projector/projector-events.ts`
- `backend/src/modules/chain-projector/projector-events.spec.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-portfolio-event-coverage.md`

## Docs changed

- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Slice 1 complete and Slice 2 active.
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`: updated next-agent prompt to production portfolio overview.
- No canonical API docs changed because no endpoint shape/source behavior changed.

## API impact for FE

No FE-facing API impact. This slice only adds internal event coverage contracts and projection tests; public portfolio response behavior is unchanged.

## Verification run

- `pnpm test src/modules/chain-projector/projector-events.spec.ts` — failed before implementation for missing required coverage export, then passed after implementation.
- `pnpm test src/modules/chain-projector/projector-events.spec.ts src/modules/chain-projector/chain-projector.service.spec.ts` — passed.
- `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts src/modules/chain-projector/deposit-request.projector.spec.ts` — passed with existing DepositRequestProjector warning logs in tests.
- `pnpm test src/modules/chain-projector/projector-events.spec.ts src/modules/chain-projector/chain-projector.service.spec.ts src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts src/modules/chain-projector/deposit-request.projector.spec.ts` — passed with existing DepositRequestProjector warning logs in tests.
- `pnpm lint` — passed after fixing spec typing.

## Architecture docs checked

Architecture docs checked; no update needed. `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` already describe event-sourced portfolio cashflows, deterministic cashflow identity, cost-basis projections, partial quality, and the existing Chain Projector → Portfolio accounting dependency.

## Remaining risks

- Slice validates coverage and tests current behavior; it does not remove remaining portfolio mock/default API paths.
- ERC-4626 `Withdraw` and `Transfer` events are not currently required for this MVP accounting path; portfolio ownership remains derived from live balances plus Market events/cost basis, not a backend balance ledger.

## Next step

Start Portfolio Slice 2 — production portfolio overview.
