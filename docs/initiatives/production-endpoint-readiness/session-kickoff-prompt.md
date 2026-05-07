# Production Endpoint Readiness Session Kickoff

## Copy-paste prompt for next agent

```text
Read `backend/docs/HANDOFF.md` first and follow it exactly.

Active initiative: `backend/docs/initiatives/production-endpoint-readiness/`
Active tracker: `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
Active plan: `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
Active epic: `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`
Active slice: Slice 3 — withdraw YT quote previews.
Latest session log: `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-deposit-yt-quote-previews.md`

Do not scan unrelated backend plans, initiatives, sessions, or raw docs. Read only:
1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
5. `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
6. `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`
7. latest session log named above
8. source files needed for Slice 3 only.

Work one bounded slice only: withdraw YT quote previews.

Slice 3 scope:
- For `mode='shares'`, use `previewRedeem(shares)` for YT assets out.
- For `mode='assets'`, use `previewWithdraw(assets)` if ABI supports it; otherwise label exact shares estimate unavailable.
- Preserve junior withdrawal capacity derivation.
- Add tests proving `derived_identity` is gone from production output when preview is available.
- Update docs if request/response source fields change.

Likely files:
- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/quotes/quote-simulation.service.ts`
- `backend/src/shared/blockchain/contract-reader.service.ts`
- quotes service/controller specs
- `docs/canonical/api-contract.md` if response sources/fields change.

Required verification:
- Targeted withdraw YT quote tests.
- `pnpm test -- quotes`
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
