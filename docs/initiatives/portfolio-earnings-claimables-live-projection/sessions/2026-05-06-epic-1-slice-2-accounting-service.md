# Session — 2026-05-06 Epic 1 Slice 2 Accounting Service

## Scope

- Plan: `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
- Initiative: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/`
- Epic: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-1-schema-accounting-core.md`
- Slice: Epic 1 Slice 2 — Pure average-cost accounting service

## Work completed

- Added failing tests for deposit, average-cost withdrawal, closes-all dust clearing, and withdrawal exceeding open shares.
- Implemented pure `applyDeposit` and `applyWithdrawal` helpers using stringified bigint values.
- Completed Epic 1 targeted verification.
- Advanced tracker and kickoff prompt to Epic 2 Slice 1.

## Files changed

- `backend/src/modules/portfolio/portfolio-accounting.service.ts`
- `backend/src/modules/portfolio/portfolio-accounting.service.spec.ts`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-1-slice-2-accounting-service.md`

## Docs changed

- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-1-slice-2-accounting-service.md`

## Verification run

- `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts` — RED before implementation: failed because `portfolio-accounting.service` did not exist.
- `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts` — PASS after implementation: 1 file, 4 tests passed.
- `pnpm test src/shared/database/schema/projector-schema.spec.ts src/modules/portfolio/portfolio-accounting.service.spec.ts` — PASS: 2 files, 10 tests passed.
- `pnpm lint` — PASS with 0 errors and 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts` for unused eslint-disable directives.
- `pnpm build` — PASS: TSC found 0 issues; SWC compiled 101 files.

## Architecture docs sync

- Updated: none in this slice.
- Checked; no update needed: pure accounting helper only; schema/data ownership docs were updated in Slice 1 and no module dependency graph changed.

## API impact for FE

- `No FE-facing API impact`
- FE action needed: none

## Remaining risks

- Repository idempotency still needs enforcement in Epic 2 so duplicate cashflows do not double-apply cost basis.
- Lint has 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts`; not introduced by this slice.

## Next step

- Epic 2 Slice 1 — Accounting repository.
