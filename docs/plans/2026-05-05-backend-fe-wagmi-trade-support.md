# Backend FE Wagmi Trade Support Plan

> **Status:** Draft plan, not active until explicitly activated.  
> **For agentic workers:** Use the backend handoff flow in `backend/docs/HANDOFF.md`. When activated, create `backend/docs/initiatives/backend-fe-wagmi-trade-support/` and execute one bounded slice at a time.

**Goal:** Provide the backend preflight, constraints, and indexed post-transaction read model needed for the frontend to execute Ladder buy/sell transactions directly with wagmi and the deployed ABI.

**Architecture:** Keep transaction submission fully on the frontend. Backend must not hold keys, sign transactions, or generate mandatory calldata. Backend supplies live contract-derived trade constraints, quote/preflight responses, approval hints, and indexed transaction status after the Chain Projector observes emitted events.

**Tech stack:** NestJS, TypeScript, viem read calls, Drizzle/PostgreSQL, Vitest.

---

## 1. Contract facts verified

Source: `contracts_audit/src/Market.sol` local reference snapshot. Deployed ABI remains execution truth per canonical docs.

### User-facing buy/sell functions

- Direct YT buy into ST/JT:
  - `depositYT(bool asSenior, uint256 amount)`
  - Contract reference: `contracts_audit/src/Market.sol:476`
- Backward-compatible direct YT buy:
  - `deposit(bool asSenior, bool isDirectYT, uint256 amount)` with `isDirectYT=true`
  - Contract reference: `contracts_audit/src/Market.sol:467`
- Base-token instant buy into ST/JT:
  - `depositInstant(bool asSenior, address tokenIn, uint256 amountIn, uint256 minYtOut, address receiver, bytes32 referrerId)`
  - Contract reference: `contracts_audit/src/Market.sol:489`
- Base-token async buy request:
  - `depositRequest(bool asSenior, address tokenIn, uint256 amountIn, uint256 minYtOut, address receiver, bytes32 referrerId, bytes extraData)`
  - Contract reference: `contracts_audit/src/Market.sol:590`
- Sell/redeem ST/JT shares to YT:
  - `withdraw(bool fromSenior, bool byShares, uint256 amount, address receiver)`
  - Contract reference: `contracts_audit/src/Market.sol:773`

### Important constraints

- Direct/base deposit reverts when market is halted.
- Direct/base senior deposit can revert with `StJtRatioTooHigh` if ST/JT ratio exceeds `maxStJtRatio` after the deposit.
- Direct YT deposit and withdraw use `latestYtPrice` as-is; they do not trigger price update.
- Async base request settlement calls `updatePriceFromAdaptor()` first before minting tranche shares.
- Market-level base-token withdrawal/sell is not implemented in current MVP.
- For `withdraw(...)`, user must approve the Market to spend ST/JT shares before calling withdraw. Contract comment at `contracts_audit/src/Market.sol:810` confirms this.

---

## 2. Current backend state reviewed

### Already present

- `GET /markets/:address/trade-constraints` exists.
- `POST /quotes/deposit-base` exists but output is placeholder/action hints only.
- `POST /quotes/withdraw-yt` exists but currently models action as tranche `redeem`, while FE should call Market `withdraw` for this protocol path.
- Chain Projector indexes trade events into `market_events`.
- Portfolio activities derive rows from indexed events:
  - `DepositYT` -> buy senior/junior activity
  - `WithdrawYT` -> sell senior/junior activity
  - `DepositRequested` and `DepositSettled` -> async buy activities
- `/markets/:address/history` and chart metrics `tvl`, `tokenPrice`, `ratio` read indexed snapshots.

### Gaps blocking robust FE trade flow

1. No direct YT buy quote endpoint.
2. `withdraw-yt` quote action hints do not match the Market `withdraw(...)` path.
3. `deposit-base` quote still uses placeholder output and does not provide enough exact wagmi hints.
4. No transaction hash status endpoint for FE to poll after wagmi submission.
5. `trade-constraints` should explicitly include approval targets and method names so FE can build forms without hardcoding protocol rules.

---

## 3. Scope

