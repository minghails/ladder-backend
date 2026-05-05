# Runbook — Projector Local Replay

## When to use

Use this to replay Base Sepolia Market history into local PostgreSQL and smoke-test indexed APIs.

## Preconditions

- Base Sepolia RPC URL available.
- `MARKET_ADDRESS=0x3aDa769dC813e3376fCD40d05bEA12263048A487`.
- `CHAIN_ID=84532`.
- Exact `DEPLOYMENT_BLOCK` known for production-like replay.
- PostgreSQL running.
- Exactly one app process has `PROJECTOR_ENABLED=true`.

## Environment

```text
RPC_URL=<Base Sepolia RPC>
MARKET_ADDRESS=0x3aDa769dC813e3376fCD40d05bEA12263048A487
CHAIN_ID=84532
DEPLOYMENT_BLOCK=<actual deployment block>
PROJECTOR_ENABLED=true
PROJECTOR_CONFIRMATIONS=3
PROJECTOR_BATCH_SIZE=2000
PROJECTOR_POLL_INTERVAL_MS=15000
```

For API-only startup without deployment metadata:

```text
DEPLOYMENT_BLOCK=0
PROJECTOR_ENABLED=false
```

## Steps

1. Install dependencies if needed:

```bash
pnpm install
```

2. Start with projector disabled for normal API-only boot:

```bash
PROJECTOR_ENABLED=false pnpm dev
```

Expected: app starts without deployment block requirement.

3. Apply migrations:

```bash
pnpm db:migrate
```

Expected: migrations apply cleanly.

4. Enable projector in `.env` or process env with exact `DEPLOYMENT_BLOCK`.

5. Start app:

```bash
pnpm dev
```

Expected: logs include projector batch summary. Cursor updates when confirmed blocks are available.

6. Check DB:

```sql
select count(*) from market_events;
select count(*) from market_snapshots;
select count(*) from price_updates;
select count(*) from deposit_requests;
select * from projector_cursors;
```

Expected:

- `projector_cursors` has `market:84532:<marketAddressLowercase>`.
- `market_events` has rows if deployment emitted supported events in scanned range.
- `market_snapshots` has rows after NAV-bearing events.
- `price_updates` has rows after `PriceUpdated` events.
- `deposit_requests` has rows after async request lifecycle events.

7. Check APIs:

```bash
curl http://localhost:3000/markets
curl http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/history
curl "http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/charts?metric=tvl&range=30d"
curl http://localhost:3000/deposit-requests/<request-id>
```

Expected:

- `/markets` still returns live market data.
- `/history` returns indexed snapshots or empty list with `dataQuality.sources.history = indexed_events`.
- `tvl`, `tokenPrice`, and `ratio` charts use indexed snapshots when available.
- `/deposit-requests/:id` returns indexed lifecycle data or 404 for unknown IDs.

8. Replay same range or restart app.

Expected: duplicate raw events, snapshots, price updates, and request lifecycle rows are not created.

## Stop conditions

Stop and investigate if:

- Exact `DEPLOYMENT_BLOCK` is unknown for real replay.
- `pnpm db:migrate` reports existing legacy rows requiring reset/backfill.
- Cursor advances after a failed raw or derived write.
- Duplicate replay creates duplicate derived rows.
- API exposes legacy `jtStRatioAfter` or `jtStRatio` instead of semantic `stJtRatioAfter` or `stJtRatio`.
- History timestamps use processing time instead of block time.
- More than one app instance has `PROJECTOR_ENABLED=true`.
- RPC provider rate-limits batches repeatedly.

## Recovery

- Disable background loop with `PROJECTOR_ENABLED=false`.
- Lower `PROJECTOR_BATCH_SIZE` if RPC rate limits replay.
- Do not reset dev DB unless explicitly approved.
- If migration added unsafe `NOT NULL` columns to populated tables, stop and add backfill/default strategy.
