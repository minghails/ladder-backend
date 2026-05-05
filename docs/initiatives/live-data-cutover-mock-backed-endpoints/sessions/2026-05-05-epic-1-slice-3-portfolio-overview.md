# Session — Epic 1 Slice 3 Portfolio Overview

Date: 2026-05-05

## Scope

Epic 1 Slice 3 — Portfolio overview unavailable aggregates.

## Changes

- Added overview test proving financial aggregates ignore `PORTFOLIO_MOCK_FALLBACK` and return zero/unavailable by default.
- Changed overview mock previews, financial aggregates, claimable preview, and lazy links to use explicit `includeMock=true` sandbox mode only.
- Changed default overview `netApySource` expectations from `placeholder` to `unavailable`.
- Updated canonical API docs for overview unavailable aggregate behavior and env fallback limits.

## TDD record

RED verified with:

```text
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected failure: overview financial aggregates received mock values when `PORTFOLIO_MOCK_FALLBACK=true`.

GREEN verified with:

```text
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Result: 15 tests passed.

## API impact for FE

`API data-source/behavior change`.

- `/portfolio/:address`: default overview financial aggregates now return zero values with source `unavailable` instead of `placeholder`/env mock values.
- `/portfolio/:address`: claimable preview and mock links now require explicit `includeMock=true` sandbox mode.
- FE action needed: review copy/branches for `placeholder`, `unavailable`, empty claimable preview, and sandbox links.

## Architecture docs sync

- Updated: none.
- Checked; no update needed: source labels and mock gating changed inside existing Portfolio service; no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes.
- Architecture docs checked; no update needed.

## Verification

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS, 15 tests passed.
- `pnpm lint` — PASS.
- `pnpm build` — PASS, TSC found 0 issues and SWC compiled 97 files.

## Remaining risks

- Market chart mock cutover remains pending Epic 2.
- Withdraw quote placeholder cutover remains pending Epic 3.
- Vitest printed existing Vite/Oxc config warnings; tests passed.

## Next step

Epic 2 Slice 1 — Yield and utilization charts return unavailable.
