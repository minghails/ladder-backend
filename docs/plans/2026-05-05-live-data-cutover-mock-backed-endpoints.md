# Live Data Cutover For Mock-Backed Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove misleading mock/placeholder data from 5 FE-visible endpoints and replace it with live, indexed, or explicitly unavailable data.

**Architecture:** Keep existing REST contracts stable where possible. Prefer data-source/behavior changes over shape changes: endpoints return the same top-level fields, but mock rows disappear by default and `dataQuality.sources` becomes precise. Portfolio uses live balances + indexed deposit requests/activities; market charts use indexed snapshots where possible; withdraw quotes use deterministic derived conversion instead of input echo.

**Tech Stack:** NestJS, TypeScript, Drizzle, viem-facing `ContractReaderService`, Vitest.

---

## Scope

Fix these 5 problems in priority order:

1. `GET /portfolio/:address/earnings` is mock-only.
2. `GET /portfolio/:address/claimables` is mock-only.
3. `GET /portfolio/:address` still exposes mock/placeholder summary fields and preview claimables.
4. `GET /markets/:address/charts?metric=yield|utilization` returns mock fixtures.
5. `POST /quotes/withdraw-yt` returns placeholder output amount equal to input.

Out of scope:

- New DB migrations for cost-basis, reward accrual, or claimable ledger.
- Returning transaction calldata.
- Implementing admin/operator claim/refund actions.
- Changing contract ABIs.

## File Map

- Modify `backend/src/modules/portfolio/portfolio.service.ts`
  - Remove default mock behavior from earnings/claimables/overview.
  - Add indexed/live empty-state helpers and data-quality labels.
  - Keep `includeMock=true` as dev-only fallback if existing tests require it, but never use env fallback for production-like behavior unless explicitly retained after review.
- Modify `backend/src/modules/portfolio/portfolio.service.spec.ts`
  - Add tests proving earnings/claimables default to live/empty, no mock rows.
  - Add tests proving overview claimable/earnings summaries are unavailable/zero, not mock.
  - Keep explicit `includeMock=true` tests only to document dev fixture mode.
- Modify `backend/src/modules/market-state/market-state.service.ts`
  - Replace mock `yield` and `utilization` chart series with indexed/derived or empty series.
  - `yield`: unavailable until APY projection exists, empty series.
  - `utilization`: derive from indexed snapshots if safe formula exists; otherwise empty series with source `unavailable`.
- Modify `backend/src/modules/market-state/market-state.service.spec.ts`
  - Add chart tests for `yield` and `utilization` no longer returning `source: 'mock'`.
- Modify `backend/src/modules/quotes/quotes.service.ts`
  - Replace withdraw placeholder with deterministic derived amount.
  - `mode='assets'`: output YT amount = requested amount.
  - `mode='shares'`: output YT amount = shares for now only if tranche ERC-4626 `previewRedeem` is not available through `ContractReaderService`; label `derived_identity` or add live preview in task 5.
- Modify `backend/src/modules/quotes/quotes.service.spec.ts`
  - Add tests for non-placeholder withdraw output and data-quality labels.
- Modify `docs/canonical/api-contract.md`
  - Update portfolio and chart sections: mock no longer default; earnings/claimables can be empty/unavailable; yield/utilization chart source no longer mock.
- Check `backend/docs/architecture.md` and `docs/canonical/backend-architecture.md`
  - Update only if source ownership or module dependency changes. Expected: no architecture update needed.

## Current Known Code Anchors

- Portfolio mock switch: `backend/src/modules/portfolio/portfolio.service.ts:259`
- Portfolio overview mock sections: `backend/src/modules/portfolio/portfolio.service.ts:681`
- Earnings endpoint: `backend/src/modules/portfolio/portfolio.service.ts:758`
- Claimables endpoint: `backend/src/modules/portfolio/portfolio.service.ts:773`
- Market chart mock branch: `backend/src/modules/market-state/market-state.service.ts:364`
- Withdraw placeholder: `backend/src/modules/quotes/quotes.service.ts:220`
- Canonical portfolio docs: `docs/canonical/api-contract.md:184`

---

## Task 1: Portfolio Earnings Live/Unavailable Cutover

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Test: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Docs: `docs/canonical/api-contract.md`

- [ ] **Step 1: Add failing tests for default earnings empty/unavailable**

