# Session — market bootstrap and projector types

## Active slice

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-01-minimum-working-projector.md`
- Slice: Slice 3 — market bootstrap and projector types

## Files changed

- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/modules/chain-projector/chain-projector.module.ts`
- `backend/src/modules/chain-projector/projector.types.ts`
- `backend/docs/initiatives/backend-chain-projector-indexer/tracker.md`
- `backend/docs/initiatives/backend-chain-projector-indexer/sessions/2026-05-04-market-bootstrap-projector-types.md`

## Tests added/changed

- Updated `backend/src/modules/chain-projector/chain-projector.service.spec.ts`.

The tests assert:

- `runOnce()` upserts the configured market before projected rows.
- Market bootstrap reads live contract state through `ContractReaderService.getMarketState()`.
- Repeated `runOnce()` calls update the same configured market row through conflict update.
- Market name is derived from the live senior symbol by stripping `st-`, with service fallback logic in implementation.

## Verification run

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: RED first — failed because `runOnce` did not exist.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
```

Result: pass — 3 tests passed.

```bash
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts src/shared/database/schema/projector-schema.spec.ts src/shared/config/env.validation.spec.ts
```

Result: pass — 13 tests passed.

```bash
pnpm lint
```

Result: pass.

```bash
pnpm build
```

Result: pass.

## Decisions made

- `runOnce()` currently performs only idempotent market bootstrap; log fetch/decode/persist stays deferred to Slice 5.
- Configured market addresses are normalized to lowercase before DB upsert.
- Market display name is derived from `seniorSymbol` by removing the `st-` prefix, falling back to the normalized market address if the symbol is empty.
- `ChainProjectorModule` now imports `BlockchainModule` and `DatabaseModule` so `ContractReaderService` and `DRIZZLE_DB` resolve inside the feature module.

## API impact for FE

- Classification: `No FE-facing API impact`
- Endpoints affected: None
- Before: No public/admin endpoint contract changed.
- After: No public/admin endpoint contract changed; backend bootstrap behavior changed only.
- FE action needed: none
- API docs updated: no

## Architecture/docs check

- Architecture docs checked; no update needed.
- Rationale: `backend/docs/architecture.md` already documents `chain-projector -> shared/blockchain, shared/database`, and initiative architecture already assigns market bootstrap/projector behavior to `modules/chain-projector`.

## Risks / blockers

- `runOnce()` does not fetch logs or update cursors yet; that remains Slice 5.
- Market bootstrap depends on live RPC reads through `ContractReaderService.getMarketState()`.

## Tracker update

- Marked Epic 1, Slice 3 complete.
- Advanced active slice to Epic 1, Slice 4 — event normalizer and viem chain ID.

## Next step

- Implement Epic 1, Slice 4 — event normalizer and viem chain ID.
