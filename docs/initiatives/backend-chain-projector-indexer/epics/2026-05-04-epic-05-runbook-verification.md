# Epic 5 — Runbook and Verification

## Goal

Document projector operation and run final verification gates before declaring implementation complete.

## Source plan sections

- `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md` §8–13, Tasks 19–20 and Test Plan.

## Scope

- Chain Projector README.
- Initiative runbook.
- Canonical docs evaluation.
- Full backend/projector/API verification.

## Non-goals

- No new implementation beyond documentation/verification fixes needed to pass gates.

## Slice 1 — projector runbook

**Goal:** Give operators and future agents exact steps for running projector locally and checking DB/API output.

**Files:**
- Modify: `backend/src/modules/chain-projector/README.md`
- Create: `backend/docs/initiatives/backend-chain-projector-indexer/runbooks/projector-local-replay.md`

**Steps:**
- [ ] Update module README with config steps from plan.
- [ ] Add runbook covering env, migrations, disabled startup, enabled startup, DB checks, API checks, stop conditions.
- [ ] Include warning that exact `DEPLOYMENT_BLOCK` is required for real replay.
- [ ] Update tracker and session log.

**Verification:**
- Docs-only review by reading created/modified files.

## Slice 2 — canonical docs evaluation

**Goal:** Ensure root canonical docs match implemented API/schema/event-facing behavior.

**Files:**
- Assess/update: `docs/canonical/api-contract.md`
- Assess/update: `docs/canonical/backend-architecture.md`
- Assess/update only if semantics changed: `docs/canonical/smartcontract-events.md`
- Assess/update only if boundaries changed: `docs/canonical/integration-rules.md`

**Steps:**
- [ ] Compare final implementation against canonical docs.
- [ ] Update API contract for concrete history/chart/request semantics if needed.
- [ ] Update backend architecture only if MVP responsibility or module boundary changed.
- [ ] Do not broaden MVP scope.
- [ ] Update tracker and session log.

**Verification:**
- Docs-only review by reading changed docs.

## Slice 3 — full verification gate

**Goal:** Run final commands and record evidence before completion.

**Files:**
- Modify: `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- Create: final session log under `backend/docs/initiatives/backend-chain-projector-indexer/sessions/`

**Steps:**
- [ ] Run all backend tests.
- [ ] Run projector tests.
- [ ] Run market-state tests.
- [ ] Run DB migration smoke if local DB/env available.
- [ ] Run local dev/API smoke if RPC/env available.
- [ ] Record unavailable verification with reason; do not claim pass without evidence.
- [ ] Mark tracker complete only for gates that passed.
- [ ] List remaining risks.

**Verification:**
- `pnpm test` — expected: pass.
- `pnpm test src/modules/chain-projector` — expected: pass.
- `pnpm test src/modules/market-state` — expected: pass.
- `pnpm db:migrate` — expected: migrations apply cleanly when DB available.
- `curl http://localhost:3000/markets` and plan API smoke commands — expected: responses match plan when app/RPC available.