### In scope

- Backend read/preflight support for FE wagmi transaction flow.
- Quote endpoints for:
  - direct YT buy: `depositYT`
  - base-token instant buy: `depositInstant`
  - ST/JT share sell to YT: `withdraw`
- Approval hints for ERC-20/YT/tranche-share approvals.
- Transaction status endpoint backed by indexed `market_events`.
- Canonical API docs updates.
- Tests for quote math, action hints, constraints, tx status, and Swagger/API contract.

### Non-goals

- No backend transaction signing.
- No backend private keys.
- No mandatory calldata generation.
- No contract changes.
- No base-token sell/withdraw path because Market does not expose current MVP base withdrawal.
- No async request operator orchestration in this plan.
- No broad portfolio earnings/cost-basis work.

---

## 4. API design

### 4.1 `POST /quotes/deposit-yt`

Purpose: preflight direct buy of ST/JT using YT.

Request:

```json
{
  "market": "0x3aDa769dC813e3376fCD40d05bEA12263048A487",
  "tranche": "senior",
  "amountYt": "1000000000000000000"
}
```

Response shape:

```json
{
  "input": {
    "market": "0x3aDa769dC813e3376fCD40d05bEA12263048A487",
    "tranche": "senior",
    "amountYt": "1000000000000000000",
    "token": "0xYT"
  },
  "estimate": {
    "sharesOut": "1000000000000000000",
    "depositValue": "1000000000000000000",
    "navAfter": "2000000000000000000",
    "navStAfter": "1000000000000000000",
    "navJtAfter": "1000000000000000000",
    "stJtRatioAfter": "1000000000000000000",
    "estimateType": "derived"
  },
  "availability": {
    "available": true,
    "reason": null
  },
  "warnings": ["STALE_PRICE"],
  "action": {
    "contract": "0xMarket",
    "method": "depositYT",
    "args": {
      "asSenior": true,
      "amount": "1000000000000000000"
    },
    "calldataIncluded": false,
    "approval": {
      "required": true,
      "token": "0xYT",
      "spender": "0xMarket",
      "amount": "1000000000000000000"
    }
  },
  "dataQuality": {
    "sources": {
      "marketState": "live_contract",
      "estimate": "derived",
      "constraints": "derived"
    }
  }
}
```

Availability reasons:

- `MARKET_HALTED`
- `ZERO_AMOUNT`
- `SENIOR_CAPACITY_EXCEEDED`
- `FIRST_DEPOSIT_MUST_BE_JUNIOR`

### 4.2 Upgrade `POST /quotes/deposit-base`

Purpose: preflight instant base-token buy using Market `depositInstant(...)`.

Required response additions:

- `action.method = "depositInstant"`
- `action.contract = market address`
- `action.args` object:
  - `asSenior`
  - `tokenIn`
  - `amountIn`
  - `minYtOut`
  - `receiver`
  - `referrerId`
- `action.approval.token = base token`
- `action.approval.spender = market address`
- `action.approval.amount = amountIn`
- `estimate.minYtOut`
- `estimate.estimatedYtOut`
- `estimate.sharesOut`
- `availability.reason = DEPOSIT_BASE_INSTANT_UNAVAILABLE` when adaptor instant is disabled

Note: if exact adaptor quote read is unavailable, keep `estimatedYtOut` clearly labelled as `derived_from_latestYtPrice` or `placeholder`. Do not imply executable guarantee.

### 4.3 Upgrade `POST /quotes/withdraw-yt`

Purpose: preflight sell/redeem ST/JT shares to YT through Market `withdraw(...)`.

Request should support both modes:

```json
{
  "market": "0xMarket",
  "tranche": "senior",
  "mode": "shares",
  "amount": "1000000000000000000",
  "receiver": "0xWallet"
}
```

`mode = shares` maps to:

```solidity
withdraw(fromSenior, true, shares, receiver)
```

`mode = assets` maps to:

```solidity
withdraw(fromSenior, false, assets, receiver)
```

Response action must use Market, not tranche:

