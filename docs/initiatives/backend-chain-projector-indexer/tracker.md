# Tracker — Backend Chain Projector / Indexer

## Active

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-01-minimum-working-projector.md`
- Slice: Slice 1 — projector config
- Plan: `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md`

## Planned

1. Epic 1 — Minimum Working Projector
   - Slice 1: projector config
   - Slice 2: idempotent event and cursor schema
   - Slice 3: market bootstrap and projector types
   - Slice 4: event normalizer and viem chain ID
   - Slice 5: `runOnce()` fetch/decode/persist/cursor core
   - Slice 6: optional background loop and README baseline
2. Epic 2 — Market Snapshots and History APIs
   - Slice 1: snapshot schema
   - Slice 2: snapshot projector
   - Slice 3: price update projector
   - Slice 4: `/markets/:address/history`
   - Slice 5: indexed chart metrics
3. Epic 3 — Async Deposit Request Lifecycle
   - Slice 1: deposit request schema
   - Slice 2: deposit request projector
   - Slice 3: deposit request detail endpoint
   - Slice 4: portfolio request mapping check
4. Epic 4 — Optional Portfolio Activities
   - Slice 1: derive activity rows from indexed events
5. Epic 5 — Runbook and Verification
   - Slice 1: projector runbook
   - Slice 2: canonical docs evaluation
   - Slice 3: full verification gate

## In Progress

- None yet. Next agent should start Epic 1, Slice 1.

## Next Up

1. Read `session-kickoff-prompt.md`.
2. Read active epic file only.
3. Implement Epic 1, Slice 1 with TDD.
4. Run targeted verification.
5. Update this tracker and add session log.

## Done

- 2026-05-04: Initiative docs generated from plan.

## Blocked

- Production-like indexing needs exact `DEPLOYMENT_BLOCK` for Market `0x3aDa769dC813e3376fCD40d05bEA12263048A487` on Base Sepolia.

## Risks

- Existing DB rows may make `NOT NULL` migration unsafe without backfill/default/reset approval.
- Existing DB column names include legacy `jt_st_ratio`; code/API must expose semantic `stJtRatio`.
- `market_snapshots.yt_price` is non-null; non-price snapshot events need carry-forward price.
- RPC rate limits may require smaller `PROJECTOR_BATCH_SIZE`.
- Multiple enabled app instances can race; MVP assumes exactly one `PROJECTOR_ENABLED=true` replica.
- Reorg handling is confirmation-based only; deeper rollback remains later work.
- Derived tables need idempotency, not only `market_events`.
- History timestamps must come from block timestamps, not processing time.

## Needs Decision

- Exact deployment block before real replay.
- Whether dev DB can be reset or migrations must backfill existing rows.
- Whether to add semantic `st_jt_ratio` columns or keep legacy storage with code/API mapping.
- Whether `POST /deposit-requests` remains deferred while event-sourced `GET` ships first.
- Whether optional portfolio activities are included in current implementation pass after Epics 1–3.

## Canonical docs to assess during execution

- `docs/canonical/api-contract.md` when `/markets/:address/history`, chart source semantics, or request detail behavior changes.
- `docs/canonical/backend-architecture.md` if MVP responsibility or module boundary changes.
- `docs/canonical/smartcontract-events.md` only if event interpretation changes.
- `docs/canonical/integration-rules.md` only if frontend/backend/contract dependency rules change.

## Recently Updated

- 2026-05-04: Tracker initialized with active Epic 1, Slice 1.
