# Session — 2026-05-06 Epic 1 Slice 1 Schema

## Scope

- Plan: `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
- Initiative: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/`
- Epic: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-1-schema-accounting-core.md`
- Slice: Epic 1 Slice 1 — Portfolio accounting schema

## Work completed

- Added failing schema export test for `portfolioCashflows` and `portfolioCostBasis`.
- Added `portfolio_cashflows` Drizzle table.
- Added `portfolio_cost_basis` Drizzle table.
- Exported both tables from schema index.
- Generated Drizzle migration `0005_lonely_calypso.sql` and snapshot metadata.
- Updated canonical backend architecture data model for new portfolio accounting tables.

## Files changed

- `backend/src/shared/database/schema/projector-schema.spec.ts`
- `backend/src/shared/database/schema/index.ts`
- `backend/src/shared/database/schema/portfolio-cashflows.ts`
- `backend/src/shared/database/schema/portfolio-cost-basis.ts`
- `backend/src/shared/database/migrations/0005_lonely_calypso.sql`
- `backend/src/shared/database/migrations/meta/_journal.json`
- `backend/src/shared/database/migrations/meta/0005_snapshot.json`
- `docs/canonical/backend-architecture.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`

## Docs changed

- `docs/canonical/backend-architecture.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-1-slice-1-schema.md`

## Verification run

- `pnpm test src/shared/database/schema/projector-schema.spec.ts` — RED before implementation: failed because `portfolioCashflows` was undefined.
- `pnpm test src/shared/database/schema/projector-schema.spec.ts` — PASS after implementation: 1 file, 6 tests passed.
- `pnpm db:generate` — PASS: generated `src/shared/database/migrations/0005_lonely_calypso.sql`.
- `pnpm lint` — PASS with 0 errors and 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts` for unused eslint-disable directives.
- `pnpm build` — PASS: TSC found 0 issues; SWC compiled 99 files.

## Architecture docs sync

- Updated: `docs/canonical/backend-architecture.md`
- Checked; no update needed: `backend/docs/architecture.md`; no module dependency graph changed in this slice.

## API impact for FE

- `No FE-facing API impact`
- FE action needed: none

## Remaining risks

- Canonical architecture now lists the tables, but portfolio projection semantics still need fuller docs in later epics after projector/service behavior lands.
- Lint has 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts`; not introduced by this slice.

## Next step

- Epic 1 Slice 2 — Pure average-cost accounting service.
