# Tracker — Backend FE Wagmi Trade Support

## Active

- Epic: `backend/docs/initiatives/backend-fe-wagmi-trade-support/epics/2026-05-05-epic-1-quotes-preflight.md`
- Slice: Slice 1 — Direct YT deposit quote
- Session kickoff: `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md`

## Active plan

- `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`

## Planned

1. Epic 1 — Correct and complete quote/preflight support
2. Epic 2 — Complete trade constraints for FE forms
3. Epic 3 — Add tx status endpoint backed by indexed events
4. Epic 4 — Docs, integration checklist, and demo smoke

## In Progress

- None; implementation not started.

## Next Up

1. Execute Epic 1 Slice 1 only.
2. Write failing quote tests before implementation.
3. After slice, update tracker, create session log, and refresh `session-kickoff-prompt.md` copy-paste block for the next agent.

## Done

- Initiative docs generated from plan.
- Epics and bounded slices generated from plan scope.

## Blocked

- None.

## Risks

- Exact `depositInstant` output may require adaptor quote not currently available; label source honestly.
- Direct YT deposit/withdraw use stale `latestYtPrice`; keep warnings.
- Projector lag can keep tx status `not_indexed` after wallet success.
- Backend quote is preflight only; chain can still revert before mining.

## Needs Decision

- Include ordered args array only if FE requests it.

## Recently Updated

- 2026-05-05: Initiative activated for implementation docs only; no code changed.
