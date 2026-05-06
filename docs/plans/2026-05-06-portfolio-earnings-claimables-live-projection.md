# Portfolio Earnings And Claimables Live Projection Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real backend logic for portfolio earnings and claimables using current deployed contract ABI/events without requiring contract changes.

**Architecture:** Add backend-owned event-derived portfolio accounting: cashflows are indexed from existing Market events plus tranche ERC-4626 transfer/deposit events where Market events omit the share owner, cost basis is projected per wallet/market/tranche, earnings APIs read projected cost basis plus live positions, and claimables are derived from rejected/unrefunded async deposit requests. Keep REST response shapes stable and use `dataQuality` to mark full vs partial data when historical coverage is incomplete.

**Tech Stack:** NestJS, TypeScript, Drizzle, PostgreSQL, viem, Vitest.

---

## Scope

Implement live backend logic for:

1. `GET /portfolio/:address/earnings`
2. `GET /portfolio/:address/claimables`
3. `/portfolio/:address` overview financial aggregate fields that depend on earnings/claimables

Use only current contract/ABI surface:

- Market events: `DepositYT`, `WithdrawYT`, `DepositSettled`, `DepositRejected`, `DepositRefunded`, `DepositRequested`
- Tranche ERC-4626 events from ST/JT ABI: `Deposit`, `Withdraw`, `Transfer`
- Market request read fields already projected into `deposit_requests`
- Tranche ERC-4626 reads already present in ABI: `previewRedeem`, `previewWithdraw`, plus custom `convertSharesToBase(...)`
- Backend live portfolio positions from `ContractReaderService.getPortfolioPositions(...)`

## Non-goals

- No contract changes.
- No ABI changes.
- No user reward/airdrop/user-fee claimables unless a future contract source exists.
- No tax-reporting FIFO/LIFO UI; MVP uses average cost.
- No exact net APY unless a later time-weighted return model is approved.
- No backend signing or transaction submission.
- No mandatory calldata. Action hints stay hints.

## Current Contract/ABI Findings

### Earnings feasibility

Current contract/ABI surface is enough for event-derived PnL, with one important ownership caveat:

- `DepositYT(user, asSenior, assets, shares, depositValue, ...)` gives value and tranche side, but **does not include receiver/share owner**. Direct `depositYT(...)` mints to `user`, but `depositInstant(...)` can mint to a different `receiver` while still emitting `DepositYT(eventUser = msg.sender)`. Therefore instant deposits must correlate the Market `DepositYT` event with same-transaction tranche ERC-4626 `Deposit(sender, owner, assets, shares)` or transaction input; do not blindly assign all `DepositYT` cost basis to `user`.
- `WithdrawYT(user, receiver, fromSenior, byShares, sharesIn, assetsOut, withdrawValue, ...)` is enough for withdrawal cost-basis closing because `user` is the tranche share owner/caller whose shares are burned.
- `DepositSettled(requestId, receiver, asSenior, ytIn, sharesMinted, depositValue, ...)` is enough for async settled deposit cost basis because it includes `receiver`.

Current tranche ABI is enough for owner correlation and current value reads:

- ERC-4626 `Deposit(sender, owner, assets, shares)` event
- ERC-4626 `Withdraw(sender, receiver, owner, assets, shares)` event
- ERC-4626 `previewRedeem(shares)`
- ERC-4626 `previewWithdraw(assets)`
- custom `convertSharesToBase(shares)`

### Claimables feasibility

Current contract supports real async deposit refund claimables only:

- `DepositRejected(requestId, reasonCode)`
- `DepositRefunded(requestId, to, tokenIn, amountIn)`
- `refundDepositRequest(requestId, to)`

Refund is claimable only when:

- request status is rejected
- request is not refunded
- base funds were not pulled by adaptor (`basePulled = false`)
- caller is original request user

No current user reward/airdrop/user-fee claim source exists. Carry fee is protocol/operator fee via `accruedFeeYt`, `collectFees(...)`, and `feeRecipient`, not user claimable.

## File Map

### Create

- `backend/src/shared/database/schema/portfolio-cashflows.ts`
  - Event-level immutable portfolio cashflow ledger.
- `backend/src/shared/database/schema/portfolio-cost-basis.ts`
  - Aggregated average-cost state per wallet/market/tranche.
- `backend/src/modules/portfolio/portfolio-accounting.repository.ts`
  - Drizzle reads/writes for cashflows and cost basis.
- `backend/src/modules/portfolio/portfolio-accounting.service.ts`
  - Pure projection logic for deposits, withdrawals, average cost, realized/unrealized PnL.
- `backend/src/modules/portfolio/portfolio-accounting.service.spec.ts`
  - Unit tests for average-cost math and idempotency.
- `backend/src/modules/portfolio/portfolio-claimables.repository.ts`
  - Query rejected/unrefunded deposit requests and map claimable rows.
