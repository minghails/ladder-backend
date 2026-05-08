# Epic: Verification and Release Gates

## Goal

Add cross-endpoint production readiness tests and final release verification gates.

## Source plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md` Chunk 5.

## Slices

### Slice 1 — production endpoint audit tests

**Plan task:** Task 14

**Scope**

- Add audit test that default API responses do not include mock sources or known mock fixture IDs.
- Add contract checks for `dataQuality.sources` on affected endpoints.
- Add empty DB behavior tests.

**Likely files**

- `backend/src/test/production-endpoint-readiness.spec.ts`
- relevant test setup fixtures
- endpoint test fixtures as needed

**Acceptance**

- Test fails if default/production responses include `source='mock'`.
- Test fails if affected endpoints omit required data-quality source labels.
- Empty DB paths are explicitly covered.

### Slice 2 — end-to-end production smoke

**Plan task:** Task 15

**Scope**

- Add/extend e2e smoke covering market load, quote, tx/projector indexing, portfolio refresh, and no mock data.
- Run full verification commands from plan.

**Likely files**

- backend e2e test files as existing patterns require
- test setup helpers as needed

**Acceptance**

- E2E flow verifies no mock data appears.
- Full verification target:

```bash
pnpm lint
pnpm test
pnpm test:int
pnpm test:chain
pnpm test:e2e
pnpm build
```

## Epic completion criteria

- Production readiness test suite exists.
- Full verification passes or failures are documented with exact blockers.
- Final API impact summary added to tracker.
