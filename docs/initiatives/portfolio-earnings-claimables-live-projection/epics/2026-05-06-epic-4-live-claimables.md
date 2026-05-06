# Epic 4 — Live Claimables And Overview Preview

## Goal

Serve real refund claimables from rejected, unrefunded async deposit requests and reflect them in portfolio overview preview.

## Scope

- `backend/src/modules/portfolio/portfolio-claimables.repository.ts`
- `backend/src/modules/portfolio/portfolio-claimables.repository.spec.ts`
- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `backend/src/modules/portfolio/portfolio.module.ts`
- `docs/canonical/api-contract.md`

## Slices

### Slice 1 — Claimables repository

Tasks:

1. Read only active plan Task 8, `deposit_requests` schema, and existing repository test patterns.
2. Add failing tests for:
   - rejected + not refunded + not base pulled => enabled refund claimable
   - rejected + base pulled => disabled reason `REFUND_UNAVAILABLE_BASE_PULLED` or omitted if decision made
   - rejected + non-requester wallet => disabled reason `REFUND_ONLY_REQUESTER` or omitted if decision made
   - refunded/settled rows not returned
3. Run `pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts`; record RED.
4. Query rows where `receiver = wallet OR user = wallet`, `status = rejected`, and refunded tx is null.
5. Treat `pulledTxHash IS NOT NULL` as base pulled.
6. Enable action only when wallet is original request user and base was not pulled.
7. Map row shape to existing claimables response DTO conventions.
8. Run repository test; record GREEN.
9. Update tracker/session kickoff/session log.

### Slice 2 — Claimables endpoint

Tasks:

1. Read only active plan Task 9, portfolio service/spec, portfolio module, and claimables repository.
2. Add failing service test for live rejected refund claimable row.
3. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts`; record RED.
4. Preserve `includeMock=true` sandbox behavior.
5. In live path, call `PortfolioClaimablesRepository.findByWallet(normalizedAddress)`.
6. Paginate live rows using existing response shape.
7. Run portfolio service tests; record GREEN.
8. Update canonical API docs for refund claimables semantics.
9. Update tracker/session kickoff/session log.

### Slice 3 — Overview claimable preview

Tasks:

1. Read only active plan Task 9 overview section and portfolio overview tests.
2. Add failing overview test for preview rows and summary claimable amount/source.
3. Run `pnpm test src/modules/portfolio/portfolio.service.spec.ts`; record RED.
4. Load live claimables in `getPortfolio(...)`.
5. Use first `OVERVIEW_CLAIMABLE_LIMIT` rows for preview.
6. Sum enabled base-token refund rows only; do not cross-sum different tokens.
7. If multiple token types appear without conversion, keep summary amount unavailable/zero and record risk.
8. Run portfolio service tests; record GREEN.
9. Update tracker/session kickoff/session log.

## API impact for FE

`API data-source/behavior change`.

- `/portfolio/:address/claimables` now returns real refund claimables from rejected/unrefunded async deposit requests.
- `/portfolio/:address` claimable preview/summary can become live.
- FE action needed: review disabled reasons, refund copy, empty states, and token summary assumptions.

## Verification

- `pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts`
- `pnpm test src/modules/portfolio/portfolio.service.spec.ts`

## Architecture docs check

Canonical API docs must be updated in this epic. Integration docs must state current claimables are refund-only and rewards require future contract sources before initiative completion.
