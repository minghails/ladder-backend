# Production Endpoint Readiness Initiative

Generated from `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`.

## Goal

Make backend endpoints production-safe by removing default/mock data, replacing placeholders with live contract reads or indexed projections, and making non-live fields explicitly unavailable or source-labelled.

## Scope

- Remove production/default mock behavior.
- Lock APY to tranche exchange-rate snapshots: `convertToAssets(1e18)` for ST/JT.
- Keep utilization unavailable until contracts/adaptor expose idle/deployed/liquidity source state.
- Improve quotes, market metadata, charts, portfolio read models, and production readiness tests.

## Out of scope

- Admin UI/signer/admin write endpoints.
- Contract changes.
- `/tx/:hash` receipt lookup.
- Stable Vaults, swaps, deleveraging, freeze/delist execution, or base withdrawal.

## Source of truth

1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-07-production-endpoint-readiness.md`
5. `backend/docs/initiatives/production-endpoint-readiness/tracker.md`