Add tests to `backend/src/modules/portfolio/portfolio.service.spec.ts` inside `describe('PortfolioService', ...)`:

```ts
  it('returns empty unavailable earnings by default without mock rows', async () => {
    const { service } = await createService();

    const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001');

    expect(response).toEqual({
      walletAddress: '0xabcdef0000000000000000000000000000000001',
      earnings: [],
      history: {
        range: '30d',
        granularity: 'day',
        series: [],
      },
      dataQuality: {
        earningsEstimated: false,
        historyAvailable: false,
        activityIndexedUntilBlock: null,
        mockEnabled: false,
        mockedSections: [],
        sources: {
          positions: 'live',
          pendingRequests: 'db',
          earnings: 'unavailable',
          earningsHistory: 'unavailable',
          claimableItems: 'unavailable',
          recentActivities: 'unavailable',
        },
      },
    });
  });

  it('preserves explicit includeMock earnings fixture mode for FE sandbox only', async () => {
    const { service } = await createService();

    const response = await service.getEarnings('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      range: '7d',
      granularity: 'day',
    });

    expect(response.earnings).toHaveLength(3);
    expect(response.earnings.every((item) => item.source === 'mock')).toBe(true);
    expect(response.history.series).toHaveLength(2);
    expect(response.dataQuality.mockEnabled).toBe(true);
    expect(response.dataQuality.mockedSections).toEqual(
      expect.arrayContaining(['earnings', 'earningsHistory']),
    );
  });
```

- [ ] **Step 2: Run failing portfolio test**

Run:

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: first new test should pass if current default already empty, but this step guards behavior before refactor. If it fails because env `PORTFOLIO_MOCK_FALLBACK=true` leaks into tests, fix `shouldIncludeMock` in step 3.

- [ ] **Step 3: Make earnings source explicit and remove env fallback from earnings path**

In `backend/src/modules/portfolio/portfolio.service.ts`, add helper:

```ts
function explicitMockRequested(options?: PortfolioQueryOptions): boolean {
  return options?.includeMock === true;
}
```

Change `getEarnings`:

```ts
  async getEarnings(address: string, options?: PortfolioEarningsOptions): Promise<PortfolioEarningsResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = explicitMockRequested(options);
    const liveMarket = await this.contractReader.getMarketState();
    const range = options?.range ?? '30d';
    const granularity = options?.granularity ?? 'day';

    return {
      walletAddress: normalizedAddress,
      earnings: includeMock ? mockEarnings(liveMarket.address) : [],
      history: includeMock ? mockEarningsHistory(range, granularity) : { range, granularity, series: [] },
      dataQuality: dataQuality(includeMock),
    };
  }
```

Reason: earnings cannot be live until cost-basis/yield projection exists. Empty/unavailable is safer than fake PnL.

- [ ] **Step 4: Run portfolio tests**

Run:

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Update API docs for earnings**

In `docs/canonical/api-contract.md`, replace line describing earnings with:

```md
| GET | `/portfolio/:address/earnings` | Lazy-loaded earnings table and chart payload. Returns empty `earnings` and empty history with `dataQuality.sources.earnings = "unavailable"` until indexed cost-basis/yield projection exists; `includeMock=true` remains FE sandbox-only. |
```

- [ ] **Step 6: Commit Task 1**

```bash
git add backend/src/modules/portfolio/portfolio.service.ts backend/src/modules/portfolio/portfolio.service.spec.ts docs/canonical/api-contract.md
git commit -m "fix: stop default mock portfolio earnings"
```

---

## Task 2: Portfolio Claimables Live/Empty Cutover

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Test: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Docs: `docs/canonical/api-contract.md`

- [ ] **Step 1: Add failing tests for claimables default empty/unavailable**

Add tests:

```ts
  it('returns empty claimables by default without mock rows', async () => {
    const { service } = await createService();

    const response = await service.getClaimables('0xABCDEF0000000000000000000000000000000001');

    expect(response).toEqual({
      walletAddress: '0xabcdef0000000000000000000000000000000001',
      items: [],
      page: {
        limit: 20,
        nextCursor: null,
        hasMore: false,
      },
    });
  });

  it('preserves explicit includeMock claimables fixture mode for FE sandbox only', async () => {
    const { service } = await createService();

    const response = await service.getClaimables('0xABCDEF0000000000000000000000000000000001', {
      includeMock: true,
      limit: 2,
    });

    expect(response.items).toHaveLength(2);
    expect(response.items.every((item) => item.source === 'mock')).toBe(true);
    expect(response.items.every((item) => item.action.enabled === false)).toBe(true);
    expect(response.page).toEqual({
      limit: 2,
      nextCursor: '2',
      hasMore: true,
    });
  });
```

