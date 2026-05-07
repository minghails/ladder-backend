# Session 2026-05-07 - Withdraw YT Quote Previews

## Scope

Implement Epic 3 Slice 3 — withdraw YT quote previews from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`.

## Work completed

- Added tranche `previewRedeem(shares)` and `previewWithdraw(amountYt)` read helpers in `ContractReaderService`.
- Exposed withdraw preview helpers through `QuoteSimulationService`.
- Updated `QuotesService.quoteWithdrawYt()` so `mode='shares'` uses selected tranche `previewRedeem(shares)` for estimated YT assets out.
- Updated `mode='assets'` so selected tranche `previewWithdraw(assets)` returns estimated shares required.
- Preserved junior withdrawal capacity derivation, stale/halted warnings, no-calldata action hints, and existing action args.
- Removed `derived_identity` from production withdraw preview output when preview is available; output source is now `live_contract_preview`.

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
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-withdraw-yt-quote-previews.md`

## Docs changed

- `docs/canonical/api-contract.md`: documented withdraw YT live tranche preview output semantics for shares/assets modes.
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Epic 3 Slice 3 complete, added Epic 3 API impact summary, and activated Portfolio Slice 1.
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`: updated next-agent prompt to Portfolio Slice 1.

## API impact for FE

API data-source/behavior change. `POST /quotes/withdraw-yt` response containers remain stable, but `output.estimateType` is now `live_contract_preview` instead of `derived` / `derived_identity`. For shares mode, `output.amount` is estimated YT assets from `previewRedeem` and `output.shares` echoes input shares. For assets mode, `output.amount` remains requested YT assets and `output.sharesRequired` is estimated shares from `previewWithdraw`. FE action needed: update quote fixtures and any branching on `derived_identity`; transaction action hints remain unchanged.

## Verification run

- `pnpm test src/modules/quotes/quotes.service.spec.ts src/modules/quotes/quote-simulation.service.spec.ts src/shared/blockchain/contract-reader.service.spec.ts` — failed before implementation for missing preview calls, then passed after implementation.
- `pnpm test -- quotes` — passed with existing DepositRequestProjector warning logs in tests.
- `pnpm lint` — passed.

## Architecture docs checked

Architecture docs checked; no update needed. `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` remain accurate because this adds live contract reads within the existing Quotes/shared blockchain dependency and does not change module boundaries, dependency graph, runtime flow, infrastructure, or data ownership.

## Remaining risks

- Tranche previews can differ from mined withdraw results if contract state changes before user submission.
- Action approval amount remains unchanged with existing action hints; FE can use `output.sharesRequired` for display/validation if needed.

## Next step

Start Portfolio Slice 1 — validate projector event coverage.
