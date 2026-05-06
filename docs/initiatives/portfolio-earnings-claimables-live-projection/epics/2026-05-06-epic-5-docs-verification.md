# Epic 5 — Final Docs And Verification

## Goal

Complete architecture/integration/API documentation sync and full backend verification for the initiative.

## Scope

- `docs/canonical/api-contract.md`
- `docs/canonical/backend-architecture.md`
- `docs/canonical/integration-rules.md`
- `backend/docs/architecture.md` only if module dependency graph changed
- Initiative tracker/session kickoff/session log
- All source/tests touched by earlier epics

## Slices

### Slice 1 — Canonical docs sync

Tasks:

1. Read only active plan Task 10, tracker latest state, and canonical docs that need updates.
2. Update `docs/canonical/backend-architecture.md` with `portfolio_cashflows`, `portfolio_cost_basis`, and portfolio projection responsibility.
3. Update `docs/canonical/integration-rules.md` with earnings/claimables source-of-truth rules.
4. Confirm `docs/canonical/api-contract.md` covers earnings source labels, partial history, refund-only claimables, disabled refund reasons, and overview behavior.
5. Update `backend/docs/architecture.md` only if portfolio/projector module dependency graph changed.
6. Run targeted portfolio tests as docs sanity check if implementation exists.
7. Record API impact summary for FE.
8. Update tracker/session kickoff/session log.

### Slice 2 — Full verification and handoff

Tasks:

1. Read only tracker, latest relevant session log, and package scripts if commands need confirmation.
2. Run targeted portfolio tests:
   `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts src/modules/portfolio/portfolio-earnings.repository.spec.ts src/modules/portfolio/portfolio-claimables.repository.spec.ts src/modules/portfolio/portfolio.service.spec.ts`
3. Run projector tests:
   `pnpm test src/modules/chain-projector`
4. Run full backend tests:
   `pnpm test`
5. Run lint:
   `pnpm lint`
6. Run build/typecheck:
   `pnpm build`
7. If any verification fails, stop and update tracker with failure evidence; do not mark complete.
8. If all pass, update tracker Active to Complete, Done list with all slices, and Next Up to review diff/PR.
9. Update session kickoff prompt to state initiative complete and latest session log.
10. Write final session log with files changed, docs changed, API impact, verification, risks, next step.

## API impact for FE

Consolidated expected classification: `API data-source/behavior change`.

- `/portfolio/:address/earnings`: event-derived realized/unrealized PnL; can report `partial_indexed_events`.
- `/portfolio/:address/claimables`: real refund claimables from rejected/unrefunded async deposit requests; no rewards/airdrops/user-fee rows.
- `/portfolio/:address`: overview financial aggregates can use live earnings/refund claimables.
- FE action needed: review source labels, partial-history copy, refund disabled reasons, and empty states.

## Verification

- Targeted portfolio tests
- `pnpm test src/modules/chain-projector`
- `pnpm test`
- `pnpm lint`
- `pnpm build`

## Architecture docs check

This epic closes all required docs sync. If implementation exactly matches existing docs unexpectedly, record `Architecture docs checked; no update needed`; otherwise update docs.
