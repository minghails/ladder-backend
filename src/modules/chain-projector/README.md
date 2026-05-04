# Chain Projector

Indexes contract events from Market.sol, maintains projector cursors, handles replay and reorg recovery.

## Responsibility
- Listen to / poll for on-chain events (Data Plane)
- Maintain `projector_cursors` for reliable indexing
- Write raw events to `market_events` table
- Trigger downstream snapshot updates

## Dependencies
- `shared/blockchain` — viem client for event fetching
- `shared/database` — Drizzle for persistence

## Events indexed
See `docs/canonical/smartcontract-events.md` for full event list.

## Local replay setup

1. Set a Base Sepolia RPC URL.
2. Set `MARKET_ADDRESS` to the deployed Market address.
3. Set `CHAIN_ID=84532`.
4. Set `DEPLOYMENT_BLOCK` to the exact Market deployment block before real replay.
5. Run migrations.
6. Start with `PROJECTOR_ENABLED=false` for normal API-only development.
7. Set `PROJECTOR_ENABLED=true` only when you want the app to run background indexing.
8. Tune `PROJECTOR_CONFIRMATIONS`, `PROJECTOR_BATCH_SIZE`, and `PROJECTOR_POLL_INTERVAL_MS` for the RPC provider.

Example:

```text
RPC_URL=<base-sepolia-rpc>
MARKET_ADDRESS=0x3aDa769dC813e3376fCD40d05bEA12263048A487
CHAIN_ID=84532
DEPLOYMENT_BLOCK=<exact-deployment-block>
PROJECTOR_ENABLED=true
PROJECTOR_CONFIRMATIONS=3
PROJECTOR_BATCH_SIZE=2000
PROJECTOR_POLL_INTERVAL_MS=15000
```

## Verification

After indexing runs, check:

```sql
select count(*) from market_events;
select * from projector_cursors;
```

Expected:

- `market_events` has rows when the replayed range contains supported Market events.
- `projector_cursors` has one cursor using `market:<chainId>:<marketAddressLowercase>`.
- Re-running the same range does not duplicate raw events.

Later snapshot/request slices should also verify:

```sql
select count(*) from market_snapshots;
select count(*) from deposit_requests;
```

API smoke after history/chart slices:

```bash
curl http://localhost:3000/markets
curl http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/history
curl "http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/charts?metric=tvl&range=30d"
```

Stop if the deployment block is unknown, the RPC provider rate-limits batches, or migrations report existing legacy projector rows that need reset/backfill.
