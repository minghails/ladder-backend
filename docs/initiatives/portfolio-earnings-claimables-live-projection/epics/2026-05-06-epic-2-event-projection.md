# Epic 2 — Event Projection

## Goal

Project portfolio cashflows and cost basis from indexed Market events plus tranche owner-correlation events.

## Scope

- `backend/src/modules/portfolio/portfolio-accounting.repository.ts`
- `backend/src/modules/portfolio/portfolio-accounting.repository.spec.ts`
- `backend/src/modules/portfolio/portfolio.module.ts`
- Existing chain projector event handler(s) under `backend/src/modules/chain-projector/`
- Relevant chain projector specs
- Market and tranche ABI files only as needed

## Slices

### Slice 1 — Accounting repository

Tasks:

1. Read only active plan Task 3 and existing repository test patterns.
2. Add failing repository test proving duplicate same tx/log cashflow inserts only create one row and do not double-apply cost basis.
3. Run `pnpm test src/modules/portfolio/portfolio-accounting.repository.spec.ts`; record RED.
4. Implement `recordDepositCashflow`, `recordWithdrawalCashflow`, `upsertCostBasis`, `findCostBasisByWallet`, and `findCashflowsByWallet`.
5. Use `onConflictDoNothing` for cashflow unique key and `onConflictDoUpdate` for cost basis.
6. Return enough insert result state so caller can avoid reapplying cost basis when duplicate cashflow is skipped.
7. Run repository test; record GREEN.
8. Update tracker/session kickoff/session log.

### Slice 2 — Project Market cashflows

Tasks:

1. Read only active plan Task 4, chain projector event handler, projector tests, portfolio module, and Market ABI.
2. Add failing projector tests for `DepositSettled` and `WithdrawYT` mapping into accounting repository.
3. Add failing direct `DepositYT` test only where owner assignment is safe.
4. Run `pnpm test src/modules/chain-projector`; record RED.
5. Register accounting repository/service in `portfolio.module.ts` as needed.
6. Dispatch Market events to accounting projection after events are indexed.
7. Apply cost basis only after successful non-duplicate cashflow insert.
8. Run projector and portfolio accounting tests; record GREEN.
9. Update tracker/session kickoff/session log.

### Slice 3 — Tranche event owner correlation

Tasks:

1. Read only active plan Task 4, chain projector handler/tests, ST/JT tranche ABI files, and config/address source.
2. Add failing test for instant deposit where `DepositYT.user` differs from tranche ERC-4626 `Deposit.owner`.
3. Extend watched addresses/log decode to include ST and JT tranche `Deposit` events.
4. Correlate same transaction `DepositYT` with exactly one matching tranche `Deposit` by shares/assets/tranche/log order.
5. Assign wallet to tranche `Deposit.owner` when correlation succeeds.
6. If ownership cannot be determined safely, skip cashflow or mark coverage partial; do not guess.
7. Run `pnpm test src/modules/chain-projector` plus accounting tests; record GREEN.
8. Update tracker/session kickoff/session log.

## API impact for FE

`No FE-facing API impact` for projection-only slices until endpoints read projected data.

## Verification

- `pnpm test src/modules/chain-projector`
- `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts`

## Architecture docs check

Projection responsibilities and new module dependencies must be captured in canonical backend architecture and possibly `backend/docs/architecture.md` before initiative completion.
