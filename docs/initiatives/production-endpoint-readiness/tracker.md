# Production Endpoint Readiness Tracker

## Plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md`

## Current status

- Status: implementation in progress
- Active epic: `epics/2026-05-07-portfolio-read-models.md`
- Active slice: Slice 2 — production portfolio overview
- Latest session log: `sessions/2026-05-07-portfolio-event-coverage.md`

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
| Market metadata, APY, factsheet, charts | `epics/2026-05-07-market-metadata-apy-charts.md` | completed |
| Quote production accuracy | `epics/2026-05-07-quote-production-accuracy.md` | completed |
| Portfolio read models without mocks | `epics/2026-05-07-portfolio-read-models.md` | active |
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
| Slice 3 — production factsheet service | completed | Factsheet rows now combine live contract fields, approved config copy, and explicit source labels; unsourced rows removed. |
| Slice 4 — production chart source behavior | completed | Yield chart now uses indexed APY snapshots when available; utilization remains unavailable. |

### Epic 3: Quote production accuracy

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — quote simulation service extraction | completed | Base instant simulation moved behind `QuoteSimulationService`; quote response behavior preserved. |
| Slice 2 — deposit YT quote previews | completed | `sharesOut` now uses tranche `previewDeposit(amountYt)` with live preview source labels. |
| Slice 3 — withdraw YT quote previews | completed | `output` now uses tranche `previewRedeem` / `previewWithdraw` with live preview source labels. |

### Epic 4: Portfolio read models without mocks

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — validate projector event coverage | completed | Required portfolio projection event coverage documented in tests; replay and partial-history behavior covered. |
| Slice 2 — production portfolio overview | active | no mock summary/default rows |
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
| 2026-05-07 | Epic 2 Slice 3 — production factsheet service | completed | API contract change | Factsheet rows now use live/config/mixed source labels and omit unsourced analytics/config claims; canonical API docs updated. Architecture docs checked; no update needed. |
| 2026-05-07 | Epic 2 Slice 4 — production chart source behavior | completed | API data-source/behavior change | `yield` charts now use indexed APY snapshots when at least two valid points exist and remain unavailable otherwise; `utilization` remains unavailable; canonical API docs updated. Architecture docs checked; no update needed. |
| 2026-05-07 | Epic 2 API impact summary | completed | API contract change | Market endpoints now expose live token metadata source labels, tranche `apySource`, production factsheet row sources, and indexed/unavailable chart sources. FE follow-ups: update market/factsheet/chart fixtures and read source labels for APY/yield availability. |
| 2026-05-07 | Epic 3 Slice 1 — quote simulation service extraction | completed | No FE-facing API impact | Extracted base instant simulation delegation into `QuoteSimulationService`; existing deposit-base quote response shape, action hints, and source labels preserved. Architecture docs checked; no update needed. |
| 2026-05-07 | Epic 3 Slice 2 — deposit YT quote previews | completed | API data-source/behavior change | `POST /quotes/deposit-yt` now uses selected tranche `previewDeposit(amountYt)` for `estimate.sharesOut`; NAV/risk constraints remain derived and no sender/calldata is required. Canonical API docs updated. Architecture docs checked; no update needed. |
| 2026-05-07 | Epic 3 Slice 3 — withdraw YT quote previews | completed | API data-source/behavior change | `POST /quotes/withdraw-yt` now uses selected tranche `previewRedeem(shares)` and `previewWithdraw(assets)` for output estimates; junior withdrawal capacity remains derived. Canonical API docs updated. Architecture docs checked; no update needed. |
| 2026-05-07 | Epic 3 API impact summary | completed | API data-source/behavior change | Quote endpoints now distinguish live contract reads, simulations, live tranche previews, and derived constraints. Deposit YT and withdraw YT preview outputs can differ from prior identity/derived fixture assumptions, but endpoint paths, requests, action hints, and response containers remain stable. FE follow-ups: update quote fixtures/source-label handling; no required transaction-building change. |
| 2026-05-07 | Epic 4 Slice 1 — validate projector event coverage | completed | No FE-facing API impact | Added explicit required portfolio event coverage contract and tests for deterministic replay and partial-history marking. Architecture docs checked; no update needed. |
