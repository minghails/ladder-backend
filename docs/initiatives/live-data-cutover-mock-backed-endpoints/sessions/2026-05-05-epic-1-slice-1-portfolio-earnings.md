# Session — Epic 1 Slice 1 Portfolio Earnings

Date: 2026-05-05

## Scope

Epic 1 Slice 1 — Portfolio earnings default unavailable.

## Changes

- Added earnings tests proving default behavior ignores `PORTFOLIO_MOCK_FALLBACK` and returns empty/unavailable data.
- Preserved explicit `includeMock=true` earnings sandbox behavior.
- Changed `getEarnings(...)` to use explicit mock opt-in only.
- Updated canonical API docs for `/portfolio/:address/earnings` behavior.

## TDD record

RED verified with:

```text
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected failure: default earnings test received mock rows/dataQuality when `PORTFOLIO_MOCK_FALLBACK=true`.

GREEN verified with:

```text
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Result: 12 tests passed.

## API impact for FE

`API data-source/behavior change`.

- `/portfolio/:address/earnings`: default live mode now returns empty `earnings`, empty history, and unavailable data-quality sources instead of env mock fallback rows.
- Explicit `includeMock=true` still returns sandbox mock earnings/history.
- FE action needed: review empty state/source-label copy for earnings.

## Architecture docs sync

- Updated: none.
- Checked; no update needed: service behavior/source-label change only; no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes.
- Architecture docs checked; no update needed.

## Verification

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS, 12 tests passed.

## Remaining risks

- Other portfolio endpoints still have mock/default behavior pending Epic 1 Slice 2 and Slice 3.
- Vitest printed existing Vite/Oxc config warnings; tests passed.

## Next step

Epic 1 Slice 2 — Portfolio claimables default empty.
