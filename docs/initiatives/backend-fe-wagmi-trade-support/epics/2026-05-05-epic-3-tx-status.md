# Epic 3 — Add Tx Status Endpoint Backed by Indexed Events

## Goal

Add `GET /tx/:hash` so FE can poll until Chain Projector indexes relevant events after wagmi submission.

## Files expected

- Create: `backend/src/modules/tx-status/tx-status.module.ts`
- Create: `backend/src/modules/tx-status/tx-status.controller.ts`
- Create: `backend/src/modules/tx-status/tx-status.service.ts`
- Create: `backend/src/modules/tx-status/tx-status.service.spec.ts`
- Create: `backend/src/modules/tx-status/dto/tx-status-swagger.dto.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/swagger.fe-api.spec.ts`

## Slice 1 — Tx status service

### Scope

Implement DB read model from existing `market_events` by tx hash.

### Steps

1. Read exact existing database schema for `market_events` and nearby module service test patterns.
2. Add failing tests:
   - unknown tx hash returns `status = not_indexed`, `events = []`
   - known tx hash returns `status = indexed`
   - events ordered by `blockNumber`, then `logIndex`
   - tx hash matching is case-normalized
3. Implement `TxStatusService` with `DatabaseModule` dependency.
4. Response source must be `dataQuality.sources.tx = indexed_events`.
5. Run `pnpm test src/modules/tx-status/tx-status.service.spec.ts` from `backend/`.
6. Update tracker/session log; classify API impact as `No FE-facing API impact` until controller route is exposed.

## Slice 2 — Tx status controller and Swagger

### Scope

Expose `GET /tx/:hash`, add Swagger DTO, wire module, and assert FE API path.

### Steps

1. Add controller route returning service response.
2. Add `TxStatusModule` import to `AppModule`.
3. Add Swagger DTO matching plan response.
4. Add path assertion in `backend/src/swagger.fe-api.spec.ts` for `GET /tx/{hash}`.
5. Run `pnpm test src/modules/tx-status src/swagger.fe-api.spec.ts` from `backend/`.
6. Update tracker/session log; classify API impact as `API contract change`.

## Epic done criteria

- Unknown tx returns `not_indexed`.
- Indexed tx returns ordered events with args.
- No RPC receipt fallback in first implementation.
