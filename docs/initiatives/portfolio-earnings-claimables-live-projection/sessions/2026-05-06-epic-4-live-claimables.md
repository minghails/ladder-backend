# Session — 2026-05-06 Epic 4 Live Claimables

## Scope

- Plan: `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
- Initiative: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/`
- Epic: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-4-live-claimables.md`
- Slices: Slice 2 — Claimables endpoint; Slice 3 — Overview claimable preview

## Work completed

- Wired `PortfolioClaimablesRepository` into `PortfolioService` and `PortfolioModule`.
- Updated `GET /portfolio/:address/claimables` live path to read rejected/unrefunded refund claimables from the repository while preserving explicit `includeMock=true` sandbox behavior.
- Added live claimables service test and verified repository-backed pagination response shape.
- Updated portfolio overview to load live claimable preview rows and summary.
- Summed enabled base-token refund rows only into `summary.claimable.amount`; kept `source = 'unavailable'` when no enabled base-token refunds exist.
- Updated canonical API docs for refund claimables and overview claimable summary semantics.

## Files changed

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/portfolio/portfolio.module.ts`
- `backend/src/modules/portfolio/portfolio.controller.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-4-live-claimables.md`

## Docs changed

- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-4-live-claimables.md`

## Verification run

- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — RED for Slice 2 before implementation: failed because `PortfolioClaimablesRepository.findByWallet` was not called and live claimables remained empty.
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS after Slice 2 implementation: 1 file, 18 tests passed.
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — RED for Slice 3 before implementation: failed because overview did not call `PortfolioClaimablesRepository.findByWallet` and claimable preview/summary stayed unavailable.
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts` — PASS after Slice 3 implementation: 1 file, 19 tests passed.
- `pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts src/modules/portfolio/portfolio.service.spec.ts` — PASS: 2 files, 23 tests passed.
- `pnpm lint` — PASS with 0 errors and 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts` for unused eslint-disable directives.
- `pnpm build` — PASS: TSC found 0 issues; SWC compiled 107 files.

## Architecture docs sync

- Updated: `docs/canonical/api-contract.md` for live refund claimables and overview claimable summary semantics.
- Checked; no update needed: `docs/canonical/backend-architecture.md`; Epic 4 did not change module boundaries, ownership, or data model beyond already documented repository-backed portfolio reads.
- Checked; no update needed: `backend/docs/architecture.md`; portfolio module dependency graph remains within existing `portfolio -> shared/database, shared/blockchain` shape.
- Pending for Epic 5: `docs/canonical/integration-rules.md` still needs initiative-level sync for earnings/claimables source-of-truth language.

## API impact for FE

- `API data-source/behavior change`
- `/portfolio/:address/claimables`: now returns real refund claimables from rejected, unrefunded async deposit requests.
- `/portfolio/:address`: claimable preview and summary can now use live refund data when repository rows exist.
- FE action needed: review disabled refund reasons, refund copy, empty states, and base-token-only summary assumptions.

## Remaining risks

- Overview summary only sums enabled base-token refund rows; mixed-token future claimables still need explicit design before cross-token aggregation.
- Disabled refund rows are returned with reasons rather than omitted; FE should handle both enabled and disabled actions.
- Lint has 4 pre-existing warnings in `src/modules/quotes/quotes.service.ts`; not introduced by Epic 4.
- Canonical integration/backend-architecture initiative closeout remains for Epic 5.

## Next step

- Epic 5 Slice 1 — Canonical docs sync.
