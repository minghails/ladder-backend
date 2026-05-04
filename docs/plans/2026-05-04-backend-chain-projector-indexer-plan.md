# Backend Chain Projector / Indexer Implementation Plan

> **For agentic workers:** REQUIRED: Use `superpowers:subagent-driven-development` if subagents are available, or `superpowers:executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real, replayable Chain Projector for the existing Ladder backend that indexes Base Sepolia Market events into PostgreSQL, persists cursor state safely, derives market snapshots, and feeds real history/chart/request APIs.

**Architecture:** Keep the current NestJS modular monolith. Start with a small read-only projector inside the existing `chain-projector` module, reuse the current `ViemClientService`, ABI package, Drizzle DB module, and existing database tables. Add schema/config changes only where needed for idempotent indexing, cursor safety, and async request lifecycle tracking.

**Tech Stack:** NestJS, TypeScript, viem, Drizzle, PostgreSQL, Vitest.

---

## 0. Current Backend Reality

### Existing strengths

- NestJS module structure already matches MVP build order.
- `ContractReaderService` already reads live Market/Tranche/Adaptor state through `viem`.
- Base Sepolia ABI/address package already exists in `backend/src/shared/blockchain/contracts/`.
- Drizzle/PostgreSQL schema already contains MVP table names:
  - `markets`
  - `market_events`
  - `market_snapshots`
  - `projector_cursors`
  - `price_reports_raw`
  - `price_updates`
  - `deposit_requests`
  - `portfolio_positions`
  - `risk_alerts`
  - `operator_actions`
- Market APIs already return live/derived data.
- Portfolio overview already reads live tranche balances.
- Tests exist for config, market state, quotes, portfolio, Swagger, filters, pipes, and viem client.

### Existing gaps

- `ChainProjectorService` is only a skeleton.
- No event fetch/decode loop.
- No cursor advancement.
- No duplicate prevention for logs.
- No snapshot derivation from events.
- No async deposit request projection.
- No deployment block config.
- Charts/history are mock/config or missing.
- Admin/oracle/write orchestration is not implemented and should remain out of scope until projector works.

### Important source-alignment decisions

1. **Do not change architecture.** Stay inside current modules.
2. **Do not introduce Redis, workers, queues, Temporal, or microservices.** MVP is one NestJS app.
3. **Do not rebuild ABIs from `contracts_audit`.** Use existing operator/BaseScan-sourced ABI package.
4. **Keep current live reads working.** Projector adds historical/read-model data; it does not replace current `ContractReaderService` APIs immediately.
5. **Start small.** First milestone is event indexing + cursor only. Add snapshots and request lifecycle after that.
6. **No write/orchestration yet.** Do not implement signer flows, `updatePriceFromAdaptor`, manual `updatePrice`, fee collection, reject/refund, or operator tx submission in this plan.

---

## 1. Target Behavior

### Projector reads from chain

From configured Market contract:

- `DepositYT`
- `WithdrawYT`
- `PriceUpdated`
- `MarketHaltedEvent`
- `MarketHaltStatusUpdated`
- `CarryFeeAccrued`
- `CarryFeeCollected`
- `DepositRequested`
- `DepositBasePulled`
- `DepositRequestLinked`
- `DepositSettled`
- `DepositRejected`
- `DepositRefunded`

Parameter update events can be added later after core projection works.

### Projector writes to DB

- `market_events`: raw decoded events, idempotent by chain/market/tx/log.
- `projector_cursors`: last fully processed block.
- `market_snapshots`: NAV/price/ratio history from event args.
- `price_updates`: indexed price update facts.
- `deposit_requests`: async base deposit lifecycle.

### Projector guarantees

- Safe restart.
- No duplicate events on replay.
- Cursor advances only after DB writes succeed.
- Indexes only confirmed blocks.
- Preserves raw ABI args.
- Normalizes misleading `jtStRatioAfter` as semantic `stJtRatioAfter` in code/API.
- Can replay from deployment block.
- Can run as background loop only when explicitly enabled.

---

## 2. Required External Input

Before production-like indexing, obtain exact deployment block for:

```text
Market: 0x3aDa769dC813e3376fCD40d05bEA12263048A487
Network: Base Sepolia
Chain ID: 84532
```

Source options:

- `contracts_audit/deployments/base-sepolia.md`
- BaseScan contract creation transaction
- operator deployment notes

Without `DEPLOYMENT_BLOCK`, projector can work technically but may miss historical events or scan too much.

---

## 3. File Plan

### Modify existing files

- `backend/.env.example`
- `backend/src/shared/config/env.validation.ts`
- `backend/src/shared/config/env.validation.spec.ts`
- `backend/src/shared/config/app.config.ts`
- `backend/src/shared/blockchain/viem-client.service.ts`
- `backend/src/shared/blockchain/viem-client.service.spec.ts`
- `backend/src/shared/database/schema/market-events.ts`
- `backend/src/shared/database/schema/projector-cursors.ts`
- `backend/src/shared/database/schema/market-snapshots.ts`
- `backend/src/shared/database/schema/price-updates.ts`
- `backend/src/shared/database/schema/deposit-requests.ts`
- `backend/src/modules/chain-projector/chain-projector.service.ts`
- `backend/src/modules/chain-projector/chain-projector.module.ts`
- `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- `backend/src/modules/market-state/market-state.service.ts`
- `backend/src/modules/market-state/market-state.controller.ts`
- `backend/src/modules/market-state/dto/market-swagger.dto.ts`
- `backend/src/modules/market-state/market-state.service.spec.ts`
- `backend/src/modules/deposit-requests/deposit-requests.service.ts`
- `backend/src/modules/deposit-requests/deposit-requests.controller.ts`
- `backend/src/modules/deposit-requests/deposit-requests.service.spec.ts`
- `backend/src/modules/chain-projector/README.md`