- `backend/src/modules/portfolio/portfolio-claimables.repository.spec.ts`
  - Claimable derivation tests.
- `backend/src/modules/portfolio/portfolio-earnings.repository.ts`
  - Read cost basis/cashflows for earnings endpoint.
- `backend/src/modules/portfolio/portfolio-earnings.repository.spec.ts`
  - Earnings query mapping tests.

### Modify

- `backend/src/shared/database/schema/index.ts`
  - Export new schema tables.
- `backend/src/shared/database/migrations/*`
  - Generated Drizzle migration for new tables/indexes.
- `backend/src/modules/portfolio/portfolio.module.ts`
  - Register new services/repositories.
- `backend/src/modules/portfolio/portfolio.service.ts`
  - Replace empty earnings/claimables behavior with live projections.
  - Keep `includeMock=true` sandbox behavior.
- `backend/src/modules/portfolio/portfolio.service.spec.ts`
  - Add endpoint-level tests for live earnings/claimables/overview.
- `backend/src/modules/chain-projector/*` or existing projector event handler files
  - Call portfolio accounting projection when relevant market events are indexed.
- `backend/src/modules/chain-projector/*.spec.ts`
  - Verify relevant events create/update portfolio accounting rows.
- `docs/canonical/api-contract.md`
  - Update portfolio endpoint semantics.
- `docs/canonical/backend-architecture.md`
  - Add portfolio accounting projection tables/responsibility.
- `backend/docs/architecture.md`
  - Update module dependency note only if new repository/service dependency changes current graph.
- `docs/canonical/integration-rules.md`
  - Add note: earnings and refund claimables are backend projections from current deployed events; rewards require future contract source.

## Data Model

### `portfolio_cashflows`

Immutable/event-idempotent ledger.

```ts
export const portfolioCashflows = pgTable(
  'portfolio_cashflows',
  {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id').notNull(),
    marketAddress: varchar('market_address', { length: 42 }).notNull().references(() => markets.address),
    walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
    tranche: varchar('tranche', { length: 16 }).notNull(),
    type: varchar('type', { length: 16 }).notNull(),
    sharesDelta: text('shares_delta').notNull(),
    assetsDelta: text('assets_delta').notNull(),
    valueDelta: text('value_delta').notNull(),
    txHash: varchar('tx_hash', { length: 66 }).notNull(),
    logIndex: text('log_index').notNull(),
    blockNumber: text('block_number').notNull(),
    blockTimestamp: timestamp('block_timestamp', { withTimezone: true }).notNull(),
    sourceEventName: varchar('source_event_name', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('portfolio_cashflows_chain_market_tx_log_unique').on(
      table.chainId,
      table.marketAddress,
      table.txHash,
      table.logIndex,
    ),
  ],
);
```

Conventions:

- deposits: `sharesDelta > 0`, `assetsDelta > 0`, `valueDelta > 0`
- withdrawals: `sharesDelta < 0`, `assetsDelta < 0`, `valueDelta < 0`
- `tranche`: `senior | junior`
- `type`: `deposit | withdraw`
- values are stringified integers; no decimals/floats.

### `portfolio_cost_basis`

Average-cost aggregate.

```ts
export const portfolioCostBasis = pgTable(
  'portfolio_cost_basis',
  {
    id: serial('id').primaryKey(),
    walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
    marketAddress: varchar('market_address', { length: 42 }).notNull().references(() => markets.address),
    tranche: varchar('tranche', { length: 16 }).notNull(),
    openShares: text('open_shares').notNull().default('0'),
    openCostBasis: text('open_cost_basis').notNull().default('0'),
    realizedPnl: text('realized_pnl').notNull().default('0'),
    depositedValue: text('deposited_value').notNull().default('0'),
    withdrawnValue: text('withdrawn_value').notNull().default('0'),
    lastProcessedBlock: text('last_processed_block').notNull().default('0'),
    dataQuality: varchar('data_quality', { length: 16 }).notNull().default('full'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('portfolio_cost_basis_wallet_market_tranche_unique').on(
      table.walletAddress,
      table.marketAddress,
      table.tranche,
    ),
  ],
);
```

`dataQuality` values:

- `full`: backend has complete event history from market deployment or configured start block before first user cashflow.
- `partial`: backend observed existing shares/balances without complete historical cashflows.

## Accounting Rules

### Deposit

```text
openShares += shares
openCostBasis += depositValue
realizedPnl unchanged
depositedValue += depositValue
```

### Withdrawal

Average-cost close:

```text
avgCostPerShare = openCostBasis / openShares
closedCostBasis = sharesIn * avgCostPerShare
realizedPnl += withdrawValue - closedCostBasis
openShares -= sharesIn
openCostBasis -= closedCostBasis
withdrawnValue += withdrawValue
```

