# Chain Projector

Indexes Market contract events into backend read models.

## Responsibility

- Poll confirmed Base Sepolia Market logs with viem.
- Decode supported Market events from the bundled ABI package.
- Store raw decoded events in `market_events` idempotently.
- Maintain `projector_cursors` for safe replay.
- Project snapshots, price updates, and async deposit request lifecycle rows.

## Dependencies

- `shared/blockchain` — viem client, configured Market address, bundled ABIs.
- `shared/database` — Drizzle persistence.

## Events indexed

See `docs/canonical/smartcontract-events.md` for event semantics.

Supported core events include YT deposits/withdrawals, price updates, halt events, carry fee events, and async base deposit request lifecycle events.

## Local replay setup

1. Set a Base Sepolia RPC URL.
2. Set `MARKET_ADDRESS=0x3aDa769dC813e3376fCD40d05bEA12263048A487`.
3. Set `CHAIN_ID=84532`.
4. Set `DEPLOYMENT_BLOCK` to the exact Market deployment block before real replay.
5. Run migrations.
6. Start once with `PROJECTOR_ENABLED=false` for normal API-only development.
7. Set `PROJECTOR_ENABLED=true` only when one app process should run background indexing.
8. Tune `PROJECTOR_CONFIRMATIONS`, `PROJECTOR_BATCH_SIZE`, and `PROJECTOR_POLL_INTERVAL_MS` for the RPC provider.
9. Verify `market_events` rows.
10. Verify `projector_cursors` row.
11. Verify `market_snapshots` rows after NAV-bearing events.
12. Verify `deposit_requests` rows after async request events.
13. Verify `/markets/:address/history`.
14. Verify chart metrics `tvl`, `tokenPrice`, and `ratio`.

Example:

```text
RPC_URL=<Base Sepolia RPC>
MARKET_ADDRESS=0x3aDa769dC813e3376fCD40d05bEA12263048A487
CHAIN_ID=84532
DEPLOYMENT_BLOCK=<exact-deployment-block>
PROJECTOR_ENABLED=true
PROJECTOR_CONFIRMATIONS=3
PROJECTOR_BATCH_SIZE=2000
PROJECTOR_POLL_INTERVAL_MS=15000
```

For API-only startup without real replay:

```text
DEPLOYMENT_BLOCK=0
PROJECTOR_ENABLED=false
```

## Verification

After indexing runs, check:

```sql
select count(*) from market_events;
select count(*) from market_snapshots;
select count(*) from price_updates;
select count(*) from deposit_requests;
select * from projector_cursors;
```

Expected:

- `projector_cursors` has one cursor using `market:<chainId>:<marketAddressLowercase>`.
- `market_events` has rows when the replayed range contains supported Market events.
- Re-running the same range does not duplicate raw or derived rows.
- `market_snapshots` has rows after NAV-bearing events.
- `price_updates` has rows after `PriceUpdated` events.
- `deposit_requests` has rows after async request lifecycle events.

API smoke:

```bash
curl http://localhost:3000/markets
curl http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/history
curl "http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/charts?metric=tvl&range=30d"
curl http://localhost:3000/deposit-requests/<request-id>
```

Expected:

- `/markets` still returns live market data.
- `/history` returns indexed snapshots or an empty indexed source.
- `tvl`, `tokenPrice`, and `ratio` charts use indexed snapshots.
- request detail returns indexed lifecycle data or 404 for unknown IDs.

## Stop conditions

Stop and investigate if:

- Exact `DEPLOYMENT_BLOCK` is unknown for real replay.
- RPC provider rate-limits batches.
- More than one app instance has `PROJECTOR_ENABLED=true`.
- Migrations report existing legacy projector rows that need reset/backfill.
- Cursor advances after a failed raw or derived projection write.
- Duplicate replay creates duplicate rows.
- API exposes legacy `jtStRatioAfter`/`jtStRatio` semantics instead of semantic `stJtRatioAfter`/`stJtRatio`.
- History timestamps use processing time instead of block timestamps.
