# Architecture — Backend Chain Projector / Indexer

## Purpose

This initiative turns an approved backend plan into bounded agent-ready implementation slices for a real Chain Projector.

## Operating flow

```text
plan
  -> tracker
    -> active epic
      -> one bounded slice
        -> tests + implementation
        -> verification
        -> tracker update
        -> session log
```

## Plan boundaries

The projector is a read-model/data-plane feature. It indexes deployed Market events into PostgreSQL and feeds backend read APIs. It does not submit protocol-affecting transactions.

## Backend module boundaries

- `shared/config` owns environment validation and `projectorConfig`.
- `shared/blockchain` owns viem client access, chain ID, Market address, and current ABI/address package.
- `shared/database/schema` owns Drizzle tables and migration-generating schema changes.
- `modules/chain-projector` owns event ranges, log fetch/decode, arg normalization, raw event inserts, cursor advancement, derived projectors, and optional background loop.
- `modules/market-state` owns market history and chart API mapping from `market_snapshots`.
- `modules/deposit-requests` owns read API for indexed async request state.
- `modules/portfolio` may read indexed request/activity data but must not become a large projection module.

## Data flow

```text
Base Sepolia Market logs
  -> viem public client
    -> chain-projector decode + normalize
      -> market_events idempotent raw rows
      -> market_snapshots / price_updates / deposit_requests derived rows
      -> market-state / deposit-requests / portfolio REST reads
```

## Cursor safety rules

- Cursor ID format: `market:<chainId>:<marketAddressLowercase>`.
- `fromBlock` starts at `DEPLOYMENT_BLOCK` if no cursor exists.
- `safeToBlock = head - PROJECTOR_CONFIRMATIONS`.
- Batch must not exceed `PROJECTOR_BATCH_SIZE`.
- Cursor advances only after all writes for the batch succeed.
- Duplicate raw logs use unique `(chain_id, market_address, tx_hash, log_index)` semantics.
- Derived rows also need idempotent source identity.

## Event semantics

- Preserve raw ABI arg names in raw event JSON.
- Normalize misleading `jtStRatioAfter` to semantic `stJtRatioAfter` in code/API.
- Use block timestamps from `client.getBlock({ blockNumber })` for projected history.
- Ignore unknown logs.
- Skip incomplete logs with logger warning.

## Deployment/input constraints

- Network: Base Sepolia.
- Chain ID: `84532`.
- Market: `0x3aDa769dC813e3376fCD40d05bEA12263048A487`.
- Exact `DEPLOYMENT_BLOCK` required before real replay.

## Handoff quality bar

Each session log must include:

- active plan path
- active epic/slice path
- files touched
- tests added/changed
- verification command and result
- unresolved risks
- next exact action