- [ ] **Step 2: Run failing claimables tests**

Run:

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: default-empty test should pass unless env fallback leaks; explicit mock test should pass.

- [ ] **Step 3: Make claimables ignore env fallback**

Change `getClaimables`:

```ts
  async getClaimables(address: string, options?: PortfolioListOptions): Promise<PortfolioClaimablesResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const includeMock = explicitMockRequested(options);
    const liveMarket = await this.contractReader.getMarketState();
    const page = paginate(includeMock ? mockClaimableItems(liveMarket.address) : [], options);

    return {
      walletAddress: normalizedAddress,
      items: page.items,
      page: page.page,
    };
  }
```

Reason: no source-of-truth claimable/refund action exists yet. Empty list is correct live behavior.

- [ ] **Step 4: Update overview preview to use same empty claimables rule**

In `getPortfolio`, change:

```ts
    const claimableItems = includeMock ? mockClaimableItems(liveMarket.address).slice(0, OVERVIEW_CLAIMABLE_LIMIT) : [];
```

to:

```ts
    const includeSandboxMock = explicitMockRequested(options);
    const claimableItems = includeSandboxMock
      ? mockClaimableItems(liveMarket.address).slice(0, OVERVIEW_CLAIMABLE_LIMIT)
      : [];
```

Then update summary claimable source:

```ts
          source: includeSandboxMock ? 'mock' : 'unavailable',
```

Do not use env mock fallback for claimable money-like data.

- [ ] **Step 5: Run portfolio tests**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Update API docs for claimables**

Replace claimables row in `docs/canonical/api-contract.md` with:

```md
| GET | `/portfolio/:address/claimables` | Lazy-loaded claimable/withdraw rows with pagination shape. Returns empty live list until claim/refund source of truth exists; `includeMock=true` remains FE sandbox-only and mock actions stay disabled. |
```

- [ ] **Step 7: Commit Task 2**

```bash
git add backend/src/modules/portfolio/portfolio.service.ts backend/src/modules/portfolio/portfolio.service.spec.ts docs/canonical/api-contract.md
git commit -m "fix: stop default mock claimables"
```

---

## Task 3: Portfolio Overview Remove Money-Like Mock/Placeholder Defaults

**Files:**
- Modify: `backend/src/modules/portfolio/portfolio.service.ts`
- Test: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Docs: `docs/canonical/api-contract.md`

- [ ] **Step 1: Add failing overview data-quality test**

Add test:

```ts
  it('labels unavailable overview financial aggregates without mock fallback by default', async () => {
    const { service } = await createService({ fakeDb: { depositRequestRows: [] } });

    const response = await service.getPortfolio('0xABCDEF0000000000000000000000000000000001');

    expect(response.summary.totalValueChange).toEqual({
      amount: '0',
      percent: '0',
      source: 'unavailable',
    });
    expect(response.summary.currentEarning).toBe('0');
    expect(response.summary.currentEarningSource).toBe('unavailable');
    expect(response.summary.earning30d).toBe('0');
    expect(response.summary.earning30dSource).toBe('unavailable');
    expect(response.summary.claimable).toEqual({
      amount: '0',
      token: 'USDC',
      source: 'unavailable',
    });
    expect(response.portfolioMetrics).toEqual({
      totalValue: '150000000000000000000',
      netApy: '0',
      netApySource: 'unavailable',
    });
    expect(response.dataQuality.mockedSections).toEqual([]);
  });
```

- [ ] **Step 2: Run failing overview test**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: FAIL because sources currently use `placeholder`.

- [ ] **Step 3: Change overview unavailable labels**

In `getPortfolio`, keep `includeMock = shouldIncludeMock(options)` for requests/activities if desired, but separate money-like fields:

```ts
    const includeSandboxMock = explicitMockRequested(options);
```

Change summary and metrics fields:

```ts
        totalValueChange: {
          amount: includeSandboxMock ? '4230400000000000000' : '0',
          percent: includeSandboxMock ? '0.02' : '0',
          source: includeSandboxMock ? 'mock' : 'unavailable',
        },
        currentEarning: includeSandboxMock ? '6420750000000000000' : '0',
        currentEarningSource: includeSandboxMock ? 'mock' : 'unavailable',
        earning30d: includeSandboxMock ? '980500000000000000' : '0',
        earning30dSource: includeSandboxMock ? 'mock' : 'unavailable',
        claimable: {
          amount: claimableAmount,
          token: 'USDC',
          source: includeSandboxMock ? 'mock' : 'unavailable',
        },
```

```ts
        netApy: includeSandboxMock ? '0.0425' : '0',
        netApySource: includeSandboxMock ? 'mock' : 'unavailable',
```

Change `claimableAmount`:

```ts
    const claimableAmount = includeSandboxMock ? sumClaimables(claimableItems) : '0';
```

- [ ] **Step 4: Adjust `dataQuality` to separate sandbox mocks from DB fallback mocks**

Replace `dataQuality` helper with signature:

```ts
function dataQuality(
  mockEnabled: boolean,
  recentActivitiesSource: PortfolioDataSource = mockEnabled ? 'mock' : 'unavailable',
): PortfolioDataQualityDto {
```

Keep existing body but ensure `mockedSections` only includes money-like mock sections when `mockEnabled === true`.

In `getPortfolio`, pass:

```ts
      dataQuality: dataQuality(includeSandboxMock, recentActivitiesSource),
```

Reason: `PORTFOLIO_MOCK_FALLBACK` should not make money-like aggregates look available.

- [ ] **Step 5: Run portfolio tests**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts
```

Expected: PASS. If existing tests expect `placeholder`, update them to `unavailable` because this is intended FE-visible behavior change.

- [ ] **Step 6: Update API docs for overview**

Add after portfolio paragraph in `docs/canonical/api-contract.md`:

```md
Overview financial aggregates that lack a live projection return zero values with `source = "unavailable"`; they must not return mock values unless `includeMock=true` is explicitly supplied for FE sandbox testing.
```

- [ ] **Step 7: Commit Task 3**

```bash
git add backend/src/modules/portfolio/portfolio.service.ts backend/src/modules/portfolio/portfolio.service.spec.ts docs/canonical/api-contract.md
git commit -m "fix: label unavailable portfolio aggregates"
```

---

## Task 4: Market Charts Remove Mock `yield` And `utilization`

**Files:**
- Modify: `backend/src/modules/market-state/market-state.service.ts`
- Test: `backend/src/modules/market-state/market-state.service.spec.ts`
- Docs: `docs/canonical/api-contract.md`

- [ ] **Step 1: Add failing tests for non-mock yield/utilization charts**

Add tests:

```ts
  it('returns unavailable empty yield chart instead of mock fixtures', async () => {
    const { service } = await createService(LIVE_MARKET, []);

    const chart = await service.getChart(LIVE_MARKET.address, 'yield', '30d');

    expect(chart).toMatchObject({
      market: LIVE_MARKET.address,
      metric: 'yield',
      range: '30d',
      headline: {
        label: 'Yield',
        value: '0',
        source: 'unavailable',
      },
      series: [],
      dataQuality: {
        sources: {
          series: 'unavailable',
        },
      },
    });
  });

  it('returns unavailable empty utilization chart instead of mock fixtures', async () => {
    const { service } = await createService(LIVE_MARKET, []);

    const chart = await service.getChart(LIVE_MARKET.address, 'utilization', '30d');

    expect(chart.headline.source).toBe('unavailable');
    expect(chart.series).toEqual([]);
    expect(chart.dataQuality.sources.series).toBe('unavailable');
  });
```

- [ ] **Step 2: Run failing market-state tests**

```bash
pnpm test src/modules/market-state/market-state.service.spec.ts
```

Expected: FAIL because current code returns mock series.

- [ ] **Step 3: Replace mock branch with unavailable branch**

In `getChart`, replace lines using `chartTimestamps()` and `fixture.values` for non-indexed metrics with:

```ts
    return {
      market: live.address,
      metric,
      range,
      headline: {
        label: fixture.label,
        value: '0',
        unit: fixture.unit,
        source: 'unavailable',
      },
      series: [],
      dataQuality: {
        sources: {
          series: 'unavailable',
        },
      },
    };
