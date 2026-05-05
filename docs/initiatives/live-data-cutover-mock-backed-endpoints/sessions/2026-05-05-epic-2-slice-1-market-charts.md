# Session — Epic 2 Slice 1 Market Charts

Date: 2026-05-05

## Scope

Epic 2 Slice 1 — Yield and utilization charts return unavailable.

## Changes

- Added tests proving `yield` and `utilization` charts return empty unavailable payloads instead of mock fixtures.
- Replaced non-indexed chart mock branch with empty unavailable response.
- Removed unused chart timestamp fixture helper.
- Updated canonical API docs for chart source behavior.

## TDD record

RED verified with:

```text
pnpm test src/modules/market-state/market-state.service.spec.ts
```

Expected failure: yield/utilization charts returned mock headline/series/dataQuality.

GREEN verified with:

```text
pnpm test src/modules/market-state/market-state.service.spec.ts
```

Result: 17 tests passed.

## API impact for FE

`API data-source/behavior change`.

- `/markets/:address/charts?metric=yield`: now returns `series: []`, headline value `0`, and source `unavailable` instead of mock series.
- `/markets/:address/charts?metric=utilization`: now returns `series: []`, headline value `0`, and source `unavailable` instead of mock series.
- FE action needed: review chart empty states and unavailable-series copy.

## Architecture docs sync

- Updated: none.
- Checked; no update needed: chart data-source behavior changed inside existing Market State service; no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes.
- Architecture docs checked; no update needed.

## Verification

- `pnpm test src/modules/market-state/market-state.service.spec.ts` — PASS, 17 tests passed.
- `pnpm lint` — PASS.
- `pnpm build` — PASS, TSC found 0 issues and SWC compiled 97 files.

## Remaining risks

- Withdraw quote placeholder cutover remains pending Epic 3.
- Cross-endpoint verification remains pending Epic 4.
- Vitest printed existing Vite/Oxc config warnings; tests passed.

## Next step

Epic 3 Slice 1 — Withdraw output uses derived labels.
