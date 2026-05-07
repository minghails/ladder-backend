# Production Endpoint Readiness Session Kickoff

## Copy-paste prompt for next agent

```text
Read `backend/docs/HANDOFF.md` first and follow it exactly.

Active initiative: `backend/docs/initiatives/production-endpoint-readiness/`
Active tracker: `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
Active plan: `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
Active epic: `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-market-metadata-apy-charts.md`
Active slice: Slice 2 — APY snapshots and APY service.
Latest session log: `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-live-token-metadata-reads.md`

Do not scan unrelated backend plans, initiatives, sessions, or raw docs. Read only:
1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
5. `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
6. `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-market-metadata-apy-charts.md`
7. latest session log named above
8. source files needed for Slice 2 only.

Work one bounded slice only: APY snapshots and APY service.

Slice 2 scope:
- Add APY snapshot source for `st.convertToAssets(1e18)` and `jt.convertToAssets(1e18)`.
- Add repository/service to compute ST/JT APY from valid snapshot pairs.
- Use compound annualized formula if practical; simple annualized fallback allowed by plan.
- Return `unavailable` with fewer than 2 valid points.

Likely files:
- `backend/src/modules/market-state/market-apy.service.ts`
- `backend/src/modules/market-state/market-analytics.repository.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- optional `backend/src/shared/database/schema/market-apy-snapshots.ts`
- optional projector snapshot writer files
- `backend/src/modules/market-state/market-apy.service.spec.ts`
- `docs/canonical/api-contract.md` if response/source semantics change.

Required verification:
- Targeted APY service/repository tests.
- `pnpm test -- market-state`
- `pnpm lint` if source changes.
- Additional tests if touched areas require them.

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
