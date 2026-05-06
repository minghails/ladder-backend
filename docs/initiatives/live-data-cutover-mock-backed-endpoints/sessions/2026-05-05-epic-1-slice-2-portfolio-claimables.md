# Session — Epic 1 Slice 2 Portfolio Claimables

Date: 2026-05-05

## Scope

Epic 1 Slice 2 — Portfolio claimables default empty.

## Changes

- Added claimables tests proving default behavior ignores `PORTFOLIO_MOCK_FALLBACK` and returns empty live list.
- Preserved explicit `includeMock=true` claimables sandbox behavior with disabled mock actions.
- Changed `getClaimables(...)` to use explicit mock opt-in only.
- Updated overview claimable preview/amount to use explicit sandbox mock only.
- Updated canonical API docs for `/portfolio/:address/claimables` behavior.

## TDD record

RED verified with:

```text
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected failure: default claimables test received mock rows when `PORTFOLIO_MOCK_FALLBACK=true`.

GREEN verified with:

```text
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Result: 14 tests passed.

## API impact for FE

`API data-source/behavior change`.

- `/portfolio/:address/claimables`: default live mode now returns empty list instead of env mock fallback rows.
- Explicit `includeMock=true` still returns disabled sandbox mock claimable rows.
- `/portfolio/:address`: claimable preview no longer appears from env fallback; explicit `includeMock=true` still shows sandbox preview.
- FE action needed: review claimables empty-state copy.

## Architecture docs sync

- Updated: none.
- Checked; no update needed: service behavior/source-label change only; no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes.
- Architecture docs checked; no update needed.

## Verification

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS, 14 tests passed.

## Remaining risks

- Overview money-like aggregate source labels still pending Epic 1 Slice 3.
- Vitest printed existing Vite/Oxc config warnings; tests passed.

## Next step

Epic 1 Slice 3 — Portfolio overview unavailable aggregates.
