# Session Kickoff — Live Deposit-Base Onchain Simulation

## Copy-paste prompt for next agent

```text
Follow `backend/docs/HANDOFF.md`.
Do not scan unrelated plans/initiatives.
Work one bounded slice only.

Read first:
1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`
5. `backend/docs/initiatives/live-deposit-base-onchain-simulation/tracker.md`
6. `backend/docs/initiatives/live-deposit-base-onchain-simulation/epics/2026-05-05-epic-1-contract-simulation-service.md`
7. `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-activation.md`

Active slice: Epic 1 Slice 1 — Add simulation helper.
Latest session log: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-activation.md`

Rules:
- Do not implement beyond active slice.
- Use TDD: failing tests first, minimal implementation, verify.
- No backend signing, private keys, transaction submission, or mandatory calldata.
- Before marking done, apply architecture doc sync rules from `backend/docs/HANDOFF.md`.
- Classify FE API impact using `backend/docs/HANDOFF.md`.
- Write session log under `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/`.
- Update `backend/docs/initiatives/live-deposit-base-onchain-simulation/tracker.md`.
- Update this kickoff prompt so it points to the exact next epic/slice/session log for the next agent.

Completion report required:
- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
```

## First response instructions

Follow `backend/docs/HANDOFF.md`. Do not scan unrelated plans/initiatives. Work one bounded slice only.

## Read first

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`
5. `backend/docs/initiatives/live-deposit-base-onchain-simulation/tracker.md`
6. Active epic file named in tracker
7. Latest session log named in tracker

## Active first slice

- Plan: `backend/docs/plans/2026-05-05-live-deposit-base-onchain-simulation.md`
- Epic: `backend/docs/initiatives/live-deposit-base-onchain-simulation/epics/2026-05-05-epic-1-contract-simulation-service.md`
- Slice: Epic 1 Slice 1 — Add simulation helper
- Latest session log: `backend/docs/initiatives/live-deposit-base-onchain-simulation/sessions/2026-05-05-activation.md`

## Session rules

- Do not implement beyond active slice.
- Use TDD: failing tests first, minimal implementation, verify.
- No backend signing, private keys, transaction submission, or mandatory calldata.
- Before marking done, apply architecture doc sync rules from `backend/docs/HANDOFF.md`.
- Classify FE API impact using `backend/docs/HANDOFF.md`.
- Write session log under `sessions/` and update tracker.
- After every slice or epic, update this kickoff prompt so user can copy it directly for the next agent.
- Keep `## Copy-paste prompt for next agent` current: exact active epic, active slice, latest relevant session log, and next action.

## Completion report required

- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
