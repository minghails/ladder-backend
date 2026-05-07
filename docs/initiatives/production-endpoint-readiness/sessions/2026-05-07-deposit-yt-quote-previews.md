# Session 2026-05-07 - Deposit YT Quote Previews

## Scope

Implement Epic 3 Slice 2 — deposit YT quote previews from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`.

## Work completed

- Added tranche `previewDeposit(amountYt)` read helper in `ContractReaderService`.
- Exposed deposit preview through `QuoteSimulationService`.
- Updated `QuotesService.quoteDepositYt()` to use selected tranche `previewDeposit(amountYt)` for `estimate.sharesOut` instead of identity assumption.
- Preserved derived NAV/risk capacity checks and availability reasons.
- Preserved no-sender and no-calldata action-hint behavior.
- Set deposit YT source labels so `sharesOut` and estimate source are `live_contract_preview`; constraints remain `derived`.

## Files changed

- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.spec.ts`
- `backend/src/modules/quotes/quote-simulation.service.ts`
- `backend/src/modules/quotes/quote-simulation.service.spec.ts`
- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/quotes/quotes.service.spec.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-deposit-yt-quote-previews.md`

## Docs changed

- `docs/canonical/api-contract.md`: documented deposit YT `sharesOut` live tranche preview source and derived NAV/risk constraints.
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Slice 2 complete and Slice 3 active.
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`: updated next-agent prompt to withdraw YT quote previews.

## API impact for FE

API data-source/behavior change. `POST /quotes/deposit-yt` response shape is unchanged, but `estimate.sharesOut` now comes from selected tranche `previewDeposit(amountYt)` and source labels include `sharesOut = live_contract_preview`; NAV/risk constraints remain derived. FE action needed: none if existing code treats labels as informational; QA fixtures should update identity-assumed share outputs when tranche exchange rate is not 1:1.

## Verification run

- `pnpm test src/modules/quotes/quotes.service.spec.ts src/modules/quotes/quote-simulation.service.spec.ts` — failed before implementation for missing preview calls, then passed after implementation.
- `pnpm test src/shared/blockchain/contract-reader.service.spec.ts src/modules/quotes/quotes.service.spec.ts src/modules/quotes/quote-simulation.service.spec.ts` — passed.
- `pnpm test -- quotes` — passed with existing DepositRequestProjector warning logs in tests.
- `pnpm lint` — passed.

## Architecture docs checked

Architecture docs checked; no update needed. `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` remain accurate because this adds a live contract read within the existing Quotes/shared blockchain dependency and does not change module boundaries, dependency graph, runtime flow, infrastructure, or data ownership.

## Remaining risks

- `previewDeposit` can still differ from mined `depositYT` if contract state changes before user submission.
- Withdraw YT preview helpers are not implemented in this slice; they remain for Slice 3.

## Next step

Start Epic 3 Slice 3 — withdraw YT quote previews.
