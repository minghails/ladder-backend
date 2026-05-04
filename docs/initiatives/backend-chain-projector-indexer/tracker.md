# Tracker — Backend Chain Projector / Indexer

## Active

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-02-market-snapshots-history-apis.md`
- Slice: Slice 1 — snapshot schema
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

- None. Next agent should start Epic 2, Slice 1.

## Next Up

1. Read `session-kickoff-prompt.md`.
2. Read active epic file only.
3. Implement Epic 2, Slice 1 with TDD.
4. Run targeted verification.
5. Update this tracker and add session log.

## Done

- 2026-05-04: Initiative docs generated from plan.
- 2026-05-04: Epic 1, Slice 1 — projector config completed. Added validated projector env fields, `projectorConfig`, `.env.example` defaults, and ConfigModule wiring. Verification: `pnpm test src/shared/config/env.validation.spec.ts` pass; `pnpm lint` pass. API impact for FE: No FE-facing API impact. Architecture docs checked; no update needed. Session: `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-projector-config.md`.
- 2026-05-04: Epic 1, Slice 2 — idempotent event and cursor schema completed. Added projector schema tests, `market_events` source identity columns and unique `(chain_id, market_address, tx_hash, log_index)`, `projector_cursors` chain/market/block hash fields, and Drizzle migration with stop condition for non-empty legacy tables. Verification: `pnpm db:generate` pass; `pnpm test src/shared/database/schema/projector-schema.spec.ts src/shared/config/env.validation.spec.ts` pass; `pnpm lint` pass; `pnpm build` pass. API impact for FE: No FE-facing API impact. Architecture docs updated: `docs/canonical/backend-architecture.md`. Session: `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-idempotent-event-cursor-schema.md`.
- 2026-05-04: Epic 1, Slice 3 — market bootstrap and projector types completed. Added typed projector event/range contracts, `runOnce()` market bootstrap from live contract state, idempotent market upsert, and ChainProjectorModule imports for blockchain/database dependencies. Verification: RED first on `runOnce`; `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts src/shared/database/schema/projector-schema.spec.ts src/shared/config/env.validation.spec.ts` pass; `pnpm lint` pass; `pnpm build` pass. API impact for FE: No FE-facing API impact. Architecture docs checked; no update needed. Session: `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-market-bootstrap-projector-types.md`.
- 2026-05-04: Epic 1, Slice 4 — event normalizer and viem chain ID completed. Added supported event names, `normalizeEventArgs`, semantic `stJtRatioAfter` aliasing, and `ViemClientService.getChainId()`. Verification: RED first on missing normalizer/getChainId; `pnpm test src/modules/chain-projector/projector-events.spec.ts src/shared/blockchain/viem-client.service.spec.ts` pass. API impact for FE: No FE-facing API impact. Architecture docs checked; no update needed. Session: `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-event-normalizer-viem-chain-id.md`.
- 2026-05-04: Epic 1, Slice 5 — `runOnce()` fetch/decode/persist/cursor core completed. Added range computation, cursor read/upsert, confirmed block safety, batch cap, Market log fetch, block timestamp lookup, supported event decoding, normalized raw event insert with `onConflictDoNothing`, and cursor update only after event insert succeeds. Verification: RED first on missing batch behavior; `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts src/modules/chain-projector/projector-events.spec.ts` pass; broader relevant tests pass; `pnpm lint` pass; `pnpm build` pass. API impact for FE: No FE-facing API impact. Architecture docs checked; no update needed. Session: `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-run-once-core.md`.
- 2026-05-04: Epic 1, Slice 6 — optional background loop and README baseline completed. Added `PROJECTOR_ENABLED`-gated bootstrap loop, overlap guard, interval cleanup, batch summary logging, and Chain Projector README run controls. Verification: RED first on missing lifecycle methods; `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts` pass; final Epic 1 relevant tests pass; `pnpm lint` pass; `pnpm build` pass. API impact for FE: No FE-facing API impact. Architecture docs checked; no update needed. Session: `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-background-loop-readme.md`.
- 2026-05-04: Epic 1 complete. API impact summary for FE: No FE-facing API impact across all slices; no endpoint, request, response, auth, or error contract changed. Backend-only changes include projector config, schema identity/cursors, event normalization, raw event indexing, background loop, and operator README. FE action needed: none.

## Blocked

- Production-like indexing needs exact `DEPLOYMENT_BLOCK` for Market `0x3aDa769dC813e3376fCD40d05bEA12263048A487` on Base Sepolia.

## Risks

- Existing DB rows make the Slice 2 migration stop with a clear error; reset dev DB or backfill chain/block identity before applying.
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

- 2026-05-04: Epic 1 completed; active slice advanced to Epic 2, Slice 1.
