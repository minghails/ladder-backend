# Epic: Market Metadata, APY, Factsheet, Charts

## Goal

Replace market metadata/chart placeholders with truthful production data sources and explicit unavailable states.

## Source plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md` Chunk 2.

## Slices

### Slice 1 — live token metadata reads

**Plan task:** Task 3

**Scope**

- Add minimal ERC20 `symbol()` and `decimals()` ABI support.
- Add `getTokenMetadata(address)` in contract reader.
- Replace hardcoded token symbol/decimals where safe.
- Keep base token address from deployment/adaptor-approved config if current contract/adaptor does not expose it.

**Likely files**

- `backend/src/shared/blockchain/contracts/index.ts` or existing ABI export file.
- `backend/src/shared/blockchain/contract-reader.service.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.spec.ts`

**Acceptance**

- Token metadata is read from live ERC20 contracts when required.
- Required metadata read failure fails clearly; no silent fake values.
- Data-quality labels distinguish config address source from live metadata source when needed.

### Slice 2 — APY snapshots and APY service

**Plan task:** Task 4

**Scope**

- Add APY snapshot source for `st.convertToAssets(1e18)` and `jt.convertToAssets(1e18)`.
- Add repository/service to compute ST/JT APY from valid snapshot pairs.
- Use compound annualized formula if practical; simple annualized fallback allowed by plan.
- Return `unavailable` with fewer than 2 valid points.

**Likely files**

- `backend/src/modules/market-state/market-apy.service.ts`
- `backend/src/modules/market-state/market-analytics.repository.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- optional `backend/src/shared/database/schema/market-apy-snapshots.ts`
- optional projector snapshot writer files
- `backend/src/modules/market-state/market-apy.service.spec.ts`

**Acceptance**

- APY never comes from NAV-only math.
- APY never appears live when unavailable.
- Tests cover unavailable, positive, and negative APY.
- Canonical docs updated if response shape/source semantics change.

### Slice 3 — production factsheet service

**Plan task:** Task 5

**Scope**

- Split factsheet fields into live/config/unavailable.
- Remove rows that cannot be sourced truthfully.
- Ensure every row has a source.

**Likely files**

- `backend/src/modules/market-state/market-factsheet.service.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/modules/market-state/market-metadata.config.ts`
- `backend/src/modules/market-state/market-factsheet.service.spec.ts`
- `docs/canonical/api-contract.md` if row semantics change

**Acceptance**

- Factsheet no longer looks like live analytics when it is config metadata.
- Every row source is explicit.

### Slice 4 — production chart source behavior

**Plan tasks:** Task 2 continuation + Task 6

**Scope**

- Keep `tvl`, `tokenPrice`, `ratio` from indexed market snapshots.
- Use APY snapshots for `yield` when available.
- Superseded on 2026-05-11: return `utilization` from indexed snapshot `currentStJtRatio / maxStJtRatio` when chart history exists.
- Remove/isolate fixture series from production paths.

**Likely files**

- `backend/src/modules/market-state/market-analytics.repository.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/modules/market-state/market-metadata.config.ts`
- market chart specs

**Acceptance**

- Superseded on 2026-05-11: `utilization` returns indexed snapshot series when history exists; empty history returns `source='unavailable'`.
- `yield` returns indexed APY series or unavailable when insufficient snapshots.
- No fixture chart rows in default/production output.

## Epic completion criteria

- Market endpoints have truthful source labels for token metadata, APY, factsheet, and charts.
- Docs updated for API behavior/source changes.
- API impact summary added to tracker.
