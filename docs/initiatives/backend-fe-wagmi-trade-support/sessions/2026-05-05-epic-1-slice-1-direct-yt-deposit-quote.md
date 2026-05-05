# Session — Epic 1 Slice 1 Direct YT Deposit Quote

Date: 2026-05-05

## Scope

Epic 1 Slice 1 only: add direct YT deposit quote/preflight for Market `depositYT(bool asSenior,uint256 amount)`.

## Changes

- Added `QuotesService.quoteDepositYt`.
- Added `POST /quotes/deposit-yt` controller route.
- Added Swagger DTOs for deposit-YT request/response.
- Added TDD tests for junior availability, senior capacity failure, senior first-deposit rule, zero amount, and wagmi action/approval hints.
- Updated canonical API contract with `/quotes/deposit-yt`.

## TDD record

RED verified with:

```text
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected failure: `TypeError: service.quoteDepositYt is not a function` for four new tests.

GREEN verified with same command: 8 tests passed.

## API impact for FE

`API contract change`.

Added `POST /quotes/deposit-yt` request shape:

```json
{
  "market": "0x...",
  "tranche": "senior|junior",
  "amountYt": "1000000000000000000"
}
```

Response includes `input`, derived `estimate`, `availability`, `warnings`, `action`, and `dataQuality`. `action.method = depositYT`, `action.contract = market`, `action.calldataIncluded = false`, and `action.approval` targets YT token approval to Market.

## Architecture docs

Architecture docs checked; no update needed.

Reason: no module boundary, dependency graph, runtime flow, infrastructure, DB schema, data ownership, indexing semantics, or source-of-truth assumptions changed. API contract doc updated because endpoint was added.

## Verification

- `pnpm test src/modules/quotes/quotes.service.spec.ts` — passed.
- `pnpm lint` — passed.
- `pnpm build` — passed, TSC found 0 issues.

## Remaining risks

- Quote remains preflight only; chain state can change before FE transaction mines.
- Direct YT deposit uses latest stored YT price and does not trigger on-chain price update.
- Further quote action upgrades remain in Epic 1 Slices 2 and 3.

## Next step

Epic 1 Slice 2 — Correct withdraw quote.