```

Then remove `chartTimestamps()` if unused.

Reason: no live yield/APY or utilization projection exists. Empty unavailable is safer than fake series.

- [ ] **Step 4: Run market-state tests**

```bash
pnpm test src/modules/market-state/market-state.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Update API docs for charts**

Replace existing chart note around `docs/canonical/api-contract.md:61` with:

```md
For `/markets/:address/charts`, `tvl`, `tokenPrice`, and `ratio` are backed by indexed `market_snapshots` and use `dataQuality.sources.series = "indexed_events"`. `tvl` maps to snapshot `nav`, `tokenPrice` maps to `ytPrice`, and `ratio` maps to semantic `stJtRatio`. If no snapshots exist, indexed metrics return an empty series. `yield` and `utilization` return empty series with `dataQuality.sources.series = "unavailable"` until dedicated projections exist; they must not return mock fixtures in live mode.
```

- [ ] **Step 6: Commit Task 4**

```bash
git add backend/src/modules/market-state/market-state.service.ts backend/src/modules/market-state/market-state.service.spec.ts docs/canonical/api-contract.md
git commit -m "fix: remove mock market charts"
```

---

## Task 5: Withdraw Quote Non-Placeholder Output

**Files:**
- Modify: `backend/src/modules/quotes/quotes.service.ts`
- Test: `backend/src/modules/quotes/quotes.service.spec.ts`
- Docs: `docs/canonical/api-contract.md`

- [ ] **Step 1: Add failing test for derived non-placeholder withdraw output**

Add test:

```ts
  it('quotes withdraw-yt with derived non-placeholder output', async () => {
    const { service } = await createService();

    const quote = await service.quoteWithdrawYt({
      market: LIVE_MARKET.address,
      tranche: 'senior',
      mode: 'assets',
      amount: '1000000000000000000',
      receiver: '0x00000000000000000000000000000000000000e1',
    });

    expect(quote.output).toEqual({
      token: LIVE_MARKET.ytTokenAddress,
      amount: '1000000000000000000',
      estimateType: 'derived',
    });
    expect(quote.dataQuality.sources.output).toBe('derived');
    expect(quote.availability).toEqual({
      available: true,
      reason: null,
    });
  });
```

- [ ] **Step 2: Add failing test for shares mode label**

```ts
  it('quotes withdraw-yt shares mode as derived identity until tranche previewRedeem simulation exists', async () => {
    const { service } = await createService();

    const quote = await service.quoteWithdrawYt({
      market: LIVE_MARKET.address,
      tranche: 'junior',
      mode: 'shares',
      amount: '500000000000000000',
      receiver: '0x00000000000000000000000000000000000000e1',
    });

    expect(quote.output).toEqual({
      token: LIVE_MARKET.ytTokenAddress,
      amount: '500000000000000000',
      estimateType: 'derived_identity',
    });
    expect(quote.dataQuality.sources.output).toBe('derived_identity');
  });
```

- [ ] **Step 3: Run failing quotes tests**

```bash
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected: FAIL because current output is `placeholder`.

- [ ] **Step 4: Implement derived output labels**

In `quoteWithdrawYt`, after `unavailableReason` calculation, add:

```ts
    const outputEstimateType = mode === 'assets' ? 'derived' : 'derived_identity';
```

Change output:

```ts
      output: {
        token: live.ytTokenAddress,
        amount,
        estimateType: outputEstimateType,
      },
```

Change dataQuality:

```ts
          output: outputEstimateType,
```

Reason: Market `withdraw(fromSenior, byShares, amount, receiver)` supports assets mode directly. Shares mode still lacks live `previewRedeem`; label it as identity-derived, not placeholder.

- [ ] **Step 5: Run quotes tests**

```bash
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Update API docs for withdraw quote**

In quote section, replace text saying placeholder output with:

```md
`POST /quotes/withdraw-yt` returns `output.estimateType = "derived"` for `mode = "assets"`. For `mode = "shares"`, it returns `output.estimateType = "derived_identity"` until tranche `previewRedeem` simulation is wired; FE must treat this as preflight only.
```

- [ ] **Step 7: Commit Task 5**