### Create new files when logic grows

Start minimal, then split as complexity grows.

Create in Milestone 1:

- `backend/src/modules/chain-projector/projector.types.ts`
- `backend/src/modules/chain-projector/projector-events.ts`
- `backend/src/modules/chain-projector/projector-events.spec.ts`

Create in Milestone 2:

- `backend/src/modules/chain-projector/market-snapshot.projector.ts`
- `backend/src/modules/chain-projector/market-snapshot.projector.spec.ts`
- `backend/src/modules/chain-projector/price-update.projector.ts`
- `backend/src/modules/chain-projector/price-update.projector.spec.ts`

Create in Milestone 3:

- `backend/src/modules/chain-projector/deposit-request.projector.ts`
- `backend/src/modules/chain-projector/deposit-request.projector.spec.ts`

Optional later if `PortfolioService` becomes too large:

- `backend/src/modules/portfolio/portfolio-activity.repository.ts`
- `backend/src/modules/portfolio/portfolio-activity.repository.spec.ts`

---

## 4. Milestone 1 — Minimum Working Projector

**Goal:** Fetch Market logs, decode known events, persist idempotently, and advance cursor.

### Task 1: Add projector config

**Files:**

- Modify: `backend/src/shared/config/env.validation.ts`
- Modify: `backend/src/shared/config/env.validation.spec.ts`
- Modify: `backend/src/shared/config/app.config.ts`
- Modify: `backend/.env.example`
- Add failing test: env validation accepts projector config.

Test values:

```text
CHAIN_ID=84532
DEPLOYMENT_BLOCK=123456
PROJECTOR_ENABLED=false
PROJECTOR_CONFIRMATIONS=3
PROJECTOR_BATCH_SIZE=2000
PROJECTOR_POLL_INTERVAL_MS=15000
```

- Add failing test: negative `DEPLOYMENT_BLOCK` fails.
- Add failing test: invalid `PROJECTOR_ENABLED` fails.
- Implement env schema fields.

Recommended schema:

```ts
CHAIN_ID: z.coerce.number().int().positive().default(84532),
DEPLOYMENT_BLOCK: z.coerce.number().int().nonnegative().default(0),
PROJECTOR_ENABLED: z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true'),
PROJECTOR_CONFIRMATIONS: z.coerce.number().int().nonnegative().default(3),
PROJECTOR_BATCH_SIZE: z.coerce.number().int().positive().max(10_000).default(2_000),
PROJECTOR_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
```

- Add refinement: if `PROJECTOR_ENABLED=true`, `DEPLOYMENT_BLOCK` must be greater than `0`.
- Keep `DEPLOYMENT_BLOCK=0` valid when projector is disabled, so normal API-only dev/test startup does not require deployment metadata.
- Add `projectorConfig` in `app.config.ts`.

Return shape:

```ts
{
  chainId,
  deploymentBlock,
  enabled,
  confirmations,
  batchSize,
  pollIntervalMs,
}
```