Rounding:

- Use bigint integer division.
- If withdrawal closes all remaining shares, force `openShares = 0` and `openCostBasis = 0` to avoid dust.
- If withdrawal shares exceed openShares because history is partial, clamp close to available shares and mark row `partial`.

### Current unrealized PnL

```text
currentValue = live position value for wallet/market/tranche
unrealizedPnl = currentValue - openCostBasis
totalPnl = realizedPnl + unrealizedPnl
```

### Earnings endpoint row mapping

For each cost-basis row:

```text
lifetime = realizedPnl + unrealizedPnl
earning30d = current totalPnl - totalPnl snapshot 30d ago, or 0/unavailable if no snapshot
source = full ? indexed_events : partial_indexed_events
```

MVP may return `earning30d = '0'` with `earningsHistory` unavailable until snapshots are added. Do not fake 30d value.

## Chunk 1: Schema And Accounting Core

### Task 1: Add portfolio accounting schema

**Files:**
- Create: `backend/src/shared/database/schema/portfolio-cashflows.ts`
- Create: `backend/src/shared/database/schema/portfolio-cost-basis.ts`
- Modify: `backend/src/shared/database/schema/index.ts`
- Test: `backend/src/shared/database/schema/projector-schema.spec.ts`

- [ ] **Step 1: Write failing schema export test**

Add to `backend/src/shared/database/schema/projector-schema.spec.ts`:

```ts
import { portfolioCashflows, portfolioCostBasis } from './index';

it('exports portfolio accounting tables', () => {
  expect(portfolioCashflows).toBeDefined();
  expect(portfolioCostBasis).toBeDefined();
});
```

- [ ] **Step 2: Run test and verify RED**

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts
```

Expected: FAIL because exports do not exist.

- [ ] **Step 3: Add schema files**

Create files using definitions from **Data Model** section above.

- [ ] **Step 4: Export schema**

Add to `backend/src/shared/database/schema/index.ts`:

```ts
export { portfolioCashflows } from './portfolio-cashflows';
export { portfolioCostBasis } from './portfolio-cost-basis';
```

- [ ] **Step 5: Run test and verify GREEN**

```bash
pnpm test src/shared/database/schema/projector-schema.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Generate migration**

```bash
pnpm db:generate
```

Expected: new migration under `backend/src/shared/database/migrations/`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/shared/database/schema backend/src/shared/database/migrations
git commit -m "feat: add portfolio accounting schema"
```

### Task 2: Add pure average-cost accounting service

**Files:**
- Create: `backend/src/modules/portfolio/portfolio-accounting.service.ts`
- Test: `backend/src/modules/portfolio/portfolio-accounting.service.spec.ts`

- [ ] **Step 1: Write failing deposit/withdraw accounting tests**

```ts
import { describe, expect, it } from 'vitest';
import { applyDeposit, applyWithdrawal } from './portfolio-accounting.service';

describe('portfolio accounting math', () => {
  it('adds deposits to open shares and cost basis', () => {
    const state = applyDeposit(
      { openShares: '0', openCostBasis: '0', realizedPnl: '0', depositedValue: '0', withdrawnValue: '0', dataQuality: 'full' },
      { shares: '100', value: '1000' },
    );

    expect(state).toEqual({
      openShares: '100',
      openCostBasis: '1000',
      realizedPnl: '0',
      depositedValue: '1000',
      withdrawnValue: '0',
      dataQuality: 'full',
    });
  });

  it('realizes pnl using average cost on withdrawal', () => {
    const state = applyWithdrawal(
      { openShares: '100', openCostBasis: '1000', realizedPnl: '0', depositedValue: '1000', withdrawnValue: '0', dataQuality: 'full' },
      { shares: '40', value: '600' },
    );

    expect(state).toEqual({
      openShares: '60',
      openCostBasis: '600',
      realizedPnl: '200',
      depositedValue: '1000',
      withdrawnValue: '600',
      dataQuality: 'full',
    });
  });

  it('clears dust when withdrawal closes all shares', () => {
    const state = applyWithdrawal(
      { openShares: '3', openCostBasis: '10', realizedPnl: '0', depositedValue: '10', withdrawnValue: '0', dataQuality: 'full' },
      { shares: '3', value: '12' },
    );

    expect(state.openShares).toBe('0');
    expect(state.openCostBasis).toBe('0');
    expect(state.realizedPnl).toBe('2');
  });
});
```

- [ ] **Step 2: Run test and verify RED**

```bash
pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts
```

Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement pure functions**

```ts
export type CostBasisQuality = 'full' | 'partial';

export interface CostBasisState {
  openShares: string;
  openCostBasis: string;
  realizedPnl: string;
  depositedValue: string;
  withdrawnValue: string;
  dataQuality: CostBasisQuality;
}

