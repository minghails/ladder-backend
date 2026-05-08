# Session 2026-05-07 - Remove Production Chart Fixtures

## Scope

Implement Slice 2 — remove production chart fixtures from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-mock-removal-guardrails.md`.

## Work completed

- Replaced chart fixture config with metadata-only chart config.
- Removed fixture headline values and fixture series arrays from market metadata config.
- Preserved chart endpoint behavior: `tvl`, `tokenPrice`, and `ratio` use indexed snapshots; `yield` and `utilization` return empty unavailable series.
- Added regression coverage that chart config has no fixture values/series.

## Files changed

- `backend/src/modules/market-state/market-metadata.config.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/modules/market-state/market-state.service.spec.ts`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-mock-removal-guardrails.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-remove-production-chart-fixtures.md`

## Docs changed

- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Slice 2 complete, Epic 1 complete, and Epic 2 Slice 1 active.
- `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-mock-removal-guardrails.md`: recorded Slice 2 scope and acceptance.
- Canonical API docs were already aligned; no change needed.

## API impact for FE

No FE-facing API impact. Chart response shape and source semantics are unchanged: indexed metrics use indexed snapshots, and `yield`/`utilization` return empty unavailable series.

## Verification run

- `pnpm test -- market-state` — passed.
- `pnpm lint` — passed with existing warnings in `src/modules/quotes/quotes.service.ts` about unused eslint-disable directives.

## Architecture docs checked

Architecture docs checked; no update needed.

## Remaining risks

- Existing lint warnings in quotes service remain unrelated to this slice.
- Market metadata/live token source work remains for next epic.

## Next step

Start Epic 2 Slice 1 — live token metadata reads.
