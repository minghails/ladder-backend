# Session 2026-05-20 - Epic 3 Complete

## Scope

Epic 3 slices 1–3: projector DB address lookup, bounded market metadata refresh, snapshot fallback tightening.

## Files changed

- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/modules/chain-projector/market-snapshot.projector.ts`
- `backend/src/modules/chain-projector/market-snapshot.projector.spec.ts`
- `backend/src/shared/config/app.config.ts`
- `backend/src/shared/config/env.validation.ts`
- `backend/src/shared/config/env.validation.spec.ts`
- `backend/.env.example`

## Docs changed

- `backend/docs/initiatives/backend-rpc-optimization/tracker.md`
- `backend/docs/initiatives/backend-rpc-optimization/epics/2026-05-20-epic-03-lighter-projector-snapshot-rpc.md`

## API impact for FE

**No FE-facing API impact** — background indexer and internal projection only.

FE action needed: none.

### Epic 3 API impact summary

| Slice | Impact | FE code change |
|---|---|---|
| Slice 1 | Projector uses DB ST/JT addresses for `getLogs` | None |
| Slice 2 | Live market refresh bounded by `PROJECTOR_MARKET_REFRESH_MS` | None |
| Slice 3 | Snapshot projector prefers prior snapshot/event data | None |

## Verification run

```bash
cd backend
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
pnpm test src/modules/chain-projector/market-snapshot.projector.spec.ts
pnpm test src/shared/config/env.validation.spec.ts
pnpm build
pnpm exec eslint <changed files>
```

## Architecture docs checked

Indexer read-path optimization only; no API/schema/event contract change. **Architecture docs checked; no update needed.**

## Remaining risks

- Stale ST/JT addresses possible until `PROJECTOR_MARKET_REFRESH_MS` elapses after a market migration (rare in one-market pilot).
- Historical catch-up still costly; this epic targets steady-state indexing.

## Next step

Initiative milestones 1–3 complete. Optional: run `pnpm test:chain` when RPC env available; validate RPC quota reduction in pilot.
