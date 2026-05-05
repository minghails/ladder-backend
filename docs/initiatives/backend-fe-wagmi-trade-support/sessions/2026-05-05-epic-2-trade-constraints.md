# Session — Epic 2 Trade Constraints

Date: 2026-05-05

## Scope

Completed Epic 2 — Complete trade constraints for FE forms.

## Changes

- Expanded `GET /markets/:address/trade-constraints` response with YT token metadata.
- Added FE approval targets for direct YT deposit, base instant deposit, Senior withdraw, and Junior withdraw.
- Added Market method names for `depositYT`, `depositInstant`, and `withdraw`.
- Added YT capacity aliases and raw `maxStJtRatio` / `currentStJtRatio` fields while preserving existing capacity fields.
- Updated Swagger DTOs for the expanded trade-constraints response.
- Updated canonical API contract for the expanded trade-constraints response.

## TDD record

RED verified with:

```text
pnpm test src/modules/market-state/market-state.service.spec.ts
```

Expected failure: trade constraints lacked `tokens.yt`, `approvals`, `methods`, YT capacity aliases, raw ratio fields, and data-quality labels for approvals/methods.

GREEN verified with same command: 17 tests passed.

## API impact for FE

`API contract change`.

- `GET /markets/:address/trade-constraints` now returns additional fields: `tokens.yt`, `approvals`, `methods`, `limits.seniorDepositCapacityYt`, `limits.juniorWithdrawalCapacityYt`, `limits.maxStJtRatio`, and `limits.currentStJtRatio`.
- Existing fields were preserved.

FE before/after:

- Before: FE had to hardcode YT token/approval targets and Market method names.
- After: FE can build trade forms and approval prompts from one constraints response without backend calldata.

## Architecture docs

Architecture docs checked; no update needed.

Reason: no module boundary, dependency graph, runtime flow, infrastructure, DB schema, data ownership, indexing semantics, or source-of-truth assumptions changed. API contract doc updated because response shape changed.

## Verification

- `pnpm test src/modules/market-state/market-state.service.spec.ts` — passed, 17 tests.

## Remaining risks

- Capacity aliases are derived from current NAV math and do not guarantee transaction success if chain state changes before mining.
- Direct YT deposit/withdraw still use latest YT price and can carry stale-price warnings.

## Next step

Epic 3 — Add tx status endpoint backed by indexed events.
