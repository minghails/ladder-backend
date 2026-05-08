# Session 2026-05-07 - Production Mock Policy Helper

## Scope

Implement Slice 1 — production mock policy helper from `backend/docs/initiatives/production-endpoint-readiness/epics/2026-05-07-mock-removal-guardrails.md`.

## Work completed

- Added central portfolio mock policy helper.
- Updated portfolio service mock gating to require `includeMock=true`, `PORTFOLIO_MOCK_FALLBACK=true`, and non-production `NODE_ENV`.
- Updated portfolio tests for sandbox-only mock mode and production/default empty behavior.
- Updated canonical API docs for sandbox-only mock semantics.

## Files changed

- `backend/src/modules/portfolio/portfolio-production-mode.ts`
- `backend/src/modules/portfolio/portfolio-production-mode.spec.ts`
- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
- `docs/canonical/api-contract.md`
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
- `backend/docs/initiatives/production-endpoint-readiness/sessions/2026-05-07-production-mock-policy-helper.md`

## Docs changed

- `docs/canonical/api-contract.md`: documented portfolio mock mode as sandbox-only and disabled in production/default responses.
- `backend/docs/initiatives/production-endpoint-readiness/tracker.md`: marked Slice 1 complete and Slice 2 active.

## API impact for FE

API data-source/behavior change. Portfolio response shapes are unchanged, but `includeMock=true` no longer returns mock rows unless `PORTFOLIO_MOCK_FALLBACK=true` and `NODE_ENV !== 'production'`. Default and production responses return live/DB rows, empty arrays, or `unavailable` sources. FE action needed: none for production; sandbox fixtures must set env flag.

## Verification run

- `pnpm test src/modules/portfolio/portfolio-production-mode.spec.ts` — passed.
- `pnpm test -- portfolio` — passed.
- `pnpm lint` — passed with existing warnings in `src/modules/quotes/quotes.service.ts` about unused eslint-disable directives.

## Architecture docs checked

Architecture docs checked; no update needed.

## Remaining risks

- Existing lint warnings in quotes service remain unrelated to this slice.
- Further mock fixture removal is still needed for chart paths in Slice 2.

## Next step

Start Slice 2 — remove production chart fixtures.
