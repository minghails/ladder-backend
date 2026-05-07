# Production Endpoint Readiness Session Kickoff

## Copy-paste prompt for next agent

```text
Read `backend/docs/HANDOFF.md` first and follow it exactly.

Active initiative: `backend/docs/initiatives/production-endpoint-readiness/`
Active tracker: `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
Active plan: `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
Active epic: `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-mock-removal-guardrails.md`
Active slice: Slice 1 — production mock policy helper.
Latest session log: `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-prepare-implementation.md`

Do not scan unrelated backend plans, initiatives, sessions, or raw docs. Read only:
1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
5. `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
6. `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-mock-removal-guardrails.md`
7. latest session log named above
8. source files needed for Slice 1 only.

Work one bounded slice only: production mock policy helper.

Slice 1 scope:
- Create central portfolio production-mode helper.
- Update portfolio mock gating to disable mock rows by default and in production.
- Keep local sandbox mock mode only when explicit env + query are both enabled.
- Update canonical API docs if endpoint semantics change.

Likely files:
- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio-production-mode.ts`
- `backend/src/modules/portfolio/portfolio-production-mode.spec.ts`
- Portfolio service/controller specs as needed.
- `docs/canonical/api-contract.md` if needed.

Required verification:
- Targeted tests for helper/service.
- `pnpm lint` if source changes.
- Additional tests if touched areas require them.

Before marking slice done:
- Check `docs/canonical/backend-architecture.md` and backend architecture docs only for relevant changes.
- If API behavior/source labels changed, update `docs/canonical/api-contract.md`.
- Record either exact docs updated or `Architecture docs checked; no update needed`.
- Update tracker slice log and active slice.
- Write session log under `backend/docs/initiatives/production-endpoint-readiness/sessions/`.

Completion report must include:
- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
```
