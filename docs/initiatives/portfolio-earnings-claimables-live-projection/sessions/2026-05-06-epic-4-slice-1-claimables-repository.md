# Session — 2026-05-06 Epic 4 Slice 1 Claimables Repository

## Scope

- Plan: `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
- Initiative: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/`
- Epic: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-4-live-claimables.md`
- Slice: Epic 4 Slice 1 — Claimables repository

## Work completed

- Added failing repository tests for rejected unrefunded refund claimables.
- Covered enabled refunds, base-pulled disabled refunds, non-requester disabled refunds, and omission of refunded/settled requests.
- Added `PortfolioClaimablesRepository` with wallet-normalized read logic over `deposit_requests`.
- Mapped live claimable rows to refund-only DTOs with `REFUND_ONLY_REQUESTER` and `REFUND_UNAVAILABLE_BASE_PULLED` reasons.
- Kept slice bounded to repository behavior only; no portfolio service/API wiring yet.

## Files changed

- `backend/src/modules/portfolio/portfolio-claimables.repository.ts`
- `backend/src/modules/portfolio/portfolio-claimables.repository.spec.ts`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-4-slice-1-claimables-repository.md`

## Docs changed

- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-4-slice-1-claimables-repository.md`

## Verification run

- `pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts` — RED before implementation: failed because `./portfolio-claimables.repository` did not exist.
- `pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts` — PASS after implementation: 1 file, 4 tests passed.
- `pnpm lint` — PASS with 0 errors and 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts` for unused eslint-disable directives.
- `pnpm build` — PASS: TSC found 0 issues; SWC compiled 107 files.

## Architecture docs sync

- Architecture docs checked; no update needed.
- No module boundary, dependency graph, runtime flow, data ownership, API contract, or event semantics changed in this slice.

## API impact for FE

- `No FE-facing API impact`
- FE action needed: none

## Remaining risks

- Claimables repository is not wired into `PortfolioService` or `PortfolioModule` yet; live endpoint behavior remains for Epic 4 Slice 2.
- Disabled refund rows are currently returned rather than omitted; keep this behavior consistent when endpoint wiring lands.
- Lint has 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts`; not introduced by this slice.

## Next step

- Epic 4 Slice 2 — Claimables endpoint.
