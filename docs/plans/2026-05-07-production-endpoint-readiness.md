# Production Endpoint Readiness Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current backend API endpoints production-safe by removing all default/mock data paths, replacing placeholders with live contract reads or indexed projections, and making every response field source explicit.

**Architecture:** Keep current NestJS modular monolith. Deployed Base Sepolia contracts remain execution truth; backend derives read models from RPC reads plus indexed events. Do not add microservices, Redis, Temporal, TimescaleDB, new contract behavior, frontend wallet submission logic, or admin UI/signer work in this plan.

**Tech Stack:** NestJS, TypeScript, viem, PostgreSQL, Drizzle, Vitest, Anvil/Foundry chain tests.

---

## Source-of-truth docs

Read before implementation:

1. `AGENTS.md`
2. `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `docs/canonical/api-contract.md`
5. `docs/canonical/backend-architecture.md`
6. `docs/canonical/integration-rules.md`
7. `docs/canonical/smartcontract-events.md`

Backend implementation must preserve these constraints:

- Contracts are execution truth.
- Backend does not sign wallet transactions, store private keys, submit frontend wallet transactions, or return mandatory calldata.
- `GET /tx/:hash` remains indexed-event status only, not RPC receipt status.
- Mock data must not be reachable in production/default mode.
- If endpoint behavior or shape changes, update `docs/canonical/api-contract.md` in same slice.

## Current gaps verified from source

| Area | Current source | Gap | Production target |
|---|---|---|---|
| Market APY | `backend/src/modules/market-state/market-state.service.ts:169-177` | ST/JT APY hardcoded to `0` | APY derived from indexed snapshots or explicitly `unavailable`, never fake zero as live yield |
| Factsheet | `backend/src/modules/market-state/market-state.service.ts:337-350` | Config-only factsheet rows | Factsheet combines validated config + live token/market metadata and source labels |
| Charts | `backend/src/modules/market-state/market-state.service.ts:353-399` | `yield` and `utilization` unavailable; indexed metrics depend on snapshots only | `tvl`, `tokenPrice`, `ratio` from snapshots; `yield` from APY snapshots; `utilization` returns `unavailable` until contract/adaptor exposes idle/deployed/liquidity state |
| Quotes deposit YT | `backend/src/modules/quotes/quotes.service.ts:68-140` | Derived-only estimate | Add on-chain simulation where ABI allows; otherwise preserve as preflight with strict source label and no production lie |
| Quotes withdraw YT | `backend/src/modules/quotes/quotes.service.ts:254-326` | `shares` mode `derived_identity`; `assets` mode `derived` | Use tranche preview reads and Market simulation where possible; return exact source labels |
| Portfolio overview | `backend/src/modules/portfolio/portfolio.service.ts:775-846` | `includeMock` can affect output; net APY hardcoded unavailable/0 | Remove default mock behavior; calculate from real projections or return unavailable with clear source |
| Portfolio earnings | `backend/src/modules/portfolio/portfolio.service.ts:869-897` | mock branch; history empty | Event-derived earnings plus optional snapshots; no mock in production |
| Portfolio claimables | `backend/src/modules/portfolio/portfolio.service.ts:899-912` | mock branch | Only real refund claimables from indexed requests |
| Portfolio requests | `backend/src/modules/portfolio/portfolio.service.ts:849-867` | optional mock fallback | Only indexed request rows; empty means empty |
| Portfolio activities | `backend/src/modules/portfolio/portfolio.service.ts:914-928` | optional mock fallback | Only indexed market events; empty means empty |
| Admin endpoints | `backend/src/modules/admin-ops/admin-ops.controller.ts:4-7` | controller shell only | Out of scope for this plan because FE has no admin surface yet; leave docs/source unchanged unless later admin work is requested |
| Base token metadata | `backend/src/shared/blockchain/contract-reader.service.ts:168-172` | `baseTokenAddress` hardcoded to `MOCK_USDC_ADDRESS`; symbol/decimals hardcoded elsewhere | Read token metadata from adaptor/config source appropriate for current deployment and label source |

## Self-review / challenge notes

This plan intentionally does **not** promise every field can become `live_contract`. Some values do not exist as direct contract state:

- APY and charts are projections. Correct production behavior is indexed projection with source labels, or `unavailable` if no defensible projection exists.
- Portfolio earnings require complete historical cashflows. If indexer starts after user activity, source must be `partial_indexed_events`, not full accuracy.
- Rewards, airdrops, user-fee claimables do not exist in current contract surface. Do not invent them.
- `GET /tx/:hash` should not query RPC receipts because current contract says indexed-event status only. FE should use wagmi receipt for mined/reverted and backend `/tx/:hash` for indexed confirmation.
- Admin endpoints are intentionally skipped in this plan because FE has no admin surface yet.

Production readiness means **no mock/default fake data**, not “always non-empty data.” Empty or unavailable is valid when truthful and documented.

## File/module plan

### Existing files to modify

- `backend/src/modules/market-state/market-state.service.ts`
  - Replace hardcoded APY semantics.
  - Move factsheet assembly to production metadata service.
  - Read chart series from projection repositories.

- `backend/src/modules/market-state/market-state.controller.ts`
  - Ensure Swagger and response descriptions match live/unavailable source behavior.

- `backend/src/modules/market-state/market-metadata.config.ts`
  - Keep only static, deployment-reviewed facts.
  - Remove fixture-style chart rows from production path.

- `backend/src/modules/quotes/quotes.service.ts`
  - Add strict simulation/preview paths and source labels.
  - Keep action hints, no calldata.

- `backend/src/shared/blockchain/contract-reader.service.ts`
  - Add ERC20 metadata reads.
  - Add tranche preview reads.
  - Add optional Market withdraw/deposit simulation wrappers where ABI supports it.

- `backend/src/modules/portfolio/portfolio.service.ts`
  - Remove default mock branches.
  - Reject or ignore `includeMock` in production mode.
  - Use repository results only for activities, requests, claimables, earnings.

- `backend/src/modules/portfolio/*repository*.ts`
  - Ensure repositories expose enough query methods for production read models.

- `backend/src/modules/admin-ops/admin-ops.controller.ts`
  - No planned changes in this plan.

- `backend/src/modules/admin-ops/admin-ops.service.ts`
  - No planned changes in this plan.

- `backend/src/shared/database/schema/*.ts`
  - Add tables/columns only where required for APY snapshots, chart projections, or production read models.

- `docs/canonical/api-contract.md`
  - Update field source semantics and unavailable behavior.

- `docs/canonical/backend-architecture.md`
  - Update if new projection tables/jobs/module dependencies are added.

### New files likely needed

- `backend/src/modules/market-state/market-analytics.repository.ts`
  - Reads snapshot/APY/chart projection rows.

- `backend/src/modules/market-state/market-apy.service.ts`
  - Computes ST/JT APY from snapshot windows.

- `backend/src/modules/market-state/market-factsheet.service.ts`
  - Assembles factsheet from live state + approved static metadata.

- `backend/src/modules/quotes/quote-simulation.service.ts`
  - Owns viem simulations/previews and revert reason mapping.

- `backend/src/modules/portfolio/portfolio-production-mode.ts`
  - Central helper to disable mock data in production/default mode.

- `backend/src/shared/database/schema/market-apy-snapshots.ts`
  - Optional. Use only if APY cannot be computed efficiently from existing `market_snapshots`.

## Non-goals

- Do not implement Stable Vaults, swaps, freeze/delist execution, deleveraging, market-level async base withdrawal, or cross-market routing.
- Do not change smart contracts.
- Do not make backend submit user wallet transactions.
- Do not make `/tx/:hash` a receipt endpoint.
- Do not implement admin UI, admin signer, or admin write endpoints in this plan.
- Do not keep sandbox/mock behavior enabled in production/default API.

## Chunk 1: Production mode and mock removal guardrails

### Task 1: Define production mock policy

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Create: `backend/src/modules/portfolio/portfolio-production-mode.ts`
- Test: `backend/src/modules/portfolio/portfolio-production-mode.spec.ts`
- Test: existing portfolio service/controller specs

- [ ] Step 1: Write tests for mock policy.
  - `NODE_ENV=production`: `includeMock=true` must not return mock rows.
  - default with no `includeMock`: no mock rows.
  - optional local sandbox mode can be allowed only when explicit env flag is enabled.

- [ ] Step 2: Run targeted tests.

```bash
pnpm test backend/src/modules/portfolio/portfolio-production-mode.spec.ts
```

Expected: fail because helper does not exist.

- [ ] Step 3: Implement helper.

Rules:

```text
mock enabled only if:
  includeMock === true
  AND NODE_ENV !== 'production'
  AND PORTFOLIO_MOCK_FALLBACK === 'true'
```

- [ ] Step 4: Replace `explicitMockRequested` and `shouldIncludeMock` usage in portfolio service with helper.

- [ ] Step 5: Ensure responses label empty real data as `unavailable` or empty arrays, not `mock`.

- [ ] Step 6: Run tests.

```bash
pnpm test -- portfolio
pnpm lint
```

- [ ] Step 7: Update `docs/canonical/api-contract.md` to say `includeMock` is sandbox-only and disabled in production.

### Task 2: Remove production fixture chart path

**Files:**
- Modify: `backend/src/modules/market-state/market-metadata.config.ts`
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Test: market-state service specs

- [ ] Step 1: Write tests proving chart fixtures are never used as data series.

- [ ] Step 2: Keep chart label/unit config, remove or isolate fixture data arrays.

- [ ] Step 3: Verify `utilization` always returns `unavailable`, and `yield` returns `unavailable` until APY snapshots from Task 4 exist.

- [ ] Step 4: Run tests and lint.

```bash
pnpm test -- market-state
pnpm lint
```

## Chunk 2: Market metadata, APY, factsheet, charts

### Task 3: Add live token metadata reads

**Files:**
- Modify: `backend/src/shared/blockchain/contracts.ts`
- Modify: `backend/src/shared/blockchain/contract-reader.service.ts`
- Test: `backend/src/shared/blockchain/contract-reader.service.spec.ts`

- [ ] Step 1: Add minimal ERC20 ABI entries: `symbol()`, `decimals()`.

- [ ] Step 2: Add `getTokenMetadata(address)` returning `{ address, symbol, decimals }`.

- [ ] Step 3: Replace hardcoded `USDC`/`6` in market state with metadata read where available.

- [ ] Step 4: Self-review: if deployed adaptor does not expose base token, keep address from current config but label `baseToken.address` source as `config` and symbol/decimals as `live_contract` after reading ERC20 metadata.

- [ ] Step 5: Test fallback behavior for metadata read failure: response should fail clearly for required token metadata, not silently fake production metadata.

### Task 4: Implement locked APY semantics

**Files:**
- Create: `backend/src/modules/market-state/market-apy.service.ts`
- Create/modify: `backend/src/modules/market-state/market-analytics.repository.ts`
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Optional create: `backend/src/shared/database/schema/market-apy-snapshots.ts`
- Test: `backend/src/modules/market-state/market-apy.service.spec.ts`

Locked production semantics:

```text
ST share price = st.convertToAssets(1e18)
JT share price = jt.convertToAssets(1e18)
ST APY = annualized change in ST share price over selected window.
JT APY = annualized change in JT share price over selected window.
Preferred formula = compound annualized: (priceNow / pricePast)^(365 / daysElapsed) - 1.
MVP fallback formula, only if compound fixed-point exponent is not implemented yet = simple annualized: (priceNow / pricePast - 1) * 365 / daysElapsed.
source = indexed_snapshots when at least 2 valid points exist.
source = unavailable when fewer than 2 valid points exist.
```

- [ ] Step 1: Add APY snapshot source. Snapshot `st.convertToAssets(1e18)` and `jt.convertToAssets(1e18)` after each indexed price update / market snapshot.

- [ ] Step 2: Verify existing `market_snapshots` table has enough data. If it lacks ST/JT exchange rates, add projection table or extend snapshot write path.

- [ ] Step 3: Write failing tests:
  - returns unavailable with 0 or 1 snapshot.
  - computes positive APY over 30d window.
  - computes negative APY correctly.
  - never returns hardcoded `0` with source pretending live.

- [ ] Step 4: Implement APY service.

- [ ] Step 5: Add `apySource` or `dataQuality.sources.apy` to market response if API shape change is acceptable. If not, keep `apy='0'` only when source is unavailable and update docs to clarify `0` is display fallback, not live APY.

Self-review requirement:

- Do not compute APY from NAV alone unless product explicitly accepts that as approximation. Tranche APY should use tranche exchange-rate movement, not total market NAV.

### Task 5: Make factsheet production-safe

**Files:**
- Create: `backend/src/modules/market-state/market-factsheet.service.ts`
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Modify: `backend/src/modules/market-state/market-metadata.config.ts`
- Test: `backend/src/modules/market-state/market-factsheet.service.spec.ts`

- [ ] Step 1: Split factsheet rows into:
  - live: market address, chain, underlying token, base token, ST/JT token addresses, adaptor capabilities, fee/rate fields that exist on chain.
  - config: descriptions, marketing labels, docs URLs if approved.
  - unavailable: fields not backed by current contract or approved config.

- [ ] Step 2: Write tests proving every row has `source`.

- [ ] Step 3: Remove any row that cannot be sourced truthfully.

- [ ] Step 4: Update API docs with row source semantics.

### Task 6: Complete charts without mock data

**Files:**
- Create/modify: `backend/src/modules/market-state/market-analytics.repository.ts`
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Optional: `backend/src/shared/database/schema/market-apy-snapshots.ts`
- Test: market chart specs

- [ ] Step 1: Keep `tvl`, `tokenPrice`, `ratio` from `market_snapshots`.

- [ ] Step 2: Implement `yield` from APY snapshot/source in Task 4. If fewer than 2 valid APY points exist, return empty series with `source='unavailable'`.

- [ ] Step 3: Keep `utilization` explicitly unavailable. Verified current Market/Tranche/MidasAdaptor contracts and deployed ABIs expose no idle cash, deployed assets, available liquidity, or utilization state. Do not invent utilization from NAV or totalAssets.

- [ ] Step 4: Add tests for each metric and source label, including `utilization` always unavailable.

## Chunk 3: Quote production accuracy

### Task 7: Centralize quote simulations/previews

**Files:**
- Create: `backend/src/modules/quotes/quote-simulation.service.ts`
- Modify: `backend/src/modules/quotes/quotes.service.ts`
- Modify: `backend/src/shared/blockchain/contract-reader.service.ts`
- Test: `backend/src/modules/quotes/quote-simulation.service.spec.ts`

- [ ] Step 1: Move base instant simulation logic out of `QuotesService` into `QuoteSimulationService`.

- [ ] Step 2: Add tranche preview helpers:
  - `previewDeposit(trancheAddress, assets)`
  - `previewWithdraw(trancheAddress, assets)` if ABI supports it
  - `previewRedeem(trancheAddress, shares)` if ABI supports it

- [ ] Step 3: Add strict reason mapping for reverts.

- [ ] Step 4: Tests must cover success, revert, missing sender, zero amount, zero receiver, stale warning, halted market.

### Task 8: Upgrade `POST /quotes/deposit-yt`

**Files:**
- Modify: `backend/src/modules/quotes/quotes.service.ts`
- Test: quotes service/controller specs

- [ ] Step 1: Use tranche `previewDeposit(amountYt)` for `sharesOut` instead of identity assumption.

- [ ] Step 2: Keep NAV/risk capacity derivation for constraints because Market enforces ratio but quote can preflight.

- [ ] Step 3: If sender is added to request later, optionally simulate `Market.depositYT`. Do not require sender in current API unless contract changes are approved.

- [ ] Step 4: Response source labels:
  - `marketState: live_contract`
  - `sharesOut: live_contract_preview`
  - `constraints: derived`
  - `transactionSuccess: not_simulated` unless Market simulation is added

### Task 9: Upgrade `POST /quotes/withdraw-yt`

**Files:**
- Modify: `backend/src/modules/quotes/quotes.service.ts`
- Test: quotes service/controller specs

- [ ] Step 1: For `mode='shares'`, call `previewRedeem(shares)` to estimate YT assets out.

- [ ] Step 2: For `mode='assets'`, call `previewWithdraw(assets)` to estimate shares required if ABI supports it; otherwise return unavailable for exact shares estimate and keep action amount as assets.

- [ ] Step 3: Keep junior withdrawal capacity derivation from live NAV.

- [ ] Step 4: Add tests proving `derived_identity` is gone from production output when preview is available.

- [ ] Step 5: Update docs if request/response source fields change.

## Chunk 4: Portfolio read models without mocks

### Task 10: Validate event coverage for portfolio projections

**Files:**
- Inspect/modify: `backend/src/modules/chain-projector/*`
- Inspect/modify: `backend/src/modules/portfolio/*repository*.ts`
- Modify: `backend/src/shared/database/schema/portfolio-cashflows.ts`
- Modify: `backend/src/shared/database/schema/portfolio-cost-basis.ts`
- Test: chain projector + portfolio projection specs

- [ ] Step 1: List exact events needed:
  - `DepositYT`
  - `WithdrawYT`
  - `DepositRequested`
  - `DepositBasePulled`
  - `DepositRequestLinked`
  - `DepositSettled`
  - `DepositRejected`
  - `DepositRefunded`
  - Tranche ERC-4626 `Deposit`/`Withdraw`/`Transfer` if required for share ownership/cost basis.

- [ ] Step 2: Verify projector writes `market_events`, `deposit_requests`, `portfolio_cashflows`, `portfolio_cost_basis` consistently.

- [ ] Step 3: Add replay tests: rebuild portfolio tables from events and compare deterministic output.

- [ ] Step 4: Add partial-history detection. If cursor starts after first user activity, earnings source must be `partial_indexed_events`.

### Task 11: Production portfolio overview

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Test: portfolio service specs

- [ ] Step 1: Remove mock summary values.

- [ ] Step 2: `summary.totalValue` remains live from tranche balances + price.

- [ ] Step 3: `totalValueChange`, `currentEarning`, `earning30d`, `netApy` use real repositories or return unavailable source.

- [ ] Step 4: `pendingRequests`, `recentActivities`, `claimableItems` return DB rows only.

- [ ] Step 5: Add tests for empty DB returns empty arrays and `unavailable`, not mock.

### Task 12: Production earnings/history

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify: `backend/src/modules/portfolio/portfolio-earnings.repository.ts`
- Optional create: `backend/src/shared/database/schema/portfolio-earnings-snapshots.ts`
- Test: portfolio earnings specs

- [ ] Step 1: Keep earnings table from cost basis + live positions.

- [ ] Step 2: Implement history only from real snapshot/cashflow data.

- [ ] Step 3: If no history projection exists, return `history.series=[]`, `historyAvailable=false`, `source='unavailable'`; do not mock.

- [ ] Step 4: Add tests for full history, partial history, empty history.

### Task 13: Production claimables/requests/activities

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Modify: repositories as needed
- Test: portfolio claimables/requests/activities specs

- [ ] Step 1: Claimables only from rejected, unrefunded async deposit requests where refund is actually available.

- [ ] Step 2: Requests only from indexed `deposit_requests` rows.

- [ ] Step 3: Activities only from indexed `market_events` mapped to product activity types.

- [ ] Step 4: Add pagination tests.

- [ ] Step 5: Add tests proving `includeMock=true` does not affect production mode.

## Chunk 5: Verification and release gates

### Task 14: Add production endpoint audit tests

**Files:**
- Create: `backend/src/test/production-endpoint-readiness.spec.ts`
- Modify: relevant test setup fixtures

- [ ] Step 1: Add test that searches responses from default API mode and fails if `source='mock'` or known mock fixture IDs appear.

- [ ] Step 2: Add contract for `dataQuality.sources` on all affected endpoints.

- [ ] Step 3: Add tests for empty DB behavior.

### Task 15: End-to-end production smoke

**Files:**
- Modify/create: backend e2e tests as existing patterns require

- [ ] Step 1: Start local Postgres/test DB.

- [ ] Step 2: Run Anvil/chain fixtures.

- [ ] Step 3: Execute flow:
  1. Load market.
  2. Quote deposit.
  3. Submit tx in test harness or seed indexed event.
  4. Run projector.
  5. Verify `/tx/:hash` indexed.
  6. Verify portfolio activities/positions update.
  7. Verify no mock data appears.

- [ ] Step 4: Run full verification.

```bash
pnpm lint
pnpm test
pnpm test:int
pnpm test:chain
pnpm test:e2e
pnpm build
```

## Required docs updates during implementation

Update these only when source changes make them necessary:

- `docs/canonical/api-contract.md`
  - Mock disabled in production/default.
  - Source labels for APY/charts/portfolio/quotes.
  - Admin endpoint status only if later admin work changes docs/source.

- `docs/canonical/backend-architecture.md`
  - New projection tables/jobs/repositories.

- `docs/canonical/integration-rules.md`
  - Any FE behavior change around quote source labels or tx-status semantics.

- `backend/docs/HANDOFF.md`
  - Only if implementation changes backend session flow.

Each backend slice must record either:

```text
Architecture docs checked; no update needed
```

or list exact canonical docs updated.

## Production acceptance criteria

- No default/production endpoint returns mock rows, mock summaries, fixture chart data, or misleading hardcoded analytics values.
- Every non-live field has explicit `unavailable` or source label.
- `GET /markets` and `GET /markets/:address` do not present APY as real when it is unavailable.
- `GET /markets/:address/charts` returns only indexed/projection series or empty unavailable series.
- `POST /quotes/*` clearly distinguishes live contract reads, on-chain simulations/previews, and derived constraints.
- `GET /portfolio/*` uses live reads + indexed DB only in production/default mode.
- `GET /tx/:hash` remains indexed-event status only and docs say FE must use wagmi receipt for chain tx status.
- Admin routes are not part of this plan; no admin behavior is changed.
- `pnpm lint`, `pnpm test`, `pnpm test:int`, `pnpm test:chain`, `pnpm test:e2e`, and `pnpm build` pass.

## Risks and open decisions

1. **APY snapshot completeness:** APY formula is locked to tranche exchange-rate APY, but results require at least 2 valid indexed share-price snapshots.
2. **Utilization metric:** Current MVP contracts/ABIs have no idle/deployed/liquidity source. Keep `utilization` unavailable until contract/adaptor exposes source state.
3. **Historical completeness:** If projector did not index from deployment block, portfolio earnings must show partial quality.
4. **Base token source:** Current code hardcodes Base Sepolia mock USDC address. Production must derive from deployment config/adaptor-approved config plus live ERC20 metadata.
5. **API contract change risk:** Adding source fields may require FE adjustments. Coordinate before changing response shapes.

## Implementation order

1. Chunk 1: mock removal guardrails.
2. Chunk 2: market metadata/APY/factsheet/charts.
3. Chunk 3: quote previews/simulations.
4. Chunk 4: portfolio read models.
5. Chunk 5: production audit tests + e2e gates.

Do not activate this plan until user explicitly asks to execute it. Per `backend/docs/HANDOFF.md`, activation creates `backend/docs/initiatives/production-endpoint-readiness/`.
