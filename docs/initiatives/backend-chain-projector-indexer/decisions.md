# Decisions — Backend Chain Projector / Indexer

## Accepted decisions

1. Stay in existing NestJS modular monolith.
2. Use existing `ViemClientService`, Drizzle DB module, and ABI/address package.
3. Do not rebuild ABIs from `contracts_audit`; treat it as reference only.
4. Keep live `ContractReaderService` reads working while indexed read models are added.
5. Start with raw event indexing and cursor safety before snapshots/request lifecycle.
6. Background loop runs only when `PROJECTOR_ENABLED=true`.
7. `DEPLOYMENT_BLOCK=0` remains valid when projector is disabled.
8. Cursor advances only after DB writes succeed.
9. Index only confirmed blocks.
10. Preserve raw ABI args and expose semantic `stJtRatioAfter`/`stJtRatio` in code/API.
11. Use block timestamps from viem `getBlock`, not processing time.
12. Source of truth for async request status is contract events plus adaptor reads when linked.

## Proposed decisions needing execution-time confirmation

1. Exact Market deployment block.
2. Safe migration strategy for any existing dev DB rows.
3. Add semantic DB columns such as `st_jt_ratio`, or keep legacy columns and map at code/API boundary.
4. Whether `GET /deposit-requests/:id` alone is enough for first request API slice.
5. Whether optional portfolio activities remain deferred after core projector/read APIs ship.

## Rejected decisions

1. No Redis/BullMQ/Temporal for this MVP projector.
2. No separate worker service.
3. No TimescaleDB.
4. No signer/admin write orchestration in this plan.
5. No target-state freeze/delist or risk automation in this plan.
