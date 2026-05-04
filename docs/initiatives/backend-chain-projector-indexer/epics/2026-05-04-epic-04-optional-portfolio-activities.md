# Epic 4 — Optional Portfolio Activities

## Goal

Replace mock portfolio activity rows with rows derived from indexed `market_events`, only after core projector/history/request lifecycle work is stable.

## Source plan sections

- `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md` §7, Task 18.

## Scope

- Query indexed `market_events` for user activity.
- Prefer repository extraction if `PortfolioService` would grow too large.

## Non-goals

- No dedicated `portfolio_activities` projection table in MVP unless performance requires it later.
- No portfolio earnings or cost-basis calculations.
- No broad portfolio refactor.

## Activation condition

Only start this epic after Epics 1–3 pass targeted verification and user confirms optional activity replacement belongs in current pass.

## Slice 1 — derive activity rows from indexed events

**Goal:** Map indexed events to portfolio activity rows while keeping `PortfolioService` bounded.

**Files:**
- Prefer create: `backend/src/modules/portfolio/portfolio-activity.repository.ts`
- Prefer create: `backend/src/modules/portfolio/portfolio-activity.repository.spec.ts`
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Assess/update: `docs/canonical/api-contract.md`

**Steps:**
- [ ] Confirm user wants optional portfolio activities now.
- [ ] Read current portfolio activity code.
- [ ] Write failing tests for mappings:
  - `DepositYT(asSenior=true)` -> `buy_senior_token`
  - `DepositYT(asSenior=false)` -> `buy_junior_token`
  - `WithdrawYT(fromSenior=true)` -> `sell_senior_token`
  - `WithdrawYT(fromSenior=false)` -> `sell_junior_token`
  - `DepositRequested` -> pending buy
  - `DepositSettled` -> successful buy
- [ ] Implement repository if service would grow too large.
- [ ] Preserve mock fallback behavior only where API explicitly allows it.
- [ ] Update canonical API docs if activity source behavior changes.
- [ ] Run targeted tests.
- [ ] Update tracker to Epic 5, Slice 1.
- [ ] Write session log.

**Verification:**
- `pnpm test src/modules/portfolio` — expected: pass.