- Update `.env.example`.

Example:

```text
CHAIN_ID=84532
DEPLOYMENT_BLOCK=0
PROJECTOR_ENABLED=false
PROJECTOR_CONFIRMATIONS=3
PROJECTOR_BATCH_SIZE=2000
PROJECTOR_POLL_INTERVAL_MS=15000
```

- Run targeted test.

```bash
pnpm test src/shared/config/env.validation.spec.ts
```

Expected: pass.

### Task 2: Make `market_events` idempotent

**Files:**

- Modify: `backend/src/shared/database/schema/market-events.ts`
- Generate: Drizzle migration
- Add columns:

```text
chain_id integer not null
block_hash varchar(66) not null
block_timestamp timestamp with time zone not null
```

- Add unique constraint:

```text
unique(chain_id, market_address, tx_hash, log_index)
```

- Keep existing columns unless migration requires otherwise.
- Use safe migration strategy if any table may contain rows:

```text
1. add new columns nullable
2. backfill existing rows or reset dev DB with explicit approval
3. alter columns to NOT NULL after backfill
```

Do not add `NOT NULL` columns without a backfill/default strategy if old rows may exist.

- Generate migration.

```bash
pnpm db:generate
```

- Inspect migration manually.
- Ensure old data handling is safe for current dev DB.

### Task 3: Improve `projector_cursors`

**Files:**

- Modify: `backend/src/shared/database/schema/projector-cursors.ts`
- Generate: same migration as Task 2 if possible
- Add columns:

```text
chain_id integer not null
market_address varchar(42) not null
last_block_hash varchar(66) nullable
```

- Cursor ID format:

```text
market:<chainId>:<marketAddressLowercase>
```

- Keep `last_block_number` and `last_log_index` as text to match current schema style.

### Task 4: Bootstrap configured market row

**Files:**

- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.spec.ts`

Because `market_events`, `market_snapshots`, `price_updates`, and `deposit_requests` reference `markets.address`, projector must ensure the configured market exists before inserting projected rows.

- Write failing test: `runOnce()` upserts the configured market before inserting events.
- Write failing test: market bootstrap uses live contract state from `ContractReaderService.getMarketState()`.
- Implement bootstrap step:

```text
1. read live market state
2. upsert markets row by address
3. set name from live symbol or address fallback
4. set yt/base/ST/JT addresses
5. set halted flag
6. update updated_at
```

- Call bootstrap before first event insert in `runOnce()`.
- Keep this idempotent; repeated runs update same market row.

### Task 5: Add projector types

**Files:**

- Create: `backend/src/modules/chain-projector/projector.types.ts`
- Add event name union:

```ts
export type ProjectedEventName =
  | 'DepositYT'
  | 'WithdrawYT'
  | 'PriceUpdated'
  | 'MarketHaltedEvent'
  | 'MarketHaltStatusUpdated'
  | 'CarryFeeAccrued'
  | 'CarryFeeCollected'
  | 'DepositRequested'
  | 'DepositBasePulled'
  | 'DepositRequestLinked'
  | 'DepositSettled'
  | 'DepositRejected'
  | 'DepositRefunded';
