# Tracker — Portfolio Earnings And Claimables Live Projection

## Active

- Epic: Complete
- Slice: Complete
- Session kickoff: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/session-kickoff-prompt.md`
- Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-5-docs-verification.md`

## Active plan

- `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`

## Planned

1. Epic 1 — Schema And Accounting Core
2. Epic 2 — Event Projection
3. Epic 3 — Live Earnings Endpoint And Overview Summary
4. Epic 4 — Live Claimables And Overview Preview
5. Epic 5 — Final Docs And Verification

## In Progress

- None.

## Next Up

1. Review diff and prepare PR / commit workflow.

## Done

- Initiative generated from plan.
- Epics and bounded slices generated from plan scope.
- Epic 1 Slice 1 — Portfolio accounting schema.
- Epic 1 Slice 2 — Pure average-cost accounting service.
- Epic 2 Slice 1 — Accounting repository.
- Epic 2 Slice 2 — Market cashflow projection.
- Epic 2 Slice 3 — Tranche event owner correlation.
- Epic 3 Slice 1 — Earnings repository.
- Epic 3 Slice 2 — Live earnings endpoint.
- Epic 3 Slice 3 — Overview earnings summary.
- Epic 4 Slice 1 — Claimables repository.
- Epic 4 Slice 2 — Claimables endpoint.
- Epic 4 Slice 3 — Overview claimable preview.
- Epic 5 Slice 1 — Canonical docs sync.
- Epic 5 Slice 2 — Full verification and handoff.

## Blocked

- None.

## Risks

- Historical index coverage can be incomplete; mark cost basis `partial` instead of overstating confidence.
- `DepositYT.user` is not always share owner for instant deposits with receiver override; owner correlation with tranche `Deposit` event is mandatory when ambiguous.
- Projector may currently decode Market logs only; extending watched tranche addresses must not regress existing Market indexing.
- `earning30d` must stay unavailable/zero until snapshots exist; do not fake 30d performance from cashflows.
- Claimables are limited to rejected/unrefunded async deposit refunds; do not expose carry fees or future reward concepts.
- Multi-token claimable summary must avoid unsafe cross-token summing.

## Needs Decision

- `partial_indexed_events` source literal vs separate `historyCoverage` field.
- Return disabled non-actionable refund rows, or hide them.
- Keep `earning30d` unavailable until snapshots exist. Recommended: yes.
- Multi-token claimable summary behavior if refund tokens differ.
- Require same-transaction tranche `Deposit.owner` correlation for every `DepositYT` if direct-vs-instant classification is unreliable.

## API impact expectation

`API data-source/behavior change`.

- `/portfolio/:address/earnings`: will return event-derived realized/unrealized PnL when indexed history exists.
- `/portfolio/:address/claimables`: will return real refund claimables from rejected/unrefunded async deposit requests.
- `/portfolio/:address`: overview financial aggregates can use live earnings/refund data.
- FE action likely: review source labels, partial-history copy, disabled refund reasons, and empty states.

## Recently Updated

- 2026-05-06: Initiative completed. Epic 5 synced canonical backend architecture and integration rules, confirmed API contract coverage, and ran full verification. API impact summary: `API data-source/behavior change` for `/portfolio/:address/earnings`, `/portfolio/:address/claimables`, and `/portfolio/:address` overview aggregates. FE action needed: review source labels, partial-history copy, refund disabled reasons, empty states, and base-token-only claimable summary. Verification: targeted portfolio tests PASS (32), projector tests PASS (37), full `pnpm test` PASS (142), `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-5-docs-verification.md`. Next: review diff and prepare PR / commit workflow.
- 2026-05-06: Epic 4 completed live claimables endpoint and overview claimable preview/summary from rejected, unrefunded async deposit requests. API impact: `API data-source/behavior change`; FE action needed: review disabled refund reasons, refund copy, empty states, and base-token-only summary assumptions. Verification: `pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts src/modules/portfolio/portfolio.service.spec.ts` PASS, `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-4-live-claimables.md`. Next: Epic 5 Slice 1 — Canonical docs sync.
- 2026-05-06: Epic 4 Slice 1 added `PortfolioClaimablesRepository` with rejected/unrefunded refund-claimable derivation, requester-only enablement, and base-pulled disable reason mapping. Architecture docs checked; no update needed. API impact: `No FE-facing API impact`. Verification: `pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts` RED (module missing) then PASS (4 tests), `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-4-slice-1-claimables-repository.md`. Next: Epic 4 Slice 2 — Claimables endpoint.
- 2026-05-06: Epic 3 completed live earnings endpoint and overview summary from cost basis plus live positions. API impact: `API data-source/behavior change`; FE action needed: review `indexed_events`/`partial_indexed_events` labels, empty history copy, and empty-state assumptions. Verification: `pnpm test src/modules/portfolio/portfolio-earnings.repository.spec.ts src/modules/portfolio/portfolio.service.spec.ts` PASS, `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-3-live-earnings.md`. Next: Epic 4 Slice 1 — Claimables repository.
- 2026-05-06: Epic 3 Slice 1 added `PortfolioEarningsRepository` with wallet-normalized cost-basis reads and cashflow reads since a timestamp. Architecture docs checked; no update needed. API impact: `No FE-facing API impact`. Verification: `pnpm test src/modules/portfolio/portfolio-earnings.repository.spec.ts` PASS, `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-3-slice-1-earnings-repository.md`. Next: Epic 3 Slice 2 — Live earnings endpoint.
- 2026-05-06: Epic 2 completed accounting repository, Market event cashflow projection, cost-basis updates, and same-transaction tranche `Deposit.owner` correlation. API impact: `No FE-facing API impact`. Verification: `pnpm test src/modules/chain-projector src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts` PASS, `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-2-event-projection.md`. Next: Epic 3 Slice 1 — Earnings repository.
- 2026-05-06: Epic 1 completed with average-cost accounting service. API impact: `No FE-facing API impact`. Verification: `pnpm test src/shared/database/schema/projector-schema.spec.ts src/modules/portfolio/portfolio-accounting.service.spec.ts` PASS, `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-1-slice-2-accounting-service.md`. Next: Epic 2 Slice 1 — Accounting repository.
- 2026-05-06: Epic 1 Slice 1 added portfolio accounting schema, migration `0005_lonely_calypso.sql`, and canonical backend architecture data-model sync. API impact: `No FE-facing API impact`. Verification: `pnpm test src/shared/database/schema/projector-schema.spec.ts` PASS, `pnpm db:generate` PASS, `pnpm lint` 0 errors/4 pre-existing warnings, `pnpm build` PASS. Latest session: `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/2026-05-06-epic-1-slice-1-schema.md`. Next: Epic 1 Slice 2 — Pure average-cost accounting service.
- 2026-05-06: Initiative activated from plan. Next: Epic 1 Slice 1 — Portfolio accounting schema.
