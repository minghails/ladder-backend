# Session — 2026-05-06 Epic 5 Docs Verification

## Scope

- Plan: `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
- Initiative: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/`
- Epic: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-5-docs-verification.md`
- Slices: Slice 1 — Canonical docs sync; Slice 2 — Full verification and handoff

## Work completed

- Synced canonical backend architecture docs for portfolio claimables/earnings source-of-truth details.
- Synced canonical integration rules with explicit earnings projection and refund-only claimables semantics.
- Confirmed canonical API contract already covers:
  - `indexed_events` / `partial_indexed_events` earnings source labels
  - history unavailable behavior until snapshots
  - refund-only claimables and disabled reason behavior
  - overview claimable summary behavior
- Ran full required verification suite.
- Updated initiative tracker and kickoff prompt to initiative-complete state.

## Files changed

- `docs/canonical/backend-architecture.md`
- `docs/canonical/integration-rules.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-5-docs-verification.md`

## Docs changed

- `docs/canonical/backend-architecture.md`
- `docs/canonical/integration-rules.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-5-docs-verification.md`

## Verification run

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS (docs sanity check): 1 file, 19 tests passed.
- `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts src/modules/portfolio/portfolio-earnings.repository.spec.ts src/modules/portfolio/portfolio-claimables.repository.spec.ts src/modules/portfolio/portfolio.service.spec.ts` — PASS: 5 files, 32 tests passed.
- `pnpm test src/modules/chain-projector` — PASS: 5 files, 37 tests passed.
- `pnpm test` — PASS: 27 files, 142 tests passed.
- `pnpm lint` — PASS with 0 errors and 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts` for unused eslint-disable directives.
- `pnpm build` — PASS: TSC found 0 issues; SWC compiled 107 files.

## Architecture docs sync

- Updated `docs/canonical/backend-architecture.md`:
  - Portfolio module responsibility includes refund-only claimables from rejected/unrefunded async deposit requests.
  - Data principles state live claimables are derived from `deposit_requests` until future reward/airdrop sources exist.
- Updated `docs/canonical/integration-rules.md`:
  - Added explicit portfolio earnings/claimables source-of-truth section.
  - Clarified refund enablement conditions and future-source requirement for reward/airdrop/user-fee claimables.
- Checked `backend/docs/architecture.md`; no update needed because module dependency graph is unchanged.

## API impact for FE

- `API data-source/behavior change`
- Consolidated summary:
  - `/portfolio/:address/earnings`: event-derived realized/unrealized PnL with `indexed_events`/`partial_indexed_events` quality.
  - `/portfolio/:address/claimables`: live refund claimables from rejected, unrefunded async deposit requests; disabled reasons possible.
  - `/portfolio/:address`: overview earnings and claimable summary can use live projected/refund data.
- FE action needed:
  - review source labels and partial-history copy
  - handle disabled refund reasons in claimables UI
  - verify empty states and base-token-only claimable summary assumptions

## Remaining risks

- `earning30d` remains unavailable/zero until snapshots exist.
- Mixed-token claimable aggregation remains intentionally unsupported; summary only aggregates enabled base-token refund rows.
- Decision remains open whether disabled non-actionable rows should be shown or hidden.
- Lint has 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts`; not introduced by this initiative.

## Next step

- Review diff and prepare PR / commit workflow for merge.