```

- Add range type:

```ts
export interface ProjectorRange {
  fromBlock: bigint;
  toBlock: bigint;
}
```

- Add decoded event type:

```ts
export interface DecodedMarketEvent {
  chainId: number;
  marketAddress: string;
  eventName: ProjectedEventName;
  blockNumber: bigint;
  blockHash: string;
  blockTimestamp: bigint;
  txHash: string;
  logIndex: number;
  args: Record<string, string | boolean | number | null>;
}
```

`blockTimestamp` must come from `client.getBlock({ blockNumber })`, because log objects do not include reliable timestamps. Snapshots/history must use block time, not processing time.

### Task 5: Add event normalizer

**Files:**

- Create: `backend/src/modules/chain-projector/projector-events.ts`
- Create: `backend/src/modules/chain-projector/projector-events.spec.ts`
- Write failing test: `bigint` args convert to strings.
- Write failing test: `jtStRatioAfter` also creates `stJtRatioAfter`.
- Write failing test: unknown/unsupported arg values are rejected or stringified predictably.
- Implement `normalizeEventArgs`.

Expected behavior:

```json
{
  "jtStRatioAfter": "1500000000000000000",
  "stJtRatioAfter": "1500000000000000000"
}
```

- Export supported event names.
- Run:

```bash
pnpm test src/modules/chain-projector/projector-events.spec.ts
```

Expected: pass.

### Task 6: Extend `ViemClientService`

**Files:**

- Modify: `backend/src/shared/blockchain/viem-client.service.ts`
- Modify: `backend/src/shared/blockchain/viem-client.service.spec.ts`
- Add `chainId` from config.
- Add method:

```ts
getChainId(): number
```

- Keep existing methods unchanged:

```ts
getPublicClient(): PublicClient
getMarketAddress(): Address
```

- Do not hide public client from projector; current source already exposes it.
- Update tests.

### Task 7: Implement `ChainProjectorService.runOnce()` core

**Files:**

- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- Write failing test: no cursor starts from `DEPLOYMENT_BLOCK`.
- Write failing test: current head minus confirmations below deployment block returns no-op.
- Write failing test: batch size caps `toBlock`.
- Write failing test: duplicate DB insert does not throw.
- Write failing test: cursor only updates after event insert succeeds.

Algorithm:

```text
1. Read current head block.
2. safeToBlock = head - confirmations.
3. Read cursor by market:<chainId>:<marketAddress>.
4. fromBlock = cursor.lastBlockNumber + 1 or deploymentBlock.
5. If fromBlock > safeToBlock, return no-op summary.
6. toBlock = min(fromBlock + batchSize - 1, safeToBlock).
7. Bootstrap/upsert configured market row.
8. Fetch logs for Market address.
9. Fetch unique block timestamps for returned logs using `getBlock`.
10. Decode supported events with existing `MARKET_ABI`.
11. Attach `blockTimestamp` to decoded events.
12. Normalize args.
13. Insert decoded events into `market_events` idempotently.
14. Update cursor to `toBlock`.
15. Return summary.
```

Return shape:

```ts
{
  fromBlock: string;
  toBlock: string;
  logsFetched: number;
  eventsDecoded: number;
  eventsInserted: number;
  eventsSkipped: number;
  cursorUpdated: boolean;
}
```

- Use Drizzle injected through `DRIZZLE_DB`, same as existing `PortfolioService` pattern.
- Use `onConflictDoNothing` for duplicate event rows.
- Ignore unknown logs.
- Require `blockHash`, `transactionHash`, and `logIndex`; skip incomplete logs with logger warning.

### Task 8: Add optional background loop

**Files:**

- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Implement `OnApplicationBootstrap` only when `PROJECTOR_ENABLED=true`.
- Add `isRunning` guard to prevent overlapping runs.
- Run one immediate `runOnce()` on bootstrap.
- Schedule interval using `PROJECTOR_POLL_INTERVAL_MS`.
- Log batch summary.
- Ensure tests do not start loop by default.

---

## 5. Milestone 2 — Market Snapshots and History APIs

**Goal:** Use indexed events to create real market snapshots and serve history/charts from DB.

### Task 9: Add/adjust snapshot schema

**Files:**

- Modify: `backend/src/shared/database/schema/market-snapshots.ts`
- Generate: Drizzle migration

Source currently has legacy `jt_st_ratio` and non-null `yt_price`.

Source-aligned rule:

- Keep DB column `yt_price` non-null for now.
- Carry forward latest known price for non-price events.
- Keep legacy DB column if migration risk is high, but TypeScript/API must expose semantic `stJtRatio`.

Recommended additions:

```text
chain_id integer not null
block_hash varchar(66) not null
source_tx_hash varchar(66) not null
source_log_index text not null
unique(chain_id, market_address, source_tx_hash, source_log_index)
```

The source identity prevents duplicate snapshots when projector replays the same event range.

Recommended semantic column if migration accepted:

```text
st_jt_ratio text not null
```

If keeping legacy column:

```text
jt_st_ratio text not null -- legacy storage only; code maps to stJtRatio
```

### Task 10: Create snapshot projector

**Files:**

- Create: `backend/src/modules/chain-projector/market-snapshot.projector.ts`
- Create: `backend/src/modules/chain-projector/market-snapshot.projector.spec.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.module.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Write failing test: `PriceUpdated` creates snapshot with `ytPrice = newPrice`.
- Write failing test: `DepositYT` creates snapshot from `navAfter`, `navStAfter`, `navJtAfter`, `stJtRatioAfter`.
- Write failing test: `WithdrawYT` creates snapshot.
- Write failing test: `DepositSettled` creates snapshot.
- Write failing test: non-price event carries forward latest snapshot price from the latest snapshot at or before the current event block/log.
- Write failing test: replaying an older range does not carry forward a future price.
- Write failing test: no known previous price uses live `latestYtPrice` fallback with explicit source risk in code comments/log, not API.

