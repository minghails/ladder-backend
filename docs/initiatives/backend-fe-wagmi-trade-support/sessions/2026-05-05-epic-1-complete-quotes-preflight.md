# Session — Epic 1 Complete Quotes Preflight

Date: 2026-05-05

## Scope

Completed remaining Epic 1 slices after Slice 1:

- Slice 2 — Correct withdraw quote.
- Slice 3 — Upgrade base instant quote hints.

## Changes

- Corrected `quoteWithdrawYt` action hints to Market `withdraw`.
- Added `mode = shares|assets`, `amount`, and `receiver` support while preserving legacy `shares` input.
- Added ST/JT approval hints for Market spender.
- Added `ZERO_AMOUNT`, `ZERO_RECEIVER`, and `JUNIOR_WITHDRAWAL_CAPACITY_EXCEEDED` availability checks.
- Upgraded `quoteDepositBase` response with `depositInstant` args and approval object.
- Added optional `minYtOut`, `receiver`, and `referrerId` input support.
- Updated quote Swagger request DTOs.
- Updated canonical API contract for deposit-base and withdraw-yt action semantics.

## TDD record

Slice 2 RED verified with:

```text
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected failures: withdraw still returned tranche `redeem`, lacked Market `withdraw` args/approval, and lacked capacity/zero checks.

Slice 2 GREEN verified with same command: 11 tests passed before Slice 3 work.

Slice 3 RED verified with:

```text
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected failure: deposit-base lacked `estimate`, structured `action.args`, and `action.approval`.

Slice 3 GREEN verified with same command: 9 tests passed after final consolidation.

## API impact for FE

`API contract change`.

- `POST /quotes/deposit-base` now returns structured `action.args` for `depositInstant` and `action.approval` for base token approval to Market.
- `POST /quotes/withdraw-yt` now models Market `withdraw`, supports `mode`, `amount`, `receiver`, and returns ST/JT approval hints to Market.
- `POST /quotes/deposit-yt` from Slice 1 remains part of Epic 1 API change.

FE before/after:

- Before: withdraw action pointed at tranche `redeem` with no approval object; base action had only loose approval fields.
- After: FE can use returned `action.contract`, `action.method`, `action.args`, and `action.approval` for all quote flows without backend calldata.

## Architecture docs

Architecture docs checked; no update needed.

Reason: no module boundary, dependency graph, runtime flow, infrastructure, DB schema, data ownership, indexing semantics, or source-of-truth assumptions changed. API contract doc updated because response/request shapes changed.

## Epic API impact summary

Epic 1 changed quote contracts for:

- `POST /quotes/deposit-yt` — new endpoint.
- `POST /quotes/withdraw-yt` — response semantics changed to Market `withdraw`; request supports `mode`, `amount`, `receiver`.
- `POST /quotes/deposit-base` — response now includes structured `depositInstant` args and approval hints; request supports `minYtOut`, `receiver`, `referrerId`.

Docs updated: `docs/canonical/api-contract.md`.

Open FE follow-ups: confirm whether FE wants ordered args array in addition to object args.

## Verification

- `pnpm test src/modules/quotes/quotes.service.spec.ts` — passed, 9 tests.
- `pnpm lint` — passed.
- `pnpm build` — passed, TSC found 0 issues.

## Remaining risks

- Quote responses remain preflight only; chain state can change before transaction mines.
- Base instant estimate remains `placeholder` until exact adaptor quote read exists.
- Direct YT deposit/withdraw still use latest YT price and do not trigger price update.

## Next step

Epic 2 — Complete trade constraints for FE forms.
