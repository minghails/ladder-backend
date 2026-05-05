# Tracker — Backend FE Wagmi Trade Support

## Active

- Epic: Epic 2 — Complete trade constraints for FE forms
- Slice: Epic 2 first slice — Trade constraints expansion
- Session kickoff: `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md`
- Latest session: `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-epic-1-complete-quotes-preflight.md`

## Active plan

- `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`

## Planned

1. Epic 1 — Correct and complete quote/preflight support
2. Epic 2 — Complete trade constraints for FE forms
3. Epic 3 — Add tx status endpoint backed by indexed events
4. Epic 4 — Docs, integration checklist, and demo smoke

## In Progress

- None.

## Next Up

1. Execute Epic 2 — Complete trade constraints for FE forms.
2. Write failing market-state tests before implementation.
3. After slice, update tracker, create session log, and refresh `session-kickoff-prompt.md` copy-paste block for the next agent.

## Done

- Initiative docs generated from plan.
- Epics and bounded slices generated from plan scope.
- Epic 1 Slice 1 — Direct YT deposit quote.
- Epic 1 Slice 2 — Correct withdraw quote.
- Epic 1 Slice 3 — Upgrade base instant quote hints.
- Epic 1 — Correct and complete quote/preflight support.

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

- 2026-05-05: Epic 1 completed. Added direct YT deposit quote, corrected withdraw quote to Market `withdraw`, upgraded base instant quote hints, updated tests/DTOs/API docs. API impact: `API contract change`. Architecture docs checked; no update needed. Next: Epic 2 trade constraints.
- 2026-05-05: Epic 1 Slice 1 completed. Added `POST /quotes/deposit-yt`, direct YT quote math, action/approval hints, service tests, Swagger DTOs, and API contract docs. API impact: `API contract change`. Architecture docs checked; no update needed. Next: Epic 1 Slice 2.
- 2026-05-05: Initiative activated for implementation docs only; no code changed.
