# Production Endpoint Readiness Session Kickoff

## Copy-paste prompt for next agent

```text
Read `backend/docs/HANDOFF.md` first and follow it exactly.

Active initiative: `backend/docs/initiatives/production-endpoint-readiness/`
Active tracker: `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
Active plan: `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
Active epic: `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-portfolio-read-models.md`
Active slice: Slice 3 — production earnings/history.
Latest session log: `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-production-portfolio-overview.md`

Do not scan unrelated backend plans, initiatives, sessions, or raw docs. Read only:
1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
5. `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
6. active epic named above
7. latest session log named above
8. source files needed for active slice only.

Work one bounded slice only: production earnings/history.

Slice 3 scope:
- Keep earnings table from cost basis + live positions.
- Implement history only from real snapshot/cashflow data.
- If no history projection exists, return empty series + `historyAvailable=false` + unavailable source.
- No mock earnings/history in default/production mode.

Before marking slice done:
- Check `docs/canonical/backend-architecture.md` and backend architecture docs only for relevant changes.
- If API behavior/source labels changed, update `docs/canonical/api-contract.md`.
- Record either exact docs updated or `Architecture docs checked; no update needed`.
- Update tracker slice log, active slice, and this session kickoff prompt.
- Write session log under `backend/docs/initiatives/production-endpoint-readiness/sessions/`.

Completion report must include:
- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
```
