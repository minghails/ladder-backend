# Production Endpoint Readiness Tracker

## Plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md`

## Current status

- Status: implementation in progress
- Active epic: `epics/2026-05-07-market-metadata-apy-charts.md`
- Active slice: Slice 3 — production factsheet service
- Latest session log: `sessions/2026-05-07-apy-snapshots-service.md`

## Execution rules

- Work one bounded slice per session.
- Before marking a backend slice done, check canonical docs per `backend/docs/HANDOFF.md`.
- Record API impact category after each slice.
- Do not scan unrelated initiatives or plans.
- Do not implement admin endpoints in this initiative.
- Do not implement code during preparation sessions.

## Epics

| Epic | File | Status |
|---|---|---|
| Mock removal guardrails | `epics/2026-05-07-mock-removal-guardrails.md` | completed |
| Market metadata, APY, factsheet, charts | `epics/2026-05-07-market-metadata-apy-charts.md` | active |
| Quote production accuracy | `epics/2026-05-07-quote-production-accuracy.md` | pending |
| Portfolio read models without mocks | `epics/2026-05-07-portfolio-read-models.md` | pending |
| Verification and release gates | `epics/2026-05-07-verification-release-gates.md` | pending |

## Slice backlog

### Epic 1: Mock removal guardrails

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — production mock policy helper | completed | Mock helper centralizes sandbox-only policy; docs updated. |
| Slice 2 — remove production chart fixtures | completed | Chart config now contains labels/units only; production series use indexed snapshots or unavailable. |

### Epic 2: Market metadata, APY, factsheet, charts

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — live token metadata reads | completed | Added ERC20 metadata reads; base token address remains config/deployment source, symbol/decimals live ERC20 metadata. |
| Slice 2 — APY snapshots and APY service | completed | `market_snapshots` now stores ST/JT share prices from `convertToAssets(1e18)` and market APY uses indexed snapshots or unavailable fallback. |
| Slice 3 — production factsheet service | active | every row sourced |
| Slice 4 — production chart source behavior | pending | utilization unavailable, yield from APY snapshots |

### Epic 3: Quote production accuracy

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — quote simulation service extraction | pending | move simulation/previews into focused service |
| Slice 2 — deposit YT quote previews | pending | use `previewDeposit` |
| Slice 3 — withdraw YT quote previews | pending | use `previewRedeem` / `previewWithdraw` |

### Epic 4: Portfolio read models without mocks

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — validate projector event coverage | pending | projection completeness + partial history |
| Slice 2 — production portfolio overview | pending | no mock summary/default rows |
| Slice 3 — production earnings/history | pending | real snapshots/cashflows only |
| Slice 4 — production claimables, requests, activities | pending | DB/indexed rows only |

### Epic 5: Verification and release gates

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — production endpoint audit tests | pending | no mock source/default responses |
| Slice 2 — end-to-end production smoke | pending | final verification gate |

## Slice log

| Date | Slice | Status | API impact | Notes |
|---|---|---|---|---|
| 2026-05-07 | Activation | completed | No FE-facing API impact | Initiative scaffold created from plan. |
| 2026-05-07 | Preparation | completed | No FE-facing API impact | All epics/slices/tracker/kickoff docs generated; no source code implemented. |
| 2026-05-07 | Slice 1 — production mock policy helper | completed | API data-source/behavior change | Portfolio `includeMock=true` now returns mock rows only when `PORTFOLIO_MOCK_FALLBACK=true` and `NODE_ENV !== 'production'`; canonical API docs updated. Architecture docs checked; no update needed. |
| 2026-05-07 | Slice 2 — remove production chart fixtures | completed | No FE-facing API impact | Chart fixture values/series removed from config; existing chart API behavior preserved: indexed metrics use snapshots, yield/utilization unavailable. Architecture docs checked; no update needed. |
| 2026-05-07 | Epic 2 Slice 1 — live token metadata reads | completed | API data-source/behavior change | Base token symbol/decimals now use live ERC20 metadata reads; `trade-constraints` token source label changed to `config_address_live_metadata`; canonical API docs updated. Architecture docs checked; no update needed. |
| 2026-05-07 | Epic 2 Slice 2 — APY snapshots and APY service | completed | API contract change | Added `apySource` to market tranche objects and APY now comes from indexed tranche share-price snapshots when available; canonical API and backend architecture docs updated. |
