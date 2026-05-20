# Backend RPC Optimization Initiative

Generated from `backend/docs/plans/2026-05-20-backend-rpc-optimization.md`.

## Goal

Reduce backend RPC usage through in-process caching, viem multicall batching, portfolio read deduplication, and lighter chain-projector indexing paths — without changing public API contracts.

## Scope

- TTL cache for live contract reads.
- Multicall for market/token/tranche/portfolio reads.
- Projector address lookup from PostgreSQL `markets` table.
- Snapshot projector RPC fallback reduction.

## Out of scope

- Frontend polling changes.
- RPC provider/billing changes.
- Redis or external cache infrastructure.
- API shape changes.
- Contract or event schema changes.

## Source of truth

1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-20-backend-rpc-optimization.md`
5. `backend/docs/initiatives/backend-rpc-optimization/tracker.md`
