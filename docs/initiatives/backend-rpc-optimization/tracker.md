# Backend RPC Optimization Tracker

## Plan

`backend/docs/plans/2026-05-20-backend-rpc-optimization.md`

## Current status

- Status: completed (Milestones 1–3)
- Active epic: —
- Active slice: —
- Latest session log: `sessions/2026-05-20-review-fixes.md`

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
| Multicall contract reads | `epics/2026-05-20-epic-02-multicall-contract-reads.md` | completed |
| Lighter projector and snapshot RPC reduction | `epics/2026-05-20-epic-03-lighter-projector-snapshot-rpc.md` | completed |

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
| Slice 1 — Multicall market state | completed | 2 multicall batches vs 18 readContract calls |
| Slice 2 — Multicall token metadata and tranche share prices | completed | ERC20 + tranche share price batching |
| Slice 3 — Multicall portfolio wallet reads | completed | balanceOf batch + conditional convertToAssets |

### Epic 3: Lighter projector and snapshot RPC reduction

| Slice | Status | Notes |
|---|---|---|
| Slice 1 — Projector watched addresses from DB | completed | DB ST/JT addresses for getLogs when row fresh |
| Slice 2 — Bounded live metadata refresh for projector bootstrap | completed | PROJECTOR_MARKET_REFRESH_MS + updatedAt staleness |
| Slice 3 — Snapshot projector fallback tightening | completed | Prior snapshot share prices and max ratio before RPC |

## Slice log

| Date | Slice | Status | API impact | Notes |
|---|---|---|---|---|
| 2026-05-20 | Activation | completed | No FE-facing API impact | Plan written; initiative scaffold created. |
| 2026-05-20 | Epic 1 Slice 1 | completed | No FE-facing API impact | RpcReadCache + RPC_READ_CACHE_TTL_MS env; architecture docs checked, no update needed. |
| 2026-05-20 | Epic 1 Slice 2 | completed | No FE-facing API impact | Cached getMarketState/getTokenMetadata; errors not cached. |
| 2026-05-20 | Epic 1 Slice 3 | completed | No FE-facing API impact | Portfolio overview passes preloaded market to positions path. |
| 2026-05-20 | Epic 1 complete | completed | No FE-facing API impact | Milestone 1 done; see `sessions/2026-05-20-epic-01-complete.md`. |
| 2026-05-20 | Epic 2 Slice 1 | completed | No FE-facing API impact | Market state via 2 multicall batches. |
| 2026-05-20 | Epic 2 Slice 2 | completed | No FE-facing API impact | Token metadata + tranche share prices multicall. |
| 2026-05-20 | Epic 2 Slice 3 | completed | No FE-facing API impact | Portfolio balances multicall; zero balance skips convert batch. |
| 2026-05-20 | Epic 2 complete | completed | No FE-facing API impact | Milestone 2 done; see `sessions/2026-05-20-epic-02-complete.md`. |
| 2026-05-20 | Epic 3 Slice 1 | completed | No FE-facing API impact | Watched addresses from markets table when row fresh. |
| 2026-05-20 | Epic 3 Slice 2 | completed | No FE-facing API impact | Bounded refresh via PROJECTOR_MARKET_REFRESH_MS. |
| 2026-05-20 | Epic 3 Slice 3 | completed | No FE-facing API impact | Snapshot projector prefers prior data before RPC. |
| 2026-05-20 | Epic 3 complete | completed | No FE-facing API impact | Milestone 3 done; initiative plan fully implemented. |
| 2026-05-20 | Review fix follow-up | completed | No FE-facing API impact | Fixed snapshot share-price freshness for price/settlement events, normalized market cache keys, narrowed projector context, configured viem chain metadata for multicall, strengthened multicall/env tests; Architecture docs checked, no update needed. |

## Remaining risks

- Historical catch-up still consumes significant RPC even after optimization.
- Short cache TTL vs freshness trade-off must be validated in pilot.
- Process-local cache means each replica maintains its own refresh pattern.

## Next step

Initiative plan complete. Optional follow-up: `pnpm test:chain` and pilot RPC quota validation.