```json
{
  "action": {
    "contract": "0xMarket",
    "method": "withdraw",
    "args": {
      "fromSenior": true,
      "byShares": true,
      "amount": "1000000000000000000",
      "receiver": "0xWallet"
    },
    "calldataIncluded": false,
    "approval": {
      "required": true,
      "token": "0xST",
      "spender": "0xMarket",
      "amount": "1000000000000000000"
    }
  }
}
```

Availability reasons:

- `ZERO_AMOUNT`
- `ZERO_RECEIVER`
- `JUNIOR_WITHDRAWAL_CAPACITY_EXCEEDED`
- `INSUFFICIENT_SHARES` if wallet is supplied and live balance read is added

### 4.4 Upgrade `GET /markets/:address/trade-constraints`

Must expose enough FE-safe data to build forms and approvals without hardcoding protocol rules:

```json
{
  "market": "0xMarket",
  "tokens": {
    "yt": { "address": "0xYT", "decimals": 18, "symbol": "mEDGE" },
    "base": { "address": "0xUSDC", "decimals": 6, "symbol": "USDC" },
    "senior": { "address": "0xST", "decimals": 18, "symbol": "st-mEDGE" },
    "junior": { "address": "0xJT", "decimals": 18, "symbol": "jt-mEDGE" }
  },
  "approvals": {
    "depositYt": { "token": "0xYT", "spender": "0xMarket" },
    "depositBaseInstant": { "token": "0xUSDC", "spender": "0xMarket" },
    "withdrawSenior": { "token": "0xST", "spender": "0xMarket" },
    "withdrawJunior": { "token": "0xJT", "spender": "0xMarket" }
  },
  "methods": {
    "depositYt": "depositYT",
    "depositBaseInstant": "depositInstant",
    "withdrawYt": "withdraw"
  },
  "capabilities": {
    "depositYt": true,
    "withdrawYt": true,
    "depositBaseInstant": true,
    "depositBaseRequest": true,
    "withdrawBaseAsync": false
  },
  "limits": {
    "seniorDepositCapacityYt": "...",
    "juniorWithdrawalCapacityYt": "...",
    "maxStJtRatio": "5000000000000000000",
    "currentStJtRatio": "1000000000000000000"
  },
  "warnings": ["STALE_PRICE"]
}
```

### 4.5 Add `GET /tx/:hash`

Purpose: after FE submits wagmi transaction, FE polls BE until projector indexes relevant events.

Response when indexed:

```json
{
  "txHash": "0xabc",
  "status": "indexed",
  "confirmationsSource": "indexed_events",
  "events": [
    {
      "eventName": "DepositYT",
      "marketAddress": "0xMarket",
      "blockNumber": "123",
      "logIndex": "0",
      "args": {
        "user": "0xWallet",
        "asSenior": true,
        "assets": "1000000000000000000",
        "shares": "1000000000000000000"
      }
    }
  ],
  "dataQuality": {
    "sources": {
      "tx": "indexed_events"
    }
  }
}
```

Response when not yet indexed:

```json
{
  "txHash": "0xabc",
  "status": "not_indexed",
  "confirmationsSource": "indexed_events",
  "events": [],
  "dataQuality": {
    "sources": {
      "tx": "indexed_events"
    }
  }
}
```

Do not call RPC receipt in the first implementation unless needed. Projector-indexed status is enough for FE to know backend read model caught up.

---

## 5. File/module plan

### Modify

- `backend/src/modules/quotes/quotes.service.ts`
  - Add `quoteDepositYt`.
  - Upgrade `quoteDepositBase` response hints.
  - Correct `quoteWithdrawYt` action hints to Market `withdraw`.
  - Add pure helper math for ratio-after and availability checks.
- `backend/src/modules/quotes/quotes.controller.ts`
  - Add `POST /quotes/deposit-yt`.
  - Update Swagger descriptions for no-calldata wagmi flow.
- `backend/src/modules/quotes/dto/quote-swagger.dto.ts`
  - Add DTOs for direct YT deposit quote and upgraded quote response action/approval shape.
- `backend/src/modules/quotes/quotes.service.spec.ts`
  - Add tests for direct YT quote, senior-capacity failure, first-deposit-Junior rule, withdraw action correction, base approval hints.
