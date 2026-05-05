# Architecture — Backend FE Wagmi Trade Support

## Purpose

Prepare backend read/preflight support so FE can execute deployed Market calls with wagmi.

## Operating flow

```text
plan
  -> tracker
    -> epic contract
      -> one bounded slice
        -> tests + implementation
        -> docs sync check
        -> session log + tracker update
```

## Module boundaries

- `quotes` owns quote/preflight response shapes, action hints, approval hints, and derived quote math.
- `market-state` owns `trade-constraints` response metadata for forms, methods, capabilities, limits, and warnings.
- `tx-status` owns indexed transaction status read model from existing `market_events`.
- `app.module` wires new module only.
- `shared/database/schema` should not change unless implementation discovers `market_events` lacks required columns.

## API docs sync

- Any public endpoint shape change requires `docs/canonical/api-contract.md` update.
- Approval/wagmi integration semantics may require `docs/canonical/integration-rules.md` update.
- No smart contract event docs update expected unless tx status changes event assumptions.

## Handoff quality bar

Each slice session must record:

- active epic/slice
- files touched
- tests/lint/build run and result
- API impact category from `backend/docs/HANDOFF.md`
- architecture docs updated, or `Architecture docs checked; no update needed`
- unresolved risks
- next exact action
