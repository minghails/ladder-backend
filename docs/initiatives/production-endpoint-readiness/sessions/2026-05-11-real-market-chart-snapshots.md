# Session: Real Market Chart Snapshots

## Scope

Implement follow-up chart requirement: replace remaining unavailable/mock-like production chart behavior with real indexed snapshot series for all five market chart metrics.

## Changes

- Added rolling junior APY series support to `MarketApyService`.
- Updated `/markets/:address/charts` so:
  - `yield` uses `MarketApyService` rolling adjacent APY windows from indexed ST/JT share-price snapshots.
  - `tokenPrice` uses snapshot `ytPrice`.
  - `tvl` uses snapshot `nav`.
  - `utilization` derives from snapshot `currentStJtRatio / maxStJtRatio`.
  - `ratio` uses snapshot semantic ST/JT ratio.
- Added `dataQuality.sources.charts` and set chart/series source labels to `indexed_snapshots` when real rows exist.
- Added `range=7d|30d|90d|1y`; omitted range defaults to `30d`, UI label casing is normalized, and unsupported ranges return `INVALID_CHART_RANGE`. Yield computes from full adjacent windows first, then filters points into range.
- Empty snapshot history now returns empty series with unavailable source labels instead of implying indexed availability.
- Removed remaining production Swagger/controller wording that referenced deterministic mock chart history.
- Added `market_snapshots.max_st_jt_ratio`, generated migration `0007_cultured_living_lightning.sql`, and updated `MarketSnapshotProjector` to carry `MaxStJtRatioUpdated` events into later snapshots.
- Added historical `maxStJtRatio` block reads for snapshot events before any prior cap point exists.
- Backfilled migration rows get `max_st_jt_ratio = '0'`; chart code treats zero cap as unavailable so old rows do not fabricate utilization.

## Verification

- `pnpm test src/modules/market-state/market-apy.service.spec.ts src/modules/market-state/market-state.service.spec.ts`
- `pnpm test src/shared/database/schema/projector-schema.spec.ts src/modules/chain-projector/market-snapshot.projector.spec.ts src/modules/market-state/market-state.service.spec.ts`
- `pnpm test src/shared/blockchain/contract-reader.service.spec.ts src/modules/chain-projector/market-snapshot.projector.spec.ts`
- `pnpm test`
- `pnpm build`
- `pnpm lint`
- `pnpm test:e2e test/e2e/production-smoke.spec.ts`

## Docs

- Updated `docs/canonical/api-contract.md`.
- Updated `docs/canonical/backend-architecture.md`.
- Updated `docs/canonical/smartcontract-events.md`.
- Updated `docs/canonical/integration-rules.md`.
- Updated initiative README/decisions/tracker.

## API impact

API contract change. Chart response shape adds `dataQuality.sources.charts`. Existing chart source labels for real series now use `indexed_snapshots`; empty chart history uses `unavailable`. FE should update fixtures and source-label branching for market charts.

## Architecture docs

Architecture docs updated for indexed chart source behavior and `market_snapshots.max_st_jt_ratio`.

## Remaining risks

- `yield` remains simple annualized APY via existing `MarketApyService` formula, not compound annualization.
