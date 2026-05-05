# Session — Epic 3 Tx Status Endpoint

Date: 2026-05-05

## Scope

Completed Epic 3 — Add tx status endpoint backed by indexed events.

## Changes

- Added `TxStatusModule` with `GET /tx/:hash` public endpoint.
- Added `TxStatusService` backed by existing `market_events` rows.
- Returned `not_indexed` for unknown hashes and `indexed` with ordered decoded event rows for matching hashes.
- Normalized transaction hashes to lowercase for lookup and response.
- Added Swagger DTOs and FE API documentation assertion for `/tx/{hash}`.
- Imported `TxStatusModule` into `AppModule`.

## TDD record

RED verified with:

```text
pnpm test src/modules/tx-status/tx-status.service.spec.ts
```

Expected failure: missing `./tx-status.service` module for new service tests.

GREEN verified with:

```text
pnpm test src/modules/tx-status/tx-status.service.spec.ts
```

Result: 3 tests passed.

## API impact for FE

`API contract change`.

- Added `GET /tx/:hash`.
- Response statuses: `indexed` and `not_indexed`.
- Response source is always `indexed_events`; no RPC receipt fallback, backend signing, transaction submission, private keys, mandatory calldata, or full transaction request.

FE before/after:

- Before: FE had no backend endpoint to poll after wagmi submission.
- After: FE can poll `/tx/:hash` until the backend projector has indexed matching Market events.

## Architecture docs

Updated architecture docs.

- `docs/canonical/backend-architecture.md`: added Tx Status module and tx polling step in direct YT user flow.
- `backend/docs/architecture.md`: added `tx-status -> shared/database` dependency.

## Verification

- `pnpm test src/modules/tx-status src/swagger.fe-api.spec.ts` — passed, 8 tests.
- `pnpm lint` — passed.
- `pnpm build` — passed, 0 TypeScript issues.

## Remaining risks

- Projector lag can keep wallet-success transactions at `not_indexed` until events are ingested.
- Endpoint does not query RPC receipts by design; it only reports backend read-model catch-up.

## Next step

Epic 4 — Docs, integration checklist, and demo smoke.
