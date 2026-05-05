# Session — Epic 4 Docs, Integration Checklist, and Demo Smoke

Date: 2026-05-05

## Scope

Completed Epic 4 — Docs, integration checklist, and demo smoke.

## Changes

- Added canonical FE wagmi demo smoke checklist covering constraints, quote endpoints, approval hints, frontend ABI submission, tx polling, and post-index refresh.
- Added integration rules for FE wagmi transaction boundaries.
- Added Swagger/API doc coverage test for canonical smoke checklist and backend no-signing/no-calldata boundary.
- Ran full backend test, lint, build, Docker migration smoke, and local API smoke.

## TDD record

RED verified with:

```text
pnpm test src/swagger.fe-api.spec.ts
```

Expected failure after path correction: missing `## FE wagmi demo smoke checklist` in `docs/canonical/api-contract.md`.

GREEN verified with:

```text
pnpm test src/swagger.fe-api.spec.ts
```

Result: 6 tests passed.

## API impact for FE

`No FE-facing API impact` for Epic 4 slice.

- No endpoint, request shape, response shape, error shape, auth behavior, or runtime data source changed in this slice.
- Docs now consolidate how FE should consume API changes from Epics 1-3.

End-of-initiative API impact summary: `API contract change` from Epics 1-3.

- Added `POST /quotes/deposit-yt`.
- Upgraded `POST /quotes/deposit-base` action and approval hints for Market `depositInstant`.
- Corrected `POST /quotes/withdraw-yt` action semantics to Market `withdraw` and tranche approval to Market.
- Expanded `GET /markets/:address/trade-constraints` with token metadata, approval targets, methods, capabilities, aliases, and raw ratio fields.
- Added `GET /tx/:hash` backed by indexed `market_events` only.
- Backend still does not sign transactions, store private keys, submit wallet transactions, or return mandatory calldata.

FE action needed: update integration to use the documented endpoints/action hints and run demo smoke checklist.

## Architecture docs

Architecture docs checked; no update needed.

- No module boundaries, dependency graph, runtime flow, infrastructure choice, data ownership, API/schema/event behavior, or source-of-truth assumptions changed in Epic 4.

## Verification

- `pnpm test src/swagger.fe-api.spec.ts` — passed, 6 tests.
- `pnpm test` — passed, 22 files, 110 tests. Existing projector warning log appeared in tests.
- `pnpm lint` — passed.
- `pnpm build` — passed, 0 TypeScript issues.
- `docker compose up -d postgres && set -a; source ../.env; set +a; pnpm db:migrate` from `backend/docker` — passed, migrations applied successfully.
- API smoke against local app:
  - `GET /markets/:address/trade-constraints` — 200.
  - `POST /quotes/deposit-yt` — 201.
  - `POST /quotes/deposit-base` — 201.
  - `POST /quotes/withdraw-yt` — 201.
  - `GET /tx/<fake-hash>` — 200.

## Remaining risks

- API smoke checked HTTP status only, not full JSON semantic assertions.
- Projector lag can keep wallet-success transactions at `not_indexed` until events are ingested.
- Exact `depositInstant` output remains placeholder/derived unless an adaptor quote read is added.
- Direct YT deposit/withdraw still depend on current `latestYtPrice` and can be stale by contract design.
- Backend quote remains preflight only; transaction can still revert if on-chain state changes before mining.

## Next step

Archive or merge the completed initiative, then hand FE the end-of-initiative API impact summary and demo smoke checklist.
