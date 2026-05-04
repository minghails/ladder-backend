# Runbook — Projector Local Replay

## When to use

Use after Epic 1 has implemented `runOnce()` and background loop behavior.

## Preconditions

- Base Sepolia RPC URL available.
- `MARKET_ADDRESS=0x3aDa769dC813e3376fCD40d05bEA12263048A487`.
- `CHAIN_ID=84532`.
- Exact `DEPLOYMENT_BLOCK` known for production-like replay.
- PostgreSQL running and migrations applied.
- Exactly one local app process has `PROJECTOR_ENABLED=true`.

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

## Steps

1. Start with projector disabled for normal API-only boot:

```bash
PROJECTOR_ENABLED=false pnpm dev
```

Expected: app starts without deployment block requirement.

2. Apply migrations:

```bash
pnpm db:migrate
```

Expected: migrations apply cleanly.

3. Enable projector in `.env` or process env.

4. Start app:

```bash
pnpm dev
```

Expected logs include projector batch summary and cursor update when blocks are available.

5. Check DB:

```sql
select count(*) from market_events;
select count(*) from market_snapshots;
select * from projector_cursors;
```

Expected:

- `projector_cursors` has `market:84532:<marketAddressLowercase>`.
- `market_events` has rows if deployment emitted supported events in scanned range.
- `market_snapshots` has rows after NAV-bearing events.

6. Check APIs:

```bash
curl http://localhost:3000/markets
curl http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/history
curl "http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/charts?metric=tvl&range=30d"
```

Expected:

- `/markets` still returns live market data.
- `/history` returns indexed snapshots or empty list with indexed source.
- `tvl` chart uses indexed snapshots when available.

## Stop conditions

- Cursor advances after failed raw/derived write.
- Duplicate replay creates duplicate derived rows.
- `jtStRatioAfter` appears as frontend/API semantic ratio without `stJtRatio` mapping.
- History timestamps use processing time instead of block time.
- More than one app instance has `PROJECTOR_ENABLED=true`.

## Rollback / recovery

- Disable background loop with `PROJECTOR_ENABLED=false`.
- Do not reset dev DB unless explicitly approved.
- If migration added unsafe `NOT NULL` columns to populated tables, stop and add backfill/default strategy.