- `backend/src/modules/market-state/market-state.service.ts`
  - Expand trade constraints with token/action/approval/method metadata.
- `backend/src/modules/market-state/market-state.service.spec.ts`
  - Assert exact constraints shape.
- `backend/src/modules/market-state/dto/market-swagger.dto.ts`
  - Update trade constraints Swagger DTO.
- `backend/src/swagger.fe-api.spec.ts`
  - Assert new `POST /quotes/deposit-yt` and `GET /tx/{hash}` paths.
- `docs/canonical/api-contract.md`
  - Update public quote/transaction status contract.

### Create

- `backend/src/modules/tx-status/tx-status.module.ts`
- `backend/src/modules/tx-status/tx-status.controller.ts`
- `backend/src/modules/tx-status/tx-status.service.ts`
- `backend/src/modules/tx-status/tx-status.service.spec.ts`
- `backend/src/modules/tx-status/dto/tx-status-swagger.dto.ts`

### Possibly modify

- `backend/src/app.module.ts`
  - Import `TxStatusModule`.
- `backend/src/shared/database/schema/index.ts`
  - No schema change expected; use existing `market_events` table.

---

## 6. Milestones and tasks

### Epic 1 — Correct and complete quote/preflight support

#### Slice 1 — Direct YT deposit quote

- [ ] Read `quotes.service.ts`, `quotes.controller.ts`, `quote-swagger.dto.ts`, and `quotes.service.spec.ts`.
- [ ] Add failing tests for `quoteDepositYt`:
  - junior deposit available when market not halted.
  - senior deposit unavailable when derived ST/JT ratio exceeds max.
  - senior first deposit unavailable when `navJt = 0`.
  - action uses `contract = Market`, `method = depositYT`, approval token = YT, spender = Market.
- [ ] Implement `quoteDepositYt` with pure derived math:
  - `depositValue = amountYt * latestYtPrice / 1e18`
  - if senior: `navStAfter = navSt + depositValue`; else `navJtAfter = navJt + depositValue`
  - `navAfter = navStAfter + navJtAfter`
  - `stJtRatioAfter = navStAfter / navJtAfter` scaled 1e18, with `navJtAfter = 0` guarded.
- [ ] Add `POST /quotes/deposit-yt` controller route.
- [ ] Add DTO/Swagger shape.
- [ ] Run `pnpm test src/modules/quotes/quotes.service.spec.ts`.

#### Slice 2 — Correct withdraw quote

- [ ] Add failing test proving `quoteWithdrawYt` action uses Market `withdraw`, not tranche `redeem`.
- [ ] Add request shape support for `mode = shares|assets`, `amount`, and `receiver`.
- [ ] Return approval token as ST or JT tranche and spender as Market.
- [ ] Add junior withdrawal capacity check using `calculateJuniorWithdrawalCapacity` when `tranche = junior`.
- [ ] Preserve compatibility with old `shares` request if needed by mapping it to `mode = shares`.
- [ ] Run `pnpm test src/modules/quotes/quotes.service.spec.ts`.

#### Slice 3 — Upgrade base instant quote hints

- [ ] Add failing tests for base approval target and `depositInstant` args object.
- [ ] Add `receiver` and `referrerId` optional request fields.
- [ ] Use base token address/decimals from live market assumptions.
- [ ] Return `minYtOut` from request or derive from `slippageBps` if an estimate is available.
- [ ] Keep output source honest: `placeholder` if no exact adaptor quote read exists.
- [ ] Run `pnpm test src/modules/quotes/quotes.service.spec.ts`.

### Epic 2 — Complete trade constraints for FE forms

- [ ] Read current `getTradeConstraints` implementation.
- [ ] Add failing tests asserting `tokens`, `approvals`, `methods`, `capabilities`, `limits`, and `warnings` fields.
- [ ] Implement expanded response without removing existing fields unless docs/tests are updated.
- [ ] Update Swagger DTO.
- [ ] Run `pnpm test src/modules/market-state/market-state.service.spec.ts`.

### Epic 3 — Add tx status endpoint backed by indexed events

