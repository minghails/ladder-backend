# Session Kickoff — Backend FE Wagmi Trade Support

## Copy-paste prompt for next agent

```text
Follow `backend/docs/HANDOFF.md`.
Do not scan unrelated plans/initiatives.
Work one bounded slice only.

Read first:
1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`
5. `backend/docs/initiatives/backend-fe-wagmi-trade-support/tracker.md`
6. `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-epic-3-tx-status.md`

Active slice: Epic 4 — Docs, integration checklist, and demo smoke.
Latest session log: `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-epic-3-tx-status.md`

Rules:
- Do not implement beyond active slice.
- Use TDD: failing tests first, minimal implementation, verify.
- No backend signing, private keys, or mandatory calldata.
- Before marking done, apply architecture doc sync rules from `backend/docs/HANDOFF.md`.
- Classify FE API impact using `backend/docs/HANDOFF.md`.
- Write session log under `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/`.
- Update `backend/docs/initiatives/backend-fe-wagmi-trade-support/tracker.md`.
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
4. `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`
5. `backend/docs/initiatives/backend-fe-wagmi-trade-support/tracker.md`
6. Latest session log named in tracker

## Active first slice

- Plan: `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`
- Slice: Epic 4 — Docs, integration checklist, and demo smoke
- Latest session log: `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-epic-3-tx-status.md`

## Session rules

- Do not implement beyond active slice.
- Use TDD: failing tests first, minimal implementation, verify.
- No backend signing, private keys, or mandatory calldata.
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
