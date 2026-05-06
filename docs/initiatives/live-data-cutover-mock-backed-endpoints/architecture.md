# Architecture — Live Data Cutover For Mock-Backed Endpoints

## Purpose

Coordinate a narrow live-data cutover for FE-visible backend endpoints that currently return mock or placeholder data.

## Operating flow

```text
plan
  -> tracker
    -> epic contract
      -> one bounded slice
        -> tests + implementation
        -> docs sync check
        -> session log
        -> tracker update
```

## Plan boundaries

- Replace default mock/placeholder output with live, indexed, derived, or explicitly unavailable output.
- Preserve endpoint shapes where possible.
- Defer real projections that require new schema or product formulas.
- Keep `includeMock=true` only as explicit FE sandbox mode where existing service supports it.

## Backend module boundaries

- `portfolio` owns portfolio overview, earnings, claimables, recent activities, and data-quality labels.
- `market-state` owns market chart behavior and indexed snapshot sourcing.
- `quotes` owns withdraw-yt quote output derivation and source labels.
- Canonical API docs own FE-facing behavior contract.

## Expected docs sync

- `docs/canonical/api-contract.md` must change during implementation.
- `docs/canonical/backend-architecture.md` expected no update unless module ownership/dependencies change.
- `backend/docs/architecture.md` expected no update unless module dependencies/runtime flow change.
- If new contract reader preview/simulation is added, re-check backend architecture docs.

## Handoff quality bar

Every slice session must record:

- active plan path
- active epic/slice path
- files touched
- RED command/result when applicable
- GREEN command/result
- API impact for FE
- architecture docs updated, or `Architecture docs checked; no update needed`
- unresolved risks
- next exact action
