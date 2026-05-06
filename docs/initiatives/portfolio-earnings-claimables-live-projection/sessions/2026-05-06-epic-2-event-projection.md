# Session — 2026-05-06 Epic 2 Event Projection

## Scope

- Plan: `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
- Initiative: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/`
- Epic: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-2-event-projection.md`
- Slices: Slice 1 — Accounting repository; Slice 2 — Project Market cashflows; Slice 3 — Tranche event owner correlation

## Work completed

- Added `PortfolioAccountingRepository` with idempotent cashflow inserts, withdrawal negative deltas, cost-basis upsert, and wallet reads.
- Added repository tests for idempotency, withdrawal mapping, and cost-basis upsert.
- Wired chain projector to watch Market plus senior/junior tranche addresses.
- Decoded tranche ERC-4626 `Deposit` logs for owner correlation.
- Projected `DepositYT`, `DepositSettled`, and `WithdrawYT` events into cashflows.
- Applied cost basis only after successful non-duplicate cashflow insert.
- Correlated `DepositYT` to same-transaction tranche `Deposit.owner` when exactly one matching owner event exists.
- Registered `PortfolioAccountingRepository` in portfolio and chain-projector modules.
- Updated backend architecture docs for projector/accounting dependency and canonical portfolio responsibility.

## Files changed

- `backend/src/modules/portfolio/portfolio-accounting.repository.ts`
- `backend/src/modules/portfolio/portfolio-accounting.repository.spec.ts`
- `backend/src/modules/portfolio/portfolio.module.ts`
- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/modules/chain-projector/chain-projector.module.ts`
- `docs/canonical/backend-architecture.md`
- `backend/docs/architecture.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-2-event-projection.md`

## Docs changed

- `docs/canonical/backend-architecture.md`
- `backend/docs/architecture.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-2-event-projection.md`

## Verification run

- `pnpm test src/modules/portfolio/portfolio-accounting.repository.spec.ts` — RED before implementation: failed because repository did not exist.
- `pnpm test src/modules/portfolio/portfolio-accounting.repository.spec.ts` — PASS after implementation: 1 file, 3 tests passed.
- `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts` — RED before implementation: portfolio accounting repository calls were missing for `DepositSettled`, `WithdrawYT`, and correlated `DepositYT`.
- `pnpm test src/modules/chain-projector/chain-projector.service.spec.ts` — PASS after implementation: 1 file, 16 tests passed.
- `pnpm test src/modules/chain-projector src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts` — PASS: 7 files, 44 tests passed.
- `pnpm lint` — PASS with 0 errors and 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts` for unused eslint-disable directives.
- `pnpm build` — PASS: TSC found 0 issues; SWC compiled 103 files.

## Architecture docs sync

- Updated: `docs/canonical/backend-architecture.md`, `backend/docs/architecture.md`
- Checked; no update needed: `docs/canonical/api-contract.md`; no endpoint shape or response behavior changed in this epic.

## API impact for FE

- `No FE-facing API impact`
- FE action needed: none

## Remaining risks

- Owner correlation currently falls back to `DepositYT.user` when no matching tranche deposit exists; open decision remains whether to skip all unmatched `DepositYT` rows if direct-vs-instant cannot be classified reliably.
- Projector tests cover same-transaction tranche `Deposit.owner` correlation, but future integration tests should validate real log ordering against live contract transactions.
- Lint has 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts`; not introduced by this epic.

## Next step

- Epic 3 Slice 1 — Earnings repository.
