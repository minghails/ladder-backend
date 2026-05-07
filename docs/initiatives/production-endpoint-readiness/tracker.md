# Production Endpoint Readiness Tracker

## Plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md`

## Current status

- Status: prepared for implementation
- Active epic: `epics/2026-05-07-mock-removal-guardrails.md`
- Active slice: Slice 1 — production mock policy helper
- Latest session log: `sessions/2026-05-07-prepare-implementation.md`

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
| Mock removal guardrails | `epics/2026-05-07-mock-removal-guardrails.md` | active |
| Market metadata, APY, factsheet, charts | `epics/2026-05-07-market-metadata-apy-charts.md` | pending |
| Quote production accuracy | `epics/2026-05-07-quote-production-accuracy.md` | pending |
| Portfolio read models without mocks | `epics/2026-05-07-portfolio-read-models.md` | pending |
| Verification and release gates | `epics/2026-05-07-verification-release-gates.md` | pending |

## Slice backlog

### Epic 1: Mock removal guardrails

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — production mock policy helper | active | Next implementation slice |
| Slice 2 — remove production chart fixtures | pending | Run after Slice 1 |

### Epic 2: Market metadata, APY, factsheet, charts

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — live token metadata reads | pending | ERC20 metadata + base token source labels |
| Slice 2 — APY snapshots and APY service | pending | `convertToAssets(1e18)` snapshots |
| Slice 3 — production factsheet service | pending | every row sourced |
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
