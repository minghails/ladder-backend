# Session Kickoff — Portfolio Earnings And Claimables Live Projection

## Copy-paste prompt for next agent

```text
Follow `backend/docs/HANDOFF.md`.
Do not scan unrelated plans/initiatives/session logs.
Work one bounded slice only.
Do not implement beyond active slice unless explicitly requested.

Read first:
1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
5. `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
6. `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/epics/2026-05-06-epic-1-schema-accounting-core.md`
7. Latest relevant session log only if tracker names one or tracker lacks enough context.

Active slice: Epic 1 Slice 1 — Portfolio accounting schema.
Latest session log: none.

Rules:
- Stay within plan scope.
- Use TDD for behavior changes: failing test first, minimal implementation, passing test.
- Do not pull future-phase scope forward.
- Do not create backend behavior unsupported by deployed contract surface.
- Preserve `includeMock=true` sandbox behavior where portfolio service paths are touched.
- Before marking done, apply architecture doc sync rules from `backend/docs/HANDOFF.md`.
- Classify FE API impact using `backend/docs/HANDOFF.md`.
- Write session log under `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/sessions/`, update tracker, and keep this copy-paste prompt current.

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
4. `backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`
5. `backend/docs/initiatives/portfolio-earnings-claimables-live-projection/tracker.md`
6. Active epic contract
7. Latest relevant session log only if tracker lacks context

## Session rules

- Execute one bounded slice per session unless user asks otherwise.
- Record RED/GREEN evidence for tests.
- Record lint/build verification when slice completion requires it or commands are available.
- Update canonical docs in same PR when API/schema/event/integration behavior changes.
- Keep this file current after every session.