Snapshot source events:

- `PriceUpdated`
- `DepositYT`
- `WithdrawYT`
- `DepositSettled`

Do not create snapshots from events lacking NAV fields unless later design adds state reconciliation.

### Task 11: Create price update projector

**Files:**

- Create: `backend/src/modules/chain-projector/price-update.projector.ts`
- Create: `backend/src/modules/chain-projector/price-update.projector.spec.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Write failing test: `PriceUpdated` inserts row in `price_updates`.
- Write failing test: `stJtRatioAfter` is used semantically.
- Write failing test: duplicate price update does not duplicate if unique constraint is added.

Fields:

```text
market_address
new_price
oracle_timestamp
nav_after
nav_st_after
nav_jt_after
st_jt_ratio_after or legacy mapped field
halted
tx_hash
log_index
block_number
block_hash
```

Add unique constraint if schema is changed:

```text
unique(market_address, tx_hash, log_index)
```

This prevents duplicate price update rows when replaying batches.

### Task 12: Add `/markets/:address/history`

**Files:**

- Modify: `backend/src/modules/market-state/market-state.controller.ts`
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Modify: `backend/src/modules/market-state/dto/market-swagger.dto.ts`
- Modify: `backend/src/modules/market-state/market-state.service.spec.ts`
- Write failing test: history returns paginated indexed snapshots.
- Write failing test: invalid market address throws `NotFoundException`, matching current pattern.
- Implement endpoint:

```text
GET /markets/:address/history?limit=100&cursor=0
```

Response shape:

```json
{
  "market": "0x...",
  "items": [
    {
      "blockNumber": "123",
      "timestamp": "2026-05-04T00:00:00.000Z",
      "nav": "1000000000000000000",
      "navSt": "600000000000000000",
      "navJt": "400000000000000000",
      "stJtRatio": "1500000000000000000",
      "ytPrice": "1000000000000000000",
      "halted": false
    }
  ],
  "page": {
    "limit": 100,
    "nextCursor": null,
    "hasMore": false
  },
  "dataQuality": {
    "sources": {
      "history": "indexed_events"
    }
  }
}
```

### Task 13: Replace chart mock for indexed metrics

**Files:**

- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Modify: `backend/src/modules/market-state/market-state.service.spec.ts`

Use snapshots for:

- `tvl` → `nav`
- `tokenPrice` → `ytPrice`
- `ratio` → `stJtRatio`

Keep current mock/config for:

- `yield`
- `utilization`

If no snapshots exist:

- return empty series for indexed metrics
- source = `indexed_events`
- do not silently return mock unless API later adds `includeMock=true`

---

## 6. Milestone 3 — Async Deposit Request Lifecycle

**Goal:** Project async base deposit events into `deposit_requests` and expose real request status.

### Task 14: Extend deposit request schema

**Files:**

- Modify: `backend/src/shared/database/schema/deposit-requests.ts`
- Generate: Drizzle migration

Minimum required:

```text
adaptor_request_id text nullable
```

Recommended lifecycle fields:

```text
pulled_tx_hash varchar(66) nullable
linked_tx_hash varchar(66) nullable
settled_tx_hash varchar(66) nullable
rejected_tx_hash varchar(66) nullable
refunded_tx_hash varchar(66) nullable
settled_at timestamp nullable
rejected_at timestamp nullable
refunded_at timestamp nullable
```

Optional value fields if FE/API needs final settlement details soon:

```text
yt_in text nullable
shares_minted text nullable
deposit_value text nullable
```

### Task 15: Create deposit request projector

**Files:**

- Create: `backend/src/modules/chain-projector/deposit-request.projector.ts`
- Create: `backend/src/modules/chain-projector/deposit-request.projector.spec.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Modify: `backend/src/modules/chain-projector/chain-projector.module.ts`
- Write failing test: `DepositRequested` inserts request row.
- Write failing test: `DepositBasePulled` updates status to `pulled`.
- Write failing test: `DepositRequestLinked` stores `adaptorRequestId` and status `linked`.
- Write failing test: `DepositSettled` updates status `settled` and settlement values if columns exist.
- Write failing test: `DepositRejected` stores `reasonCode` and status `rejected`.
- Write failing test: `DepositRefunded` updates status `refunded`.
- Write failing test: out-of-order update for missing row does not crash; logs warning and continues.

