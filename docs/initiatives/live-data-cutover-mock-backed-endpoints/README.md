# Initiative — Live Data Cutover For Mock-Backed Endpoints

## Plan

`backend/docs/plans/2026-05-05-live-data-cutover-mock-backed-endpoints.md`

## Goal

Remove misleading mock/placeholder data from 5 FE-visible endpoints and replace it with live, indexed, derived, or explicitly unavailable data while keeping REST shapes stable where possible.

## Scope

- `GET /portfolio/:address/earnings`: default empty/unavailable; explicit `includeMock=true` sandbox only.
- `GET /portfolio/:address/claimables`: default empty list; explicit `includeMock=true` sandbox only.
- `GET /portfolio/:address`: money-like aggregates use zero/unavailable unless explicit sandbox mock requested.
- `GET /markets/:address/charts?metric=yield|utilization`: empty/unavailable, no mock fixtures.
- `POST /quotes/withdraw-yt`: output labels become `derived` or `derived_identity`, not placeholder.
- Update `docs/canonical/api-contract.md` for FE-visible behavior changes.

## Non-goals

- No DB migrations for cost-basis, reward accrual, claimable ledger, or chart projections.
- No transaction calldata.
- No admin/operator claim/refund actions.
- No contract ABI changes.
- No invented utilization formula.
- No live tranche `previewRedeem` unless explicitly added during Task 5 after code review.

## Source-of-truth order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. Active plan file
5. `tracker.md`
6. Active epic file only
7. Latest relevant session log only if tracker names it or lacks context

## Current status

Prepared for implementation. No source code changed by initiative activation.