export function applyDeposit(state: CostBasisState, deposit: { shares: string; value: string }): CostBasisState {
  return {
    ...state,
    openShares: (BigInt(state.openShares) + BigInt(deposit.shares)).toString(),
    openCostBasis: (BigInt(state.openCostBasis) + BigInt(deposit.value)).toString(),
    depositedValue: (BigInt(state.depositedValue) + BigInt(deposit.value)).toString(),
  };
}

export function applyWithdrawal(state: CostBasisState, withdrawal: { shares: string; value: string }): CostBasisState {
  const openShares = BigInt(state.openShares);
  const openCostBasis = BigInt(state.openCostBasis);
  const shares = BigInt(withdrawal.shares);
  const value = BigInt(withdrawal.value);

  if (openShares === 0n) {
    return {
      ...state,
      realizedPnl: (BigInt(state.realizedPnl) + value).toString(),
      withdrawnValue: (BigInt(state.withdrawnValue) + value).toString(),
      dataQuality: 'partial',
    };
  }

  const closesAll = shares >= openShares;
  const closedCostBasis = closesAll ? openCostBasis : (shares * openCostBasis) / openShares;
  const nextOpenShares = closesAll ? 0n : openShares - shares;
  const nextOpenCostBasis = closesAll ? 0n : openCostBasis - closedCostBasis;

  return {
    ...state,
    openShares: nextOpenShares.toString(),
    openCostBasis: nextOpenCostBasis.toString(),
    realizedPnl: (BigInt(state.realizedPnl) + value - closedCostBasis).toString(),
    withdrawnValue: (BigInt(state.withdrawnValue) + value).toString(),
    dataQuality: shares > openShares ? 'partial' : state.dataQuality,
  };
}
```

- [ ] **Step 4: Run test and verify GREEN**

```bash
pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/portfolio/portfolio-accounting.service.ts backend/src/modules/portfolio/portfolio-accounting.service.spec.ts
git commit -m "feat: add portfolio cost basis math"
```

## Chunk 2: Event Projection

### Task 3: Add accounting repository

**Files:**
- Create: `backend/src/modules/portfolio/portfolio-accounting.repository.ts`
- Test: `backend/src/modules/portfolio/portfolio-accounting.repository.spec.ts`

- [ ] **Step 1: Write failing repository test for idempotent cashflow insert**

Use fixture DB pattern from existing repository tests. Test should call repository with same event twice and expect one cashflow row/upsert result.

Required behavior:

```ts
await repository.recordDepositCashflow(event);
await repository.recordDepositCashflow(event);
expect(await repository.findCashflows(wallet, market)).toHaveLength(1);
```

- [ ] **Step 2: Run RED**

```bash
pnpm test src/modules/portfolio/portfolio-accounting.repository.spec.ts
```

Expected: FAIL because repository does not exist.

- [ ] **Step 3: Implement repository methods**

Required methods:

```ts
recordDepositCashflow(input: {
  chainId: number;
  marketAddress: string;
  walletAddress: string;
  tranche: 'senior' | 'junior';
  shares: string;
  assets: string;
  value: string;
  txHash: string;
  logIndex: string;
  blockNumber: string;
  blockTimestamp: Date;
  sourceEventName: 'DepositYT' | 'DepositSettled';
}): Promise<void>;

recordWithdrawalCashflow(input: {
  chainId: number;
  marketAddress: string;
  walletAddress: string;
  tranche: 'senior' | 'junior';
  shares: string;
  assets: string;
  value: string;
  txHash: string;
  logIndex: string;
  blockNumber: string;
  blockTimestamp: Date;
  sourceEventName: 'WithdrawYT';
}): Promise<void>;

upsertCostBasis(input: {
  walletAddress: string;
  marketAddress: string;
  tranche: 'senior' | 'junior';
  state: CostBasisState;
  lastProcessedBlock: string;
}): Promise<void>;