- [ ] Create `TxStatusModule` using `DatabaseModule`.
- [ ] Add failing service tests:
  - returns `not_indexed` for unknown tx hash.
  - returns `indexed` with ordered events for matching `market_events.tx_hash`.
  - normalizes tx hash case.
- [ ] Implement `TxStatusService` querying existing `market_events` by `txHash`, ordered by `blockNumber`, `logIndex`.
- [ ] Add `GET /tx/:hash` controller.
- [ ] Add Swagger DTO.
- [ ] Import module in `AppModule`.
- [ ] Add Swagger API path assertion in `swagger.fe-api.spec.ts`.
- [ ] Run `pnpm test src/modules/tx-status src/swagger.fe-api.spec.ts`.

### Epic 4 — Docs, integration checklist, and demo smoke

- [ ] Update `docs/canonical/api-contract.md`:
  - Add `/quotes/deposit-yt`.
  - Correct `/quotes/withdraw-yt` action semantics to Market `withdraw`.
  - Document approval hints and no-calldata guarantee.
  - Add `/tx/:hash`.
- [ ] Check whether `docs/canonical/integration-rules.md` needs update for FE approval/wagmi rules.
- [ ] Run full backend verification:
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`
- [ ] Run Docker DB migration smoke:
  - `cd backend/docker && docker compose up -d postgres`
  - `cd .. && set -a; source .env; set +a; pnpm db:migrate`
- [ ] Run API smoke with app running:
  - `GET /markets/:address/trade-constraints`
  - `POST /quotes/deposit-yt`
  - `POST /quotes/deposit-base`
  - `POST /quotes/withdraw-yt`
  - `GET /tx/<known-or-fake-hash>`

---

## 7. Verification gates

### Required before marking plan complete

- `pnpm test` passes.
- `pnpm lint` passes.
- `pnpm build` passes.
- `pnpm db:migrate` passes against local Docker Postgres.
- API smoke returns expected JSON shapes.
- Existing projector still logs `projector batch completed` with `PROJECTOR_BATCH_SIZE=10` on Alchemy free tier.

### FE acceptance checklist

FE can complete this sequence without backend calldata:

1. Fetch `GET /markets/:address/trade-constraints`.
2. User chooses buy/sell form values.
3. FE calls matching quote endpoint.
4. FE checks `availability.available` and warnings.
5. FE uses `action.approval` to call ERC-20 approve if needed.
6. FE uses wagmi `writeContract` with `action.contract`, `action.method`, and `action.args`.
7. FE polls `GET /tx/:hash` until `status = indexed`.
8. FE refreshes portfolio/activity/history endpoints.

---

## 8. Risks and mitigations

- **Risk:** Exact output estimate for `depositInstant` is not possible without adaptor quote method.  
  **Mitigation:** Label as placeholder/derived and let FE use conservative `minYtOut` from user input or explicit slippage UX.

- **Risk:** Direct YT deposit/withdraw do not update oracle price.  
  **Mitigation:** Return `STALE_PRICE` warnings and `latestYtPrice` source labels.

- **Risk:** Projector lag makes tx status show `not_indexed` after wallet success.  
  **Mitigation:** FE keeps polling; backend response explicitly says source is `indexed_events`.

- **Risk:** Alchemy free tier limits `eth_getLogs` to 10-block ranges.  
  **Mitigation:** Keep `PROJECTOR_BATCH_SIZE=10` for demo unless using paid RPC.

- **Risk:** Backend quote availability is preflight only; chain can still revert if state changes before tx mined.  
  **Mitigation:** Response names it quote/preflight, not guarantee.

---

## 9. Open decisions

1. Should `POST /quotes/deposit-base` support async request flow now, or only instant path for demo?
2. Should `GET /tx/:hash` query RPC receipt as fallback, or only indexed DB state in first version?
3. Should backend include ABI method `args` as object only, or also array in exact Solidity order for easier FE mapping?

Recommended defaults:

1. Instant only for demo.
2. Indexed DB only for first version.
3. Include both object and ordered array if FE wants fastest integration; otherwise object is safer.
