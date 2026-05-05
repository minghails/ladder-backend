# Epic 1 — Contract Simulation Service

## Goal

Add a focused viem simulation helper for `Market.depositInstant(...)` and exact tranche share preview.

## Scope

- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/modules/quotes/quotes.service.spec.ts` only for initial RED test that drives service integration.

## Slices

### Slice 1 — Add simulation helper

Status: active first slice.

Tasks:

1. Read only:
   - `backend/src/shared/blockchain/contract-reader.service.ts`
   - `backend/src/modules/quotes/quotes.service.ts`
   - `backend/src/modules/quotes/quotes.service.spec.ts`
   - `backend/src/shared/blockchain/contracts/index.ts`
2. Write failing test in `quotes.service.spec.ts` proving `quoteDepositBase` should call `simulateDepositBaseInstant` with `sender`, `receiver`, Market args, and selected tranche token.
3. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` and record RED failure.
4. Add simulation input/result types to `ContractReaderService`.
5. Add `mapSimulationRevertReason(error)` helper.
6. Add `simulateDepositBaseInstant(input)` using `client.simulateContract` with `MARKET_ABI` and `account = sender`.
7. Add selected tranche `previewDeposit(ytOut)` read for exact shares.
8. Run `pnpm test src/modules/quotes/quotes.service.spec.ts`; expect still failing until Epic 2 integrates quotes.
9. Update session log and tracker.

## API impact for FE

`No FE-facing API impact` for this slice by itself if quotes response is not changed yet.

## Verification

- `pnpm test src/modules/quotes/quotes.service.spec.ts`
- `pnpm lint`
- `pnpm build`

## Architecture docs check

No module boundary expected. Record `Architecture docs checked; no update needed` unless implementation adds a new module/dependency boundary.
