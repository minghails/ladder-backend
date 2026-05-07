# Production Endpoint Readiness Session Kickoff

## Copy-paste prompt for next agent

```text
Read `backend/docs/HANDOFF.md` first and follow it exactly.

Active initiative: `backend/docs/initiatives/production-endpoint-readiness/`
Active tracker: `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
Active plan: `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
Active epic: `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`
Active slice: Slice 2 — deposit YT quote previews.
Latest session log: `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-quote-simulation-service-extraction.md`

Do not scan unrelated backend plans, initiatives, sessions, or raw docs. Read only:
1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
5. `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
6. `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`
7. latest session log named above
8. source files needed for Slice 2 only.

Work one bounded slice only: deposit YT quote previews.

Slice 2 scope:
- Use tranche `previewDeposit(amountYt)` for `sharesOut` instead of identity assumption.
- Preserve derived NAV/risk capacity checks.
- Do not require sender or encoded calldata.
- Set source labels so `sharesOut` is `live_contract_preview` when preview succeeds and constraints remain `derived`.

Likely files:
- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/quotes/quote-simulation.service.ts` if preview helper belongs there
- `backend/src/shared/blockchain/contract-reader.service.ts` for preview read helper if needed
- quotes service/controller specs
- `docs/canonical/api-contract.md` if response sources/fields change.

Required verification:
- Targeted deposit YT quote tests.
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
