# Session Kickoff — Live Data Cutover For Mock-Backed Endpoints

## Copy-paste prompt for next agent

```text
Follow `backend/docs/HANDOFF.md`.
Do not scan unrelated plans/initiatives.
Work one bounded slice only.

Read first:
1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-05-live-data-cutover-mock-backed-endpoints.md`
5. `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/tracker.md`
6. `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/epics/2026-05-05-epic-1-portfolio-mock-cutover.md`
7. Latest relevant session log only if tracker names it or tracker lacks context.

Active slice: Epic 1 Slice 1 — Portfolio earnings default unavailable.
Latest session log: none.

Rules:
- Stay within plan scope.
- Do not implement beyond active slice unless explicitly requested.
- Use TDD: failing test first, minimal implementation, passing test.
- Do not pull future-phase scope forward.
- Do not invent backend behavior unsupported by canonical docs or deployed contract surface.
- Keep endpoint top-level shapes stable unless plan explicitly says otherwise.
- Before marking done, apply architecture doc sync rules from `backend/docs/HANDOFF.md`.
- Classify FE API impact using `backend/docs/HANDOFF.md`.
- Write session log under `sessions/`, update tracker, and keep this copy-paste prompt current.

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
4. `backend/docs/plans/2026-05-05-live-data-cutover-mock-backed-endpoints.md`
5. `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/tracker.md`
6. Active epic file named by tracker
7. Latest relevant session log only if tracker names it or tracker lacks context

## Active first slice

- Plan: `backend/docs/plans/2026-05-05-live-data-cutover-mock-backed-endpoints.md`
- Epic: `backend/docs/initiatives/live-data-cutover-mock-backed-endpoints/epics/2026-05-05-epic-1-portfolio-mock-cutover.md`
- Slice: Epic 1 Slice 1 — Portfolio earnings default unavailable
- Latest session log: none

## Session rules

- Stay within this plan scope.
- Execute one bounded slice per session unless user asks otherwise.
- Use TDD: add failing test, verify RED, implement minimal change, verify GREEN.
- Do not pull future-phase scope forward.
- Do not invent backend behavior unsupported by current canonical docs or deployed contract surface.
- Keep endpoint top-level shapes stable unless plan explicitly says otherwise.
- Record verification evidence before marking done.
- Before marking any slice done, apply architecture doc sync from `backend/docs/HANDOFF.md`.
- Classify API impact for FE using `backend/docs/HANDOFF.md` categories.
- Update tracker and write one session log under `sessions/` before handoff.
- Keep `## Copy-paste prompt for next agent` current: exact active epic, active slice, latest relevant session log, and next action.

## Completion report required

- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
