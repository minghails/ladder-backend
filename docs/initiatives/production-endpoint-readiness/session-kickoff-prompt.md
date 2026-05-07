# Production Endpoint Readiness Session Kickoff

## Copy-paste prompt for next agent

```text
Read `backend/docs/HANDOFF.md` first and follow it exactly.

Active initiative: `backend/docs/initiatives/production-endpoint-readiness/`
Active tracker: `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
Active plan: `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
Active epic: `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`
Active slice: Slice 1 — quote simulation service extraction.
Latest session log: `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-production-chart-source-behavior.md`

Do not scan unrelated backend plans, initiatives, sessions, or raw docs. Read only:
1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
5. `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
6. `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-quote-production-accuracy.md`
7. latest session log named above
8. source files needed for the active quote slice only.

Work one bounded slice only: quote simulation service extraction.

Slice scope:
- Move base instant simulation logic out of `QuotesService` into `QuoteSimulationService`.
- Add tranche preview helper seams required by later quote slices only if they fit the bounded extraction.
- Preserve action hints and no-calldata behavior.
- Preserve existing quote API behavior unless tests prove extraction requires source-label/doc changes.

Likely files:
- `backend/src/modules/quotes/quote-simulation.service.ts`
- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/quotes/quote-simulation.service.spec.ts`
- `backend/src/shared/blockchain/contract-reader.service.ts` only if helper seams are required.
- `docs/canonical/api-contract.md` only if request/response source fields change.

Required verification:
- Targeted quote simulation tests.
- Relevant quote service/controller tests.
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
