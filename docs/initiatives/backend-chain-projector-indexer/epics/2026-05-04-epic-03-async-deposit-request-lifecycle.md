# Epic 3 — Async Deposit Request Lifecycle

## Goal

Project async base deposit events into `deposit_requests` and expose real request status.

## Source plan sections

- `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md` §6, Tasks 14–17.

## Scope

- Deposit request schema fields.
- Deposit request projector.
- `GET /deposit-requests/:id` endpoint.
- Portfolio request mapping review.

## Non-goals

- No backend write orchestration for reject/refund/settle.
- No operator tx submission.
- No settlement job.

## Slice 1 — deposit request schema

**Goal:** Add lifecycle fields needed by event projection.

**Files:**
- Modify: `backend/src/shared/database/schema/deposit-requests.ts`
- Generate: Drizzle migration under existing migrations folder

**Steps:**
- [ ] Read current deposit request schema and service expectations.
- [ ] Add `adaptor_request_id` nullable.
- [ ] Add lifecycle tx/timestamp fields from plan if schema can safely accept them.
- [ ] Add optional settlement value fields only if needed by endpoint/FE in current slice plan.
- [ ] Generate migration and inspect safety.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm db:generate` — expected: migration generated and manually inspected.

## Slice 2 — deposit request projector

**Goal:** Map async deposit events to request lifecycle rows idempotently.

**Files:**
- Create: `backend/src/modules/chain-projector/deposit-request.projector.ts`
- Create: `backend/src/modules/chain-projector/deposit-request.projector.spec.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.module.ts`

**Steps:**
- [ ] Write failing test: `DepositRequested` inserts request row.
- [ ] Write failing test: `DepositBasePulled` status `pulled`.
- [ ] Write failing test: `DepositRequestLinked` stores `adaptorRequestId` and status `linked`.
- [ ] Write failing test: `DepositSettled` status `settled` and settlement fields if columns exist.
- [ ] Write failing test: `DepositRejected` stores `reasonCode` and status `rejected`.
- [ ] Write failing test: `DepositRefunded` status `refunded`.
- [ ] Write failing test: out-of-order update for missing row logs warning and continues.
- [ ] Implement projector mapping from plan.
- [ ] Wire projector into `ChainProjectorService`.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/chain-projector/deposit-request.projector.spec.ts src/modules/chain-projector/chain-projector.service.spec.ts` — expected: pass.

## Slice 3 — deposit request detail endpoint

**Goal:** Expose indexed request state through `GET /deposit-requests/:id`.

**Files:**
- Modify: `backend/src/modules/deposit-requests/deposit-requests.service.ts`
- Modify: `backend/src/modules/deposit-requests/deposit-requests.controller.ts`
- Modify: `backend/src/modules/deposit-requests/deposit-requests.service.spec.ts`
- Assess/update: `docs/canonical/api-contract.md`

**Steps:**
- [ ] Confirm whether `POST /deposit-requests` stays deferred; record decision if changed.
- [ ] Write failing test for detail response from indexed row.
- [ ] Write failing test for not found behavior.
- [ ] Implement `GET /deposit-requests/:id` response with `dataQuality.sources.request = indexed_events`.
- [ ] Update canonical API docs if concrete response behavior changes.
- [ ] Run targeted tests.
- [ ] Update tracker and session log.

**Verification:**
- `pnpm test src/modules/deposit-requests` — expected: pass.

## Slice 4 — portfolio request mapping check

**Goal:** Ensure `/portfolio/:address/requests` benefits from projected rows without unnecessary service growth.

**Files:**
- Modify only if needed: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify only if needed: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Assess/update: `docs/canonical/api-contract.md`

**Steps:**
- [ ] Read current portfolio request mapping.
- [ ] Add failing test only if current mapping misses projected fields required by API.
- [ ] Add `adaptorRequestId` mapping only if DTO/API needs it.
- [ ] Do not add activity derivation here.
- [ ] Run targeted tests.
- [ ] Update tracker to Epic 4 decision or Epic 5 if optional activities are deferred.
- [ ] Write session log.

**Verification:**
- `pnpm test src/modules/portfolio` — expected: pass.
