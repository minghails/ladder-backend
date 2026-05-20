# Backend RPC Optimization Tracker

## Plan

`backend/docs/plans/2026-05-20-backend-rpc-optimization.md`

## Current status

- Status: in progress
- Active epic: Epic 2 — Multicall contract reads
- Active slice: Slice 1 — Multicall market state
- Latest session log: `sessions/2026-05-20-epic-01-complete.md`

## Execution rules

- Work one bounded slice per session.
- Before marking a backend slice done, check canonical docs per `backend/docs/HANDOFF.md`.
- Record API impact category after each slice.
- Do not scan unrelated initiatives or plans.
- Backend-only scope; no FE changes in this initiative.
- Preserve live-contract response semantics and existing API shapes.

## Epics

| Epic | File | Status |
|---|---|---|
| RPC read cache and portfolio dedup | `epics/2026-05-20-epic-01-rpc-read-cache-portfolio-dedup.md` | completed |
| Multicall contract reads | `epics/2026-05-20-epic-02-multicall-contract-reads.md` | not started |
| Lighter projector and snapshot RPC reduction | `epics/2026-05-20-epic-03-lighter-projector-snapshot-rpc.md` | not started |

## Slice backlog

### Epic 1: RPC read cache and portfolio dedup

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — RPC read cache utility and env | completed | TTL cache helper + env/config |
| Slice 2 — Cache getMarketState and getTokenMetadata | completed | ContractReaderService TTL cache; errors not cached |
| Slice 3 — Portfolio overview market read dedup | completed | One getMarketState per portfolio overview request |

### Epic 2: Multicall contract reads

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — Multicall market state | not started | Replace ~18 sequential reads |
| Slice 2 — Multicall token metadata and tranche share prices | not started | Metadata + convertToAssets batch |
| Slice 3 — Multicall portfolio wallet reads | not started | Batch balanceOf / convertToAssets |

### Epic 3: Lighter projector and snapshot RPC reduction

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — Projector watched addresses from DB | not started | Avoid full getMarketState per batch |
| Slice 2 — Bounded live metadata refresh for projector bootstrap | not started | Refresh on missing row or interval |
| Slice 3 — Snapshot projector fallback tightening | not started | Prefer snapshot/event data before RPC |

## Slice log

| Date | Slice | Status | API impact | Notes |
|---|---|---|---|---|
| 2026-05-20 | Activation | completed | No FE-facing API impact | Plan written; initiative scaffold created. |
| 2026-05-20 | Epic 1 Slice 1 | completed | No FE-facing API impact | RpcReadCache + RPC_READ_CACHE_TTL_MS env; architecture docs checked, no update needed. |
| 2026-05-20 | Epic 1 Slice 2 | completed | No FE-facing API impact | Cached getMarketState/getTokenMetadata; errors not cached. |
| 2026-05-20 | Epic 1 Slice 3 | completed | No FE-facing API impact | Portfolio overview passes preloaded market to positions path. |
| 2026-05-20 | Epic 1 complete | completed | No FE-facing API impact | Milestone 1 done; see `sessions/2026-05-20-epic-01-complete.md`. |

## Remaining risks

- Historical catch-up still consumes significant RPC even after optimization.
- Short cache TTL vs freshness trade-off must be validated in pilot.
- Process-local cache means each replica maintains its own refresh pattern.

## Next step

Execute **Epic 2, Slice 1 — Multicall market state**.
