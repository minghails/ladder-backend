# Session 2026-05-07 - Production Factsheet Service

## Scope

Implement Epic 2 Slice 3 — production factsheet service from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-market-metadata-apy-charts.md`.

## Work completed

- Added `MarketFactsheetService` to assemble rows from live contract state, base-token config/live metadata, and approved static config.
- Removed unsourced factsheet rows such as carry-fee copy from the production factsheet path.
- Wired `MarketStateService.getFactsheet()` through the new service and live base token metadata.
- Added focused factsheet service tests and updated market-state tests for source labels.
- Updated canonical API docs for factsheet row source semantics.

## Files changed

- `backend/src/modules/market-state/market-factsheet.service.ts`
- `backend/src/modules/market-state/market-factsheet.service.spec.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/modules/market-state/market-state.service.spec.ts`
- `backend/src/modules/market-state/market-state.module.ts`
- `backend/src/modules/market-state/market-metadata.config.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-production-factsheet-service.md`

## Docs changed

- `docs/canonical/api-contract.md`: documented production factsheet rows and source labels.
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Slice 3 complete and Slice 4 active.
- `backend/docs/initiatives/production-endpoint-readiness/session-kickoff-prompt.md`: updated next-agent prompt to Slice 4.

## API impact for FE

API contract change. `/markets/:address/factsheet` row set and `dataQuality.sources.factsheet` semantics changed: rows now include live/config/mixed source labels and unsourced rows such as `Carry Fee` are omitted. FE action needed: update fixtures/types/copy assumptions for factsheet rows and source labels.

## Verification run

- `pnpm test src/modules/market-state/market-factsheet.service.spec.ts` — passed.
- `pnpm test -- market-state` — passed with existing DepositRequestProjector warning logs in tests.
- `pnpm lint` — passed with existing warnings in `src/modules/quotes/quotes.service.ts` about unused eslint-disable directives.

## Architecture docs checked

Architecture docs checked; no update needed. `docs/canonical/backend-architecture.md` and `backend/docs/architecture.md` remain accurate because no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes were introduced.

## Remaining risks

- Factsheet remains limited to fields with defensible live/config sources; additional fee/adaptor fields need contract/config proof before being shown.
- FE may need copy/fixture updates because row labels and data-quality source shape changed.
- Existing lint warnings in quotes service remain unrelated.

## Next step

Start Epic 2 Slice 4 — production chart source behavior.