findCostBasisByWallet(walletAddress: string): Promise<CostBasisRow[]>;
findCashflowsByWallet(walletAddress: string): Promise<CashflowRow[]>;
```

Use `onConflictDoNothing` for cashflow unique key and `onConflictDoUpdate` for cost basis.

- [ ] **Step 4: Run GREEN**

```bash
pnpm test src/modules/portfolio/portfolio-accounting.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/portfolio/portfolio-accounting.repository.ts backend/src/modules/portfolio/portfolio-accounting.repository.spec.ts
git commit -m "feat: add portfolio accounting repository"
```

### Task 4: Project cashflows from Market and tranche events

**Files:**
- Modify: existing chain projector event handler under `backend/src/modules/chain-projector/`
- Modify/Create tests under `backend/src/modules/chain-projector/`
- Modify: `backend/src/modules/portfolio/portfolio.module.ts`

- [ ] **Step 1: Locate projector event handler and event coverage**

Read only relevant files:

```text
backend/src/modules/chain-projector/*
backend/src/modules/portfolio/portfolio.module.ts
backend/src/shared/blockchain/contracts/market.abi.ts
backend/src/shared/blockchain/contracts/st-tranche.abi.ts
backend/src/shared/blockchain/contracts/jt-tranche.abi.ts
```

Current check: `backend/src/modules/chain-projector/chain-projector.service.ts` is Market-only today. It calls `client.getLogs({ address: marketAddress, ... })` and decodes with `MARKET_ABI` only. Therefore this task must extend configured watched addresses to include `ST_TRANCHE_ADDRESS` and `JT_TRANCHE_ADDRESS` and decode ST/JT logs with tranche ABI for ERC-4626 `Deposit`/`Withdraw` events.

- [ ] **Step 2: Add failing tests for event mappings**

Test cases:

1. Direct `depositYT(...)`: Market `DepositYT.user` is share owner.

```ts
{
  walletAddress: args.user.toLowerCase(),
  tranche: args.asSenior ? 'senior' : 'junior',
  shares: args.shares.toString(),
  assets: args.assets.toString(),
  value: args.depositValue.toString(),
  sourceEventName: 'DepositYT'
}
```

2. Instant `depositInstant(...)` with receiver different from sender: must not assign cost basis to `DepositYT.user`. Correlate same-transaction tranche ERC-4626 `Deposit(sender, owner, assets, shares)` and assign to `owner`.

Expected mapped row:

```ts
{
  walletAddress: trancheDepositArgs.owner.toLowerCase(),
  tranche: trancheAddress === ST_TRANCHE_ADDRESS ? 'senior' : 'junior',
  shares: trancheDepositArgs.shares.toString(),
  assets: marketDepositYtArgs.assets.toString(),
  value: marketDepositYtArgs.depositValue.toString(),
  sourceEventName: 'DepositYT'
}
```

3. `DepositSettled` creates deposit cashflow using receiver from Market event:

```ts
{
  walletAddress: args.receiver.toLowerCase(),
  tranche: args.asSenior ? 'senior' : 'junior',
  shares: args.sharesMinted.toString(),
  assets: args.ytIn.toString(),
  value: args.depositValue.toString(),
  sourceEventName: 'DepositSettled'
}
```

4. `WithdrawYT` creates withdrawal cashflow using `user` as share owner:

```ts
{
  walletAddress: args.user.toLowerCase(),
  tranche: args.fromSenior ? 'senior' : 'junior',
  shares: args.sharesIn.toString(),
  assets: args.assetsOut.toString(),
  value: args.withdrawValue.toString(),
  sourceEventName: 'WithdrawYT'
}
```

- [ ] **Step 3: Run RED**

```bash
pnpm test src/modules/chain-projector
```

Expected: FAIL because projector does not call accounting repository and may not index tranche events.

- [ ] **Step 4: Implement event dispatch**

After relevant logs are indexed, call portfolio accounting for:

```ts
const marketPortfolioEvents = ['DepositYT', 'DepositSettled', 'WithdrawYT'];
const trancheOwnerEvents = ['Deposit'];
```

Do not project failed/reverted txs because no event exists.

Correlation rule for `DepositYT`:

- If same transaction has exactly one matching tranche `Deposit` log with same `assets` and `shares` after the Market `DepositYT` log, use `owner` from tranche log.
- Else if event came from direct `depositYT(...)` and no receiver override is possible, use `DepositYT.user`.
- If ownership cannot be determined safely, skip cashflow and record/log a `partial` coverage warning instead of assigning to wrong wallet.

- [ ] **Step 5: Update cost basis during projection**

For each recorded cashflow:

1. Load current cost basis row.
2. Apply `applyDeposit` or `applyWithdrawal`.
3. Upsert cost basis row.
4. Keep operation idempotent: if cashflow insert skipped due unique conflict, do not apply cost basis again.

- [ ] **Step 6: Run GREEN**

```bash
pnpm test src/modules/chain-projector
pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/chain-projector backend/src/modules/portfolio
git commit -m "feat: project portfolio cashflows from events"
```

## Chunk 3: Live Earnings Endpoint

### Task 5: Add earnings repository and map rows

**Files:**
- Create: `backend/src/modules/portfolio/portfolio-earnings.repository.ts`
- Test: `backend/src/modules/portfolio/portfolio-earnings.repository.spec.ts`

- [ ] **Step 1: Write failing test**

Test repository returns cost-basis rows for wallet and maps by wallet/market/tranche.

Expected fixture row:

```ts
{
  walletAddress: '0xabc...',
  marketAddress: LIVE_MARKET.address,
  tranche: 'senior',
  openShares: '100',
  openCostBasis: '1000',
  realizedPnl: '200',
  depositedValue: '1000',
  withdrawnValue: '600',
  dataQuality: 'full'
}
```

- [ ] **Step 2: Run RED**

```bash
pnpm test src/modules/portfolio/portfolio-earnings.repository.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement repository**

Methods:

```ts
findCostBasis(walletAddress: string): Promise<PortfolioCostBasisDto[]>;
findCashflowsSince(walletAddress: string, since: Date): Promise<PortfolioCashflowDto[]>;
```

- [ ] **Step 4: Run GREEN**

```bash
pnpm test src/modules/portfolio/portfolio-earnings.repository.spec.ts
```

Expected: PASS.

### Task 6: Wire `GET /portfolio/:address/earnings` to live cost basis

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Modify: `backend/src/modules/portfolio/portfolio.module.ts`
- Docs: `docs/canonical/api-contract.md`

- [ ] **Step 1: Add failing service test for live earnings row**

Add test:

```ts
it('returns live earnings from cost basis and live positions', async () => {
  const { service, earningsRepository } = await createService({
    positions: [
      {
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        assetType: 'senior',
        assetSymbol: 'st-mEDGE',
        tokenAddress: LIVE_MARKET.seniorTrancheAddress,
        shares: '100',
        assets: '100',
        value: '1300',
      },
    ],
    costBasisRows: [
      {
        walletAddress: '0xabcdef0000000000000000000000000000000001',
        marketAddress: LIVE_MARKET.address,
        tranche: 'senior',
        openShares: '100',
        openCostBasis: '1000',
        realizedPnl: '200',
        depositedValue: '1000',
        withdrawnValue: '600',
        dataQuality: 'full',
      },
    ],
  });

  const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001');

  expect(response.earnings).toEqual([
    expect.objectContaining({
      marketAddress: LIVE_MARKET.address,
      assetType: 'senior',
      lifetime: '500',
      earning30d: '0',
      source: 'indexed_events',
    }),
  ]);
  expect(response.dataQuality.sources.earnings).toBe('indexed_events');
});
```

Calculation:

```text
unrealized = currentValue 1300 - openCostBasis 1000 = 300
lifetime = realized 200 + unrealized 300 = 500
```

- [ ] **Step 2: Run RED**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: FAIL because endpoint still returns empty by default.

- [ ] **Step 3: Implement service mapping**

In `getEarnings(...)`:

1. If `includeMock=true`, keep existing mock behavior.
2. Else load:
   - live positions from `contractReader.getPortfolioPositions(normalizedAddress)`
   - cost-basis rows from `PortfolioEarningsRepository.findCostBasis(normalizedAddress)`
3. For each cost-basis row, find matching live position by market + tranche.
4. Compute:

```ts
const currentValue = BigInt(position?.value ?? '0');
const openCostBasis = BigInt(row.openCostBasis);
const realized = BigInt(row.realizedPnl);
const unrealized = currentValue - openCostBasis;
const lifetime = realized + unrealized;
```

5. Return `source = row.dataQuality === 'full' ? 'indexed_events' : 'partial_indexed_events'`. Add these source literals to type union.
6. Return history empty until snapshots are implemented:

```ts
history: { range, granularity, series: [] }
dataQuality.historyAvailable = false
```

- [ ] **Step 4: Run GREEN**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Update API docs**

Update `docs/canonical/api-contract.md` portfolio section:

```md
`GET /portfolio/:address/earnings` returns event-derived realized + unrealized PnL when portfolio cashflow history exists. `dataQuality.sources.earnings` is `indexed_events` for full history and `partial_indexed_events` when historical coverage is incomplete. History can remain empty with `historyAvailable = false` until earnings snapshots exist.
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/portfolio docs/canonical/api-contract.md
git commit -m "feat: serve live portfolio earnings"
```

### Task 7: Update overview earnings summary

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify: `backend/src/modules/portfolio/portfolio.service.spec.ts`

- [ ] **Step 1: Add failing overview test**

```ts
it('uses live earnings projection in portfolio overview summary', async () => {
  const { service } = await createService({
    positions: [
      {
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        assetType: 'senior',
        assetSymbol: 'st-mEDGE',
        tokenAddress: LIVE_MARKET.seniorTrancheAddress,
        shares: '100',
        assets: '100',
        value: '1300',
      },
    ],
    costBasisRows: [
      {
        walletAddress: '0xabcdef0000000000000000000000000000000001',
        marketAddress: LIVE_MARKET.address,
        tranche: 'senior',
        openShares: '100',
        openCostBasis: '1000',
        realizedPnl: '200',
        depositedValue: '1000',
        withdrawnValue: '600',
        dataQuality: 'full',
      },
    ],
  });

  const response = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

  expect(response.summary.currentEarning).toBe('500');
  expect(response.summary.currentEarningSource).toBe('indexed_events');
  expect(response.summary.earning30d).toBe('0');
  expect(response.summary.earning30dSource).toBe('unavailable');
  expect(response.summary.totalValueChange.source).toBe('indexed_events');
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: FAIL because overview still returns unavailable.

- [ ] **Step 3: Implement overview summary**

Reuse shared helper:

```ts
computePortfolioEarningsSummary(costBasisRows, livePositions)
```

Return:

```text
currentEarning = sum(totalPnl)
currentEarningSource = indexed_events if all full, partial_indexed_events if any partial, unavailable if no rows
earning30d = 0 until snapshots exist
```

- [ ] **Step 4: Run GREEN**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/portfolio
git commit -m "feat: show live portfolio earnings summary"
```

## Chunk 4: Live Claimables

### Task 8: Add claimables repository from deposit requests

**Files:**
- Create: `backend/src/modules/portfolio/portfolio-claimables.repository.ts`
- Test: `backend/src/modules/portfolio/portfolio-claimables.repository.spec.ts`

- [ ] **Step 1: Write failing tests**

Test cases:

1. rejected + not refunded + not base pulled => claimable enabled.
2. rejected + base pulled => row returned disabled with reason `REFUND_UNAVAILABLE_BASE_PULLED`, or omitted if product wants only actionable rows.
3. refunded => not returned.
4. settled/success => not returned.

Expected enabled row shape:

```ts
expect(row).toEqual({
  id: 'refund-42',
  walletAddress: '0xabcdef0000000000000000000000000000000001',
  marketAddress: LIVE_MARKET.address,
  marketSymbol: 'mEDGE',
  date: '2026-04-14T00:00:00.000Z',
  type: 'refund',
  amount: '99800',
  token: '0x00000000000000000000000000000000000000a0',
  action: {
    label: 'Refund',
    enabled: true,
    reason: null,
  },
  source: 'db',
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement repository**

Query `deposit_requests` rows where:

```text
receiver = wallet OR user = wallet
status = rejected
refunded_tx_hash IS NULL
```

Need distinguish `basePulled`. Current schema has `pulledTxHash`; use:

```text
basePulled = pulledTxHash IS NOT NULL
```

Enabled only when:

```text
row.user === wallet && row.pulledTxHash === null
```

Reason mapping:

- not original user: `REFUND_ONLY_REQUESTER`
- base pulled: `REFUND_UNAVAILABLE_BASE_PULLED`
- otherwise null

- [ ] **Step 4: Run GREEN**

```bash
pnpm test src/modules/portfolio/portfolio-claimables.repository.spec.ts
```

Expected: PASS.

### Task 9: Wire `GET /portfolio/:address/claimables`

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Modify: `backend/src/modules/portfolio/portfolio.module.ts`
- Docs: `docs/canonical/api-contract.md`

- [ ] **Step 1: Add failing service test**

```ts
it('returns rejected unrefunded deposit requests as live claimables', async () => {
  const { service } = await createService({
    claimables: [
      {
        id: 'refund-42',
        marketAddress: LIVE_MARKET.address,
        marketSymbol: 'mEDGE',
        date: '2026-04-14T00:00:00.000Z',
        type: 'refund',
        amount: '99800',
        token: LIVE_MARKET.baseTokenAddress,
        action: { label: 'Refund', enabled: true, reason: null },
        source: 'db',
      },
    ],
  });

  const response = await service.getClaimables('0xABCDEF0000000000000000000000000000000001');

  expect(response.items).toHaveLength(1);
  expect(response.items[0]?.type).toBe('refund');
  expect(response.items[0]?.source).toBe('db');
});
```

- [ ] **Step 2: Run RED**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: FAIL because claimables default empty.

- [ ] **Step 3: Implement service path**

In `getClaimables(...)`:

1. If `includeMock=true`, keep sandbox mock behavior.
2. Else call `PortfolioClaimablesRepository.findByWallet(normalizedAddress)`.
3. Paginate live rows.
4. Return same response shape.

- [ ] **Step 4: Update overview claimable preview**

In `getPortfolio(...)`:

1. Load live claimables from repository.
2. Use first `OVERVIEW_CLAIMABLE_LIMIT` rows.
3. `summary.claimable.amount = sum(enabled/live claimable amounts)` only for same token if all USDC/base token; otherwise keep amount `0` and source `unavailable` until multi-token summary is designed.
4. Recommended MVP: set `claimable.amount = sum all base token refund rows`, token `USDC`, source `db` when rows exist.

- [ ] **Step 5: Update API docs**

```md
`GET /portfolio/:address/claimables` returns real refund claimables from rejected, unrefunded async deposit requests. Rows are action-enabled only when the caller is the original requester and base funds were not pulled by the adaptor; otherwise rows can be disabled with a reason. User rewards/airdrops/user-fee claimables require future contract sources and are not returned.
```

- [ ] **Step 6: Run GREEN**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/portfolio docs/canonical/api-contract.md
git commit -m "feat: serve refund claimables"
```

## Chunk 5: Final Docs And Verification

### Task 10: Architecture and integration docs

**Files:**
- Modify: `docs/canonical/backend-architecture.md`
- Modify: `backend/docs/architecture.md` only if module dependency graph changes.
- Modify: `docs/canonical/integration-rules.md`
- Modify: `docs/canonical/api-contract.md`

- [ ] **Step 1: Update backend architecture data model**

Add:

```md
- `portfolio_cashflows`
- `portfolio_cost_basis`
```

Add responsibility note:

```md
Portfolio module projects event-derived cashflows and average-cost basis from Market events to serve realized/unrealized earnings. Claimables are limited to real rejected/unrefunded async deposit refunds unless future contract reward sources exist.
```

- [ ] **Step 2: Update integration rules**

Add:

```md
Earnings are backend projections from existing Market deposit/withdraw/settlement events and live tranche reads; they do not require contract changes. Reward/airdrop/user-fee claimables require explicit future contract event/function sources. Current live claimables are limited to deposit refund eligibility from rejected/unrefunded async requests.
```

- [ ] **Step 3: Run docs grep sanity check**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS. Docs do not have separate test.

### Task 11: Full verification

**Files:**
- Check all touched files.

- [ ] **Step 1: Run targeted tests**

```bash
pnpm test src/modules/portfolio/portfolio-accounting.service.spec.ts src/modules/portfolio/portfolio-accounting.repository.spec.ts src/modules/portfolio/portfolio-earnings.repository.spec.ts src/modules/portfolio/portfolio-claimables.repository.spec.ts src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run projector tests**

```bash
pnpm test src/modules/chain-projector
```

Expected: PASS.

- [ ] **Step 3: Run full backend tests**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Run lint**

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 5: Run build/typecheck**

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 6: API impact report**

Use:

```md
API impact for FE: API data-source/behavior change.
- `/portfolio/:address/earnings`: now returns event-derived realized/unrealized PnL when indexed history exists; can return `partial_indexed_events` when history coverage is incomplete.
- `/portfolio/:address/claimables`: now returns real refund claimables from rejected/unrefunded async deposit requests; no reward/airdrop/user-fee rows without future contract sources.
- `/portfolio/:address`: overview financial aggregates can use live earnings and refund claimables when projections exist.
FE action needed: review source labels, partial-history copy, refund disabled reasons, and empty states.
```

- [ ] **Step 7: Final commit**

```bash
git add backend/src docs/canonical backend/docs
git commit -m "feat: add live portfolio earnings and claimables"
```

## Open Decisions

1. `partial_indexed_events` source literal: add as new API source string or represent with `dataQuality.historyCoverage = 'partial'`.
2. Claimable disabled rows: return disabled rows with reason, or hide non-actionable rejected rows.
3. `earning30d`: keep unavailable until snapshots exist, or compute from cashflows over last 30d without historical valuation. Recommended: keep unavailable until snapshots.
4. Multi-token claimable summary: current refund token can be base token; if multiple tokens appear, avoid summing into USDC unless conversion exists.
5. Deposit ownership correlation: if projector cannot reliably classify direct `depositYT` vs instant `depositInstant`, require same-transaction tranche `Deposit.owner` correlation for every `DepositYT` before projecting cost basis; unmatched deposits become `partial` instead of guessed.

## Self-Review / Counter-Arguments

### Counter-argument 1: PnL from events can be wrong if history incomplete

Correct. This plan requires `dataQuality = partial` when indexer did not start before the wallet's first cashflow. Do not show `indexed_events` as full unless coverage is known.

### Counter-argument 2: `DepositYT.user` may not be the share owner

Correct. `depositInstant(...)` can mint shares to `receiver` but `DepositYT` only emits `eventUser = msg.sender`. The plan must correlate same-transaction tranche ERC-4626 `Deposit(owner, assets, shares)` before assigning instant-deposit cost basis. Direct `depositYT(...)` mints to `msg.sender`, so `DepositYT.user` is safe there. `Market.settleDepositRequest(...)` emits `DepositSettled(receiver, ...)` and does not call `_depositYtFromBalance`, so no duplicate `DepositYT` in that path.

### Counter-argument 3: Claimables should include carry fees

No. Current carry fee is protocol/operator fee to `feeRecipient`, not user claimable. Do not expose it as user claimable.

### Counter-argument 4: We should add `portfolio_claimables` table

Not for MVP. Deposit refund claimables can be derived from `deposit_requests`. Add a table only when future user rewards/airdrops need independent lifecycle.

### Counter-argument 5: APY should be computed now

No. PnL is not APY. Accurate APY needs time-weighted capital and historical valuation. Keep `netApy` unavailable unless a separate APY model is approved.

## Completion Format Required

Final implementation report must include:

- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