Event mapping:

#### `DepositRequested`

Insert/upsert:

```text
requestId
marketAddress
user
receiver
asSenior
tokenIn
amountIn
minYtOut
status = requested
txHash
```

#### `DepositBasePulled`

Update:

```text
status = pulled
pulledTxHash
```

#### `DepositRequestLinked`

Update:

```text
status = linked
adaptorRequestId
linkedTxHash
```

#### `DepositSettled`

Update:

```text
status = settled
settledTxHash
settledAt
```

Optional:

```text
ytIn
sharesMinted
depositValue
```

#### `DepositRejected`

Update:

```text
status = rejected
reasonCode
rejectedTxHash
rejectedAt
```

#### `DepositRefunded`

Update:

```text
status = refunded
refundedTxHash
refundedAt
```

### Task 16: Implement deposit request endpoints

**Files:**

- Modify: `backend/src/modules/deposit-requests/deposit-requests.service.ts`
- Modify: `backend/src/modules/deposit-requests/deposit-requests.controller.ts`
- Modify: `backend/src/modules/deposit-requests/deposit-requests.service.spec.ts`

Add:

```text
GET /deposit-requests/:id
```

Optional if needed:

```text
POST /deposit-requests
```

But because source of truth is chain events, prefer only `GET` first unless frontend needs backend-side registration.

Response should include:

```json
{
  "requestId": "12",
  "marketAddress": "0x...",
  "user": "0x...",
  "receiver": "0x...",
  "asSenior": false,
  "tokenIn": "0x...",
  "amountIn": "1000000",
  "minYtOut": "0",
  "status": "linked",
  "adaptorRequestId": "77",
  "txHash": "0x...",
  "dataQuality": {
    "sources": {
      "request": "indexed_events"
    }
  }
}
```

### Task 17: Keep portfolio requests real

**Files:**

- Modify only if needed: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify tests only if behavior changes.

Current `PortfolioService` already reads `deposit_requests` by `user` or `receiver`.

After projector writes rows, `/portfolio/:address/requests` becomes real automatically.

Only update mapping to include `adaptorRequestId` if DTO/API needs it.

---

## 7. Milestone 4 — Optional Portfolio Activities

**Goal:** Replace mock activity rows using indexed `market_events`.

Do this only after Milestones 1–3 are stable.

### Task 18: Derive activities from market events

**Files:**

- Prefer create: `backend/src/modules/portfolio/portfolio-activity.repository.ts`
- Prefer create: `backend/src/modules/portfolio/portfolio-activity.repository.spec.ts`
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify: `backend/src/modules/portfolio/portfolio.service.spec.ts`

Reason: `PortfolioService` is already large. Avoid adding much query/mapping logic directly inside it.

Activity mapping:

- `DepositYT(asSenior=true)` → `buy_senior_token`
- `DepositYT(asSenior=false)` → `buy_junior_token`
- `WithdrawYT(fromSenior=true)` → `sell_senior_token`
- `WithdrawYT(fromSenior=false)` → `sell_junior_token`
- `DepositRequested` → pending buy
- `DepositSettled` → successful buy

MVP can query JSONB args. Later add dedicated `portfolio_activities` projection table if performance requires it.

---

## 8. Milestone 5 — Runbook and Verification

### Task 19: Update Chain Projector README

**Files:**

- Modify: `backend/src/modules/chain-projector/README.md`

Include:

```text
1. Set Base Sepolia RPC.
2. Set MARKET_ADDRESS.
3. Set CHAIN_ID=84532.
4. Set DEPLOYMENT_BLOCK to Market deployment block.
5. Run migrations.
6. Start with PROJECTOR_ENABLED=false for normal API-only dev.
7. Set PROJECTOR_ENABLED=true to run background indexing.
8. Verify market_events rows.
9. Verify projector_cursors row.
10. Verify market_snapshots rows after NAV events.
11. Verify /markets/:address/history.
12. Verify chart metrics tvl/tokenPrice/ratio.
```

### Task 20: Evaluate canonical docs update

Canonical docs already say Chain Projector is MVP build priority. If this implementation changes API response shape or behavior, update:

- `docs/canonical/api-contract.md`
- `docs/canonical/backend-architecture.md`

Likely doc changes needed when adding:

- `GET /markets/:address/history` concrete response semantics
- real chart source behavior
- `GET /deposit-requests/:id` concrete behavior if currently underspecified

---

## 9. Test Plan

### Unit tests

Run all backend tests:

```bash
pnpm test
```

Expected: pass.

### Targeted projector tests

```bash
pnpm test src/modules/chain-projector
```

Expected: projector event normalization, cursor, decoding, insertion, snapshots, and request lifecycle tests pass.

### Targeted market-state tests

```bash
pnpm test src/modules/market-state
```

Expected: current live market tests still pass; history/chart tests pass.

### DB migration smoke

```bash
pnpm db:migrate
```

Expected: migrations apply cleanly.

### Local dev smoke

With `.env`:

```text
RPC_URL=<Base Sepolia RPC>
MARKET_ADDRESS=0x3aDa769dC813e3376fCD40d05bEA12263048A487
CHAIN_ID=84532
DEPLOYMENT_BLOCK=<actual deployment block>
PROJECTOR_ENABLED=true
PROJECTOR_CONFIRMATIONS=3
```

Run:

```bash
pnpm dev
```

Expected logs:

```text
projector batch completed
cursorUpdated true
```

Check database:

```sql
select count(*) from market_events;
select count(*) from market_snapshots;
select * from projector_cursors;
```

Expected:

- `market_events` count > 0 if contract has emitted events.
- `projector_cursors` has market cursor.
- `market_snapshots` has rows after NAV-bearing events.

### API smoke

```bash
curl http://localhost:3000/markets
curl http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/history
curl "http://localhost:3000/markets/0x3aDa769dC813e3376fCD40d05bEA12263048A487/charts?metric=tvl&range=30d"
```

Expected:

- `/markets` still returns live market data.
- `/history` returns indexed snapshots or empty list with indexed source.
- `tvl` chart uses indexed snapshots when available.

---

## 10. Commit Order

Only commit when user explicitly asks.

Recommended atomic commits:

```text
feat(projector): add projector configuration
feat(db): add idempotent projector schema
feat(projector): decode and persist market events
feat(projector): project market snapshots
feat(projector): track deposit request lifecycle
feat(markets): serve indexed market history
feat(portfolio): derive activities from indexed events
```

---

## 11. Definition of Done

Projector/indexer is working when:

- App starts with `PROJECTOR_ENABLED=false`.
- App starts with `PROJECTOR_ENABLED=true`.
- `runOnce()` indexes from `DEPLOYMENT_BLOCK`.
- Restart does not duplicate events.
- Cursor advances correctly.
- Cursor does not advance when DB write/projection fails.
- `market_events` stores raw decoded args.
- `market_snapshots` stores NAV snapshots from events.
- `deposit_requests` lifecycle updates from events.
- `/markets/:address/history` returns indexed data.
- Chart metrics `tvl`, `tokenPrice`, and `ratio` use indexed snapshots.
- Existing live market/portfolio APIs continue working.
- Tests pass.
- Migrations apply cleanly.

---

## 12. Explicit Non-Goals

Do not implement in this plan:

- signer management
- raw private key handling
- admin tx submission
- `updatePriceFromAdaptor()` orchestration
- manual `updatePrice(...)` orchestration
- fee collection orchestration
- reject/refund write orchestration
- Redis/BullMQ/Temporal
- separate worker service
- TimescaleDB
- portfolio cost-basis/earnings calculations
- production risk automation

Reason: projector/indexer must be reliable before backend writes protocol-affecting transactions.

---

## 13. Remaining Risks

- Exact `DEPLOYMENT_BLOCK` is required before real indexing.
- Existing DB column names contain legacy `jt_st_ratio`; code/API must use semantic `stJtRatio`.
- `market_snapshots.yt_price` is currently non-null; non-price events need carry-forward price.
- Base Sepolia RPC rate limits may require smaller batch size.
- Multiple app instances with projector enabled could race. MVP assumes exactly one enabled projector instance. In multi-replica deploys, only one replica may set `PROJECTOR_ENABLED=true`.
- Reorg handling is confirmation-based only in MVP; deeper rollback can be added later.
- Derived tables must be idempotent too. `market_events` uniqueness alone is not enough if snapshots/price rows are projected again during replay.
- History timestamps must use block timestamps from `getBlock`, not processing time.

