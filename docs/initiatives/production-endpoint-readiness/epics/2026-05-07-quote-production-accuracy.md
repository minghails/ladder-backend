# Epic: Quote Production Accuracy

## Goal

Make quote endpoints clearly distinguish live reads, on-chain previews/simulations, and derived constraints without returning misleading estimates.

## Source plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md` Chunk 3.

## Slices

### Slice 1 — quote simulation service extraction

**Plan task:** Task 7

**Scope**

- Move base instant simulation logic out of `QuotesService` into `QuoteSimulationService`.
- Add strict revert reason mapping.
- Add tranche preview helpers where ABI supports them.

**Likely files**

- `backend/src/modules/quotes/quote-simulation.service.ts`
- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/modules/quotes/quote-simulation.service.spec.ts`

**Acceptance**

- Existing `deposit-base` behavior remains stable.
- Simulation source labels stay accurate.
- Tests cover success, revert, missing sender, zero amount, zero receiver, stale warning, halted market.

### Slice 2 — deposit YT quote previews

**Plan task:** Task 8

**Scope**

- Use tranche `previewDeposit(amountYt)` for `sharesOut` instead of identity assumption.
- Preserve derived NAV/risk capacity checks.
- Do not require sender or encoded calldata.

**Likely files**

- `backend/src/modules/quotes/quotes.service.ts`
- quotes service/controller specs
- `docs/canonical/api-contract.md` if response sources/fields change

**Acceptance**

- `sharesOut` source is `live_contract_preview` when preview succeeds.
- Constraints source remains derived.
- Action hints remain no-calldata wallet hints.

### Slice 3 — withdraw YT quote previews

**Plan task:** Task 9

**Scope**

- For `mode='shares'`, use `previewRedeem(shares)` for YT assets out.
- For `mode='assets'`, use `previewWithdraw(assets)` if ABI supports it; otherwise label exact shares estimate unavailable.
- Preserve junior withdrawal capacity derivation.

**Likely files**

- `backend/src/modules/quotes/quotes.service.ts`
- quotes service/controller specs
- `docs/canonical/api-contract.md` if response sources/fields change

**Acceptance**

- `derived_identity` no longer appears when preview is available.
- Revert/unavailable cases have explicit reasons/source labels.
- FE action hints stay stable unless docs are updated.

## Epic completion criteria

- Quote endpoints are production-safe preflight responses.
- No quote endpoint implies mined tx success without simulation.
- API impact summary added to tracker.
