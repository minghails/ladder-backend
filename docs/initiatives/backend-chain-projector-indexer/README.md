# Backend Chain Projector / Indexer Initiative

## Purpose

Coordinate slice-by-slice backend implementation for:

- Plan: `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md`

## Scope

- Build replayable Chain Projector in existing NestJS modular monolith.
- Index configured Base Sepolia Market events into PostgreSQL.
- Persist safe cursor state and idempotent raw event rows.
- Derive market snapshots, price updates, and async deposit request lifecycle rows.
- Serve real market history/chart/request APIs from indexed data where plan requires.
- Keep existing live read APIs working while read-model coverage grows.

## Non-goals

- No signer management or raw private key handling.
- No admin transaction submission.
- No `updatePriceFromAdaptor()` or manual `updatePrice(...)` orchestration.
- No fee collection, reject/refund, or operator write orchestration.
- No Redis, BullMQ, Temporal, TimescaleDB, microservices, or separate worker service.
- No portfolio cost-basis/earnings calculations.
- No production risk automation.

## Source-of-truth order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. Relevant root `docs/canonical/*`
4. This plan: `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md`
5. Root `docs/raw/current-mvp/backend-mvp-implementation-plan.md` when canonical docs are insufficient
6. Backend source files under `backend/src/`

## Folder map

- `tracker.md` — active epic/slice, progress, risks, next action.
- `session-kickoff-prompt.md` — copy/paste prompt for next implementation agent.
- `architecture.md` — initiative-specific boundaries and flow.
- `decisions.md` — durable plan decisions.
- `templates.md` — epic, slice, and session templates.
- `epics/` — epic contracts with bounded slices.
- `sessions/` — append-only session logs.
- `runbooks/` — risky operation checklists.

## Current state

Initiative active. Start with Epic 1, Slice 1.

## Implementation rule

Work one bounded slice per session. Update `tracker.md` and write a session log before handoff.
