# Epic 3 — Withdraw Quote Placeholder Cutover

## Goal

Make `POST /quotes/withdraw-yt` output source truthful by replacing placeholder labels with deterministic derived labels.

## Scope

- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/quotes/quotes.service.spec.ts`
- `docs/canonical/api-contract.md`

## Slices

### Slice 1 — Withdraw output uses derived labels

Tasks:

1. Read only:
   - active plan
   - tracker
   - this epic
   - latest Epic 2 Slice 1 session log
   - `backend/src/modules/quotes/quotes.service.ts`
   - `backend/src/modules/quotes/quotes.service.spec.ts`
   - withdraw quote section of `docs/canonical/api-contract.md`
2. Add failing tests from plan Task 5:
   - `mode='assets'` returns `output.amount = amount`, `output.estimateType = 'derived'`, `dataQuality.sources.output = 'derived'`.
   - `mode='shares'` returns `output.amount = amount`, `output.estimateType = 'derived_identity'`, `dataQuality.sources.output = 'derived_identity'`.
3. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` and record RED because current output is `placeholder`.
4. In `quoteWithdrawYt(...)`, compute `outputEstimateType = mode === 'assets' ? 'derived' : 'derived_identity'`.
5. Set `output.estimateType` and `dataQuality.sources.output` from `outputEstimateType`.
6. Preserve existing availability, halt, cap, disabled, receiver, market, tranche, and input validation behavior.
7. Update `docs/canonical/api-contract.md` quote section:
   - `mode='assets'` returns `output.estimateType = 'derived'`.
   - `mode='shares'` returns `output.estimateType = 'derived_identity'` until tranche `previewRedeem` simulation is wired.
   - FE must treat shares mode as preflight only.
8. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` and record GREEN.
9. Check architecture docs sync. Expected: `Architecture docs checked; no update needed` if no new contract-reader RPC added.
10. Write session log `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/sessions/2026-05-05-epic-3-slice-1-withdraw-quotes.md`.
11. Update tracker next slice to Epic 4 Slice 1.

## API impact for FE

`API data-source/behavior change`.

- `/quotes/withdraw-yt`: output source no longer `placeholder`; `assets` mode uses `derived`, `shares` mode uses `derived_identity`.
- FE action needed: review source labels and ensure shares mode copy treats quote as preflight only.

## Verification

- `pnpm test src/modules/quotes/quotes.service.spec.ts`
- Epic-level later: `pnpm test`, `pnpm lint`, `pnpm build`

## Architecture docs check

Expected no architecture update if implementation only changes labels/derived output. If implementation adds a new `ContractReaderService.previewRedeem` or tranche simulation read, update `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` as needed.