```bash
git add backend/src/modules/quotes/quotes.service.ts backend/src/modules/quotes/quotes.service.spec.ts docs/canonical/api-contract.md
git commit -m "fix: remove placeholder withdraw quotes"
```

---

## Task 6: Cross-Endpoint Verification And Docs Sync

**Files:**
- Check: `docs/canonical/backend-architecture.md`
- Check: `backend/docs/architecture.md`
- Check: `docs/canonical/api-contract.md`
- Check: `backend/docs/plans/README.md`

- [ ] **Step 1: Run targeted tests**

```bash
pnpm test src/modules/portfolio/portfolio.service.spec.ts src/modules/market-state/market-state.service.spec.ts src/modules/quotes/quotes.service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run full backend tests**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: PASS.

- [ ] **Step 4: Run build/typecheck**

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Architecture docs check**

Read:

```text
docs/canonical/backend-architecture.md
backend/docs/architecture.md
```

Expected result: no module boundary, dependency graph, runtime flow, infrastructure, or data ownership changes. Record in final report:

```text
Architecture docs checked; no update needed
```

If Task 5 adds a new `ContractReaderService.previewRedeem` RPC read, update both architecture docs to mention quote service now uses live tranche preview for withdraw quotes.

- [ ] **Step 6: API impact summary for FE**

Use this exact classification in final handoff:

```md
API impact for FE: API data-source/behavior change.
- `/portfolio/:address/earnings`: default live mode now returns empty/unavailable instead of mock earnings/history.
- `/portfolio/:address/claimables`: default live mode now returns empty list instead of mock claim rows.
- `/portfolio/:address`: money-like aggregates now use source `unavailable` unless `includeMock=true`; no default mock claimable preview.
- `/markets/:address/charts?metric=yield|utilization`: now empty/unavailable instead of mock series.
- `/quotes/withdraw-yt`: output source no longer `placeholder`; uses derived labels.
FE action needed: review empty states and source-label copy.
```

- [ ] **Step 7: Final commit**

```bash
git add docs/canonical/api-contract.md backend/src/modules/portfolio/portfolio.service.ts backend/src/modules/portfolio/portfolio.service.spec.ts backend/src/modules/market-state/market-state.service.ts backend/src/modules/market-state/market-state.service.spec.ts backend/src/modules/quotes/quotes.service.ts backend/src/modules/quotes/quotes.service.spec.ts
git commit -m "docs: record live data cutover behavior"
```

Skip commit if no files changed since Task 5.

---

## Self-Review / Counter-Arguments

### Counter-argument 1: Empty data is not live data

Correct. For earnings, claimables, yield, and utilization, current backend lacks source-of-truth projections. Returning empty/unavailable is the safest live behavior because it removes fake values and prevents FE/user confusion. Real live data requires later projection tasks: cost basis, earnings accrual, claim/refund ledger, and utilization formula.

### Counter-argument 2: Keep env `PORTFOLIO_MOCK_FALLBACK=true` for demos

Keep `includeMock=true` for explicit sandbox demos. Do not allow env fallback to populate money-like user data in default endpoint behavior. If product insists on env fallback, constrain it to non-money activity/request rows only and label all rows `source: 'mock'`.

### Counter-argument 3: Withdraw shares mode identity is still not exact

Yes. `derived_identity` is deliberately weaker than `derived`. Best future fix: add `ContractReaderService.previewWithdrawYt` or tranche `previewRedeem` call and label `simulated_onchain`/`live_contract`. Current plan improves honesty without expanding RPC surface.

### Counter-argument 4: Chart utilization may be derivable from `navSt/navJt`

Maybe, but formula is product-specific. Current canonical docs only define caps and ratios, not utilization. Do not invent formula. Return unavailable until canonical formula exists.

### Counter-argument 5: Docs may claim mock still available

Update `docs/canonical/api-contract.md` in same PR. This is FE-visible behavior change, but not shape change. Also mention empty states in FE handoff.

## Best Plan Decision

Chosen approach: **truthful live/empty cutover now, projection work later**.

Why best:

- Removes misleading user-facing fake money data immediately.
- Keeps endpoint shapes stable for FE.
- Requires no schema migration.
- Limits risk to service logic and tests.
- Leaves clear source labels for future live projections.

## Completion Format Required

Final implementation report must include:

- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
