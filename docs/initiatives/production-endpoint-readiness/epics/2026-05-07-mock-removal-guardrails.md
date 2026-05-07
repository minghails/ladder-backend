# Epic: Mock Removal Guardrails

## Goal

Ensure production/default API paths cannot return mock portfolio data or fixture chart series.

## Source plan

`backend/docs/plans/2026-05-07-production-endpoint-readiness.md` Chunk 1.

## Active slice

### Slice 1 — production mock policy helper

**Scope**

- Create central portfolio production-mode helper.
- Update portfolio mock gating to disable mock rows by default and in production.
- Keep local sandbox mock mode only when explicit env + query are both enabled.
- Update API docs if endpoint semantics change.

**Plan tasks covered**

- Task 1: Define production mock policy.

**Files likely touched**

- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio-production-mode.ts`
- `backend/src/modules/portfolio/portfolio-production-mode.spec.ts`
- Portfolio service/controller specs as needed.
- `docs/canonical/api-contract.md` if source semantics are documented differently.

**Acceptance**

- `NODE_ENV=production` + `includeMock=true` returns no mock rows.
- Default mode without explicit sandbox returns no mock rows.
- Optional local sandbox requires both `includeMock=true` and `PORTFOLIO_MOCK_FALLBACK=true` outside production.
- Empty real data returns empty arrays or `unavailable`, not mock.
- API impact reported per `backend/docs/HANDOFF.md`.

## Future slices

### Slice 2 — remove production chart fixtures

Covers Task 2 after Slice 1 completes.
