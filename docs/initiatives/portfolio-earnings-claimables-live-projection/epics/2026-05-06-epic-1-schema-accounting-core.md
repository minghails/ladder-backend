# Epic 1 — Schema And Accounting Core

## Goal

Add database schema and pure average-cost accounting helpers for portfolio PnL projection.

## Scope

- `backend/src/shared/database/schema/portfolio-cashflows.ts`
- `backend/src/shared/database/schema/portfolio-cost-basis.ts`
- `backend/src/shared/database/schema/index.ts`
- `backend/src/shared/database/migrations/*`
- `backend/src/shared/database/schema/projector-schema.spec.ts`
- `backend/src/modules/portfolio/portfolio-accounting.service.ts`
- `backend/src/modules/portfolio/portfolio-accounting.service.spec.ts`

## Slices

### Slice 1 — Portfolio accounting schema

Tasks:

1. Read only active plan data model section, tracker, and existing schema/index/migration patterns.
2. Add failing export test for `portfolioCashflows` and `portfolioCostBasis` in `projector-schema.spec.ts`.
3. Run `pnpm test src/shared/database/schema/projector-schema.spec.ts`; record RED.
4. Create `portfolio-cashflows.ts` with fields/index from plan.
5. Create `portfolio-cost-basis.ts` with fields/index from plan.
6. Export both tables from schema `index.ts`.
7. Run same schema test; record GREEN.
8. Generate Drizzle migration with `pnpm db:generate`; record migration path.
9. Update tracker/session kickoff/session log.

### Slice 2 — Pure average-cost accounting service

Tasks:

1. Read only active plan Task 2 and portfolio module naming patterns.
2. Add failing tests for deposit, average-cost withdrawal, closes-all dust clearing, and partial withdrawal when shares exceed open shares.
3. Run `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts`; record RED.
4. Implement pure `applyDeposit` and `applyWithdrawal` functions using stringified bigint integers only.
5. Ensure closes-all sets `openShares = '0'` and `openCostBasis = '0'`.
6. Ensure insufficient history marks `dataQuality = 'partial'`.
7. Run same accounting service test; record GREEN.
8. Update tracker/session kickoff/session log.

## API impact for FE

`No FE-facing API impact` for this epic unless API source literals are changed early.

## Verification

- `pnpm test src/shared/database/schema/projector-schema.spec.ts`
- `pnpm db:generate`
- `pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts`

## Architecture docs check

Schema/data ownership changes require canonical backend architecture update before initiative completion. Record pending docs update if not done in this epic.
