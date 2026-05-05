# Live Deposit-Base Onchain Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `POST /quotes/deposit-base` return exact current-block on-chain simulation output for `Market.depositInstant(...)` so FE can display `you will get` from live contract execution.

**Architecture:** Extend the existing quotes path without adding a new module. `QuotesService` asks `ContractReaderService` to simulate the deployed Market call through viem `simulateContract`; the backend still returns action hints only and never signs, submits, stores private keys, or returns mandatory calldata. Request `sender` becomes required for the exact simulation path so `eth_call` uses realistic `msg.sender`; `receiver` defaults to `sender`.

**Tech Stack:** NestJS, TypeScript, viem, operator-supplied Market ABI, Vitest, Swagger DTOs, canonical backend docs.

---

## Source design

This plan implements the approved design formerly drafted at `docs/superpowers/specs/2026-05-05-live-deposit-base-onchain-simulation-design.md`. The canonical backend-plan copy lives here to follow `backend/docs/HANDOFF.md` plan/initiative conventions.

## File structure

### Modify

- `backend/src/shared/blockchain/contract-reader.service.ts`
  - Add deposit-base instant simulation input/result types.
  - Add `simulateDepositBaseInstant(...)` using viem `client.simulateContract` and `MARKET_ABI`.
  - Add lightweight revert reason mapping.
- `backend/src/modules/quotes/quotes.service.ts`
  - Add `sender` to `DepositBaseQuoteRequest`.
  - Default `receiver` to `sender`.
  - Call simulation after live market/capability checks.
  - Return `estimateType = simulated_onchain` on success and `simulation_reverted` on revert.
- `backend/src/modules/quotes/quotes.service.spec.ts`
  - Add RED/GREEN tests for simulation success, receiver default, and revert mapping.
- `backend/src/modules/quotes/dto/quote-swagger.dto.ts`
  - Document `sender` and simulation estimate types.
- `backend/src/swagger.fe-api.spec.ts`
  - Assert Swagger docs expose `sender` and exact-simulation/no-calldata semantics.
- `docs/canonical/api-contract.md`
  - Update `POST /quotes/deposit-base` request/response docs.
- `docs/canonical/integration-rules.md`
  - Document exact current-block simulation semantics and limits.
- `backend/docs/initiatives/backend-fe-wagmi-trade-support/tracker.md`
  - Reopen/add bounded follow-up slice.
- `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md`
  - Point next agent at this slice/session.

### Create

- `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-live-deposit-base-simulation.md`
  - Session handoff, TDD record, API impact, verification, architecture-doc sync note.

### Delete

- `docs/superpowers/specs/2026-05-05-live-deposit-base-onchain-simulation-design.md`
  - Removed because backend plans must live under `backend/docs` for this project.

## Task 1: Contract simulation service

**Files:**
- Modify: `backend/src/shared/blockchain/contract-reader.service.ts`
- Test: `backend/src/modules/quotes/quotes.service.spec.ts`

- [ ] **Step 1: Write failing quotes service test for simulated deposit-base success**

Add this test setup change in `backend/src/modules/quotes/quotes.service.spec.ts` inside `createService` mock value:

```ts
simulateDepositBaseInstant: vi.fn().mockResolvedValue({
  ok: true,
  ytOut: '998000000000000000',
}),
```

Add test:

```ts
it('uses onchain simulation for deposit-base quotes when sender is supplied', async () => {
  const { service, contractReader } = await createService();

  const quote = await service.quoteDepositBase({
    market: LIVE_MARKET.address,
    tranche: 'junior',
    amount: '1000000',
    sender: '0x00000000000000000000000000000000000000aa',
    minYtOut: '900000000000000000',
  });

  expect(contractReader.simulateDepositBaseInstant).toHaveBeenCalledWith({
    market: LIVE_MARKET.address,
    asSenior: false,
    tokenIn: LIVE_MARKET.baseTokenAddress,
    amountIn: '1000000',
    minYtOut: '900000000000000000',
    receiver: '0x00000000000000000000000000000000000000aa',
    referrerId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    sender: '0x00000000000000000000000000000000000000aa',
    trancheToken: LIVE_MARKET.juniorTrancheAddress,
  });
  expect(quote.estimate).toMatchObject({
    estimatedYtOut: '998000000000000000',
    sharesOut: '998000000000000000',
    estimateType: 'simulated_onchain',
  });
  expect(quote.dataQuality.sources.estimate).toBe('simulated_onchain');
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected: FAIL because `sender` is not part of `DepositBaseQuoteRequest` and `quoteDepositBase` does not call `simulateDepositBaseInstant`.

- [ ] **Step 3: Add simulation types and service method**

In `backend/src/shared/blockchain/contract-reader.service.ts`, import `MARKET_ABI` already exists. Add types after `LivePortfolioPosition`:

```ts
export interface SimulateDepositBaseInstantInput {
  market: string;
  asSenior: boolean;
  tokenIn: string;
  amountIn: string;
  minYtOut: string;
  receiver: string;
  referrerId: string;
  sender: string;
  trancheToken: string;
}

export type SimulateDepositBaseInstantResult =
  | { ok: true; ytOut: string; sharesOut: string }
  | { ok: false; reason: string; errorName: string | null };
```

Add helper before `@Injectable()`:

```ts
function mapSimulationRevertReason(error: unknown): { reason: string; errorName: string | null } {
  const candidate = error as { shortMessage?: string; details?: string; data?: { errorName?: string }; cause?: { data?: { errorName?: string } } };
  const errorName = candidate.data?.errorName ?? candidate.cause?.data?.errorName ?? null;
  const message = `${candidate.shortMessage ?? ''} ${candidate.details ?? ''}`;

  if (errorName === 'MarketHalted' || message.includes('halted')) {
    return { reason: 'MARKET_HALTED', errorName };
  }

  if (errorName === 'StJtRatioTooHigh' || message.includes('StJtRatioTooHigh')) {
    return { reason: 'SENIOR_CAPACITY_EXCEEDED', errorName };
  }

  if (errorName === 'RequestMinYtOutNotMet' || message.includes('minReceive') || message.includes('minYtOut')) {
    return { reason: 'MIN_YT_OUT_NOT_MET', errorName };
  }

  if (message.includes('allowance') || message.includes('balance') || message.includes('transfer amount exceeds')) {
    return { reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE', errorName };
  }

  return { reason: 'SIMULATION_REVERTED', errorName };
}
```

Add method inside `ContractReaderService` before `getPortfolioPositions`:

```ts
async simulateDepositBaseInstant(input: SimulateDepositBaseInstantInput): Promise<SimulateDepositBaseInstantResult> {
  const client = this.viem.getPublicClient();

  try {
    const { result } = await client.simulateContract({
      address: input.market as Address,
      abi: MARKET_ABI,
      functionName: 'depositInstant',
      args: [
        input.asSenior,
        input.tokenIn as Address,
        BigInt(input.amountIn),
        BigInt(input.minYtOut),
        input.receiver as Address,
        input.referrerId as `0x${string}`,
      ],
      account: input.sender as Address,
    });

    const ytOut = result.toString();
    const shares = await client.readContract({
      address: input.trancheToken as Address,
      abi: input.asSenior ? ST_TRANCHE_ABI : JT_TRANCHE_ABI,
      functionName: 'previewDeposit',
      args: [BigInt(ytOut)],
    });

    return { ok: true, ytOut, sharesOut: shares.toString() };
  } catch (error) {
    return { ok: false, ...mapSimulationRevertReason(error) };
  }
}
```

- [ ] **Step 4: Run test to verify it still fails for quotes integration**

Run:

```bash
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected: FAIL because `quoteDepositBase` does not use the new simulation method yet.

## Task 2: Quotes service integration

**Files:**
- Modify: `backend/src/modules/quotes/quotes.service.ts`
- Test: `backend/src/modules/quotes/quotes.service.spec.ts`

- [ ] **Step 1: Update request type and quote logic**

In `DepositBaseQuoteRequest`, add:

```ts
sender?: string;
```

In `quoteDepositBase`, replace receiver default and estimate block with simulation-aware logic:

```ts
const sender = request.sender ?? '0x0000000000000000000000000000000000000000';
const minYtOut = request.minYtOut ?? '0';
const receiver = request.receiver ?? sender;
const referrerId = request.referrerId ?? '0x0000000000000000000000000000000000000000000000000000000000000000';
const token = trancheToken(live, request.tranche);
```

After `unavailableReason`, add:

```ts
const missingSender = isZeroAddress(sender);
const baseUnavailableReason = unavailableReason ?? (missingSender ? 'SENDER_REQUIRED' : null);
const simulation = baseUnavailableReason
  ? null
  : await this.contractReader.simulateDepositBaseInstant({
      market: live.address,
      asSenior: request.tranche === 'senior',
      tokenIn: live.baseTokenAddress,
      amountIn: request.amount,
      minYtOut,
      receiver,
      referrerId,
      sender,
      trancheToken: token,
    });
const simulationReason = simulation?.ok === false ? simulation.reason : null;
const finalUnavailableReason = baseUnavailableReason ?? simulationReason;

if (missingSender) {
  warnings.push('SENDER_REQUIRED');
}

if (simulation?.ok === false) {
  warnings.push(simulation.reason);
}
```

Change estimate to:

```ts
estimate: {
  estimatedYtOut: simulation?.ok === true ? simulation.ytOut : null,
  minYtOut,
  sharesOut: simulation?.ok === true ? simulation.sharesOut : null,
  estimateType: simulation?.ok === true ? 'simulated_onchain' : simulation?.ok === false ? 'simulation_reverted' : 'unavailable',
},
```

Change availability to:

```ts
availability: {
  available: finalUnavailableReason === null,
  reason: finalUnavailableReason,
},
```

Change data quality estimate source to:

```ts
estimate: simulation?.ok === true ? 'simulated_onchain' : simulation?.ok === false ? 'simulation_reverted' : 'unavailable',
```

- [ ] **Step 2: Run test to verify GREEN**

Run:

```bash
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected: PASS for existing tests plus new simulation success test.

- [ ] **Step 3: Add failing revert mapping test**

Add test:

```ts
it('marks deposit-base unavailable when onchain simulation reverts', async () => {
  const { service, contractReader } = await createService();
  contractReader.simulateDepositBaseInstant.mockResolvedValueOnce({
    ok: false,
    reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
    errorName: null,
  });

  const quote = await service.quoteDepositBase({
    market: LIVE_MARKET.address,
    tranche: 'junior',
    amount: '1000000',
    sender: '0x00000000000000000000000000000000000000aa',
  });

  expect(quote.availability).toEqual({
    available: false,
    reason: 'INSUFFICIENT_ALLOWANCE_OR_BALANCE',
  });
  expect(quote.estimate).toMatchObject({
    estimatedYtOut: null,
    sharesOut: null,
    estimateType: 'simulation_reverted',
  });
  expect(quote.warnings).toEqual(expect.arrayContaining(['INSUFFICIENT_ALLOWANCE_OR_BALANCE']));
  expect(quote.dataQuality.sources.estimate).toBe('simulation_reverted');
});
```

- [ ] **Step 4: Run test to verify RED/GREEN**

Run:

```bash
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected: PASS if implementation already covers revert. If it fails, update `quoteDepositBase` only until this test passes.

- [ ] **Step 5: Add missing-sender test**

Add test:

```ts
it('requires sender for exact deposit-base simulation', async () => {
  const { service, contractReader } = await createService();

  const quote = await service.quoteDepositBase({
    market: LIVE_MARKET.address,
    tranche: 'junior',
    amount: '1000000',
  });

  expect(contractReader.simulateDepositBaseInstant).not.toHaveBeenCalled();
  expect(quote.availability).toEqual({
    available: false,
    reason: 'SENDER_REQUIRED',
  });
  expect(quote.estimate.estimateType).toBe('unavailable');
  expect(quote.warnings).toEqual(expect.arrayContaining(['SENDER_REQUIRED']));
});
```

- [ ] **Step 6: Run test to verify GREEN**

Run:

```bash
pnpm test src/modules/quotes/quotes.service.spec.ts
```

Expected: PASS.

## Task 3: Swagger and API contract docs

**Files:**
- Modify: `backend/src/modules/quotes/dto/quote-swagger.dto.ts`
- Modify: `backend/src/swagger.fe-api.spec.ts`
- Modify: `docs/canonical/api-contract.md`
- Modify: `docs/canonical/integration-rules.md`

- [ ] **Step 1: Write failing Swagger/doc test**

In `backend/src/swagger.fe-api.spec.ts`, extend `documents quote endpoints as action hints without calldata`:

```ts
const depositBaseRequestSchema = document.components?.schemas?.DepositBaseQuoteRequestDto as SchemaObject | undefined;
const senderProperty = depositBaseRequestSchema?.properties?.sender as SchemaObject | undefined;
expect(senderProperty?.description).toContain('wallet address used as eth_call sender');

const apiContract = readCanonicalDoc('docs/canonical/api-contract.md');
expect(apiContract).toContain('estimateType = "simulated_onchain"');
expect(apiContract).toContain('sender is required for exact current-block simulation');
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
pnpm test src/swagger.fe-api.spec.ts
```

Expected: FAIL because Swagger/API docs do not document `sender` and `simulated_onchain` yet.

- [ ] **Step 3: Update Swagger DTO**

In `backend/src/modules/quotes/dto/quote-swagger.dto.ts`, add optional sender property to deposit-base request DTO:

```ts
@ApiPropertyOptional({
  description: 'Wallet address used as eth_call sender for exact current-block depositInstant simulation.',
  example: '0x00000000000000000000000000000000000000aa',
})
sender?: string;
```

Update estimate DTO descriptions/examples so `estimateType` includes `simulated_onchain`, `simulation_reverted`, and `unavailable`.

- [ ] **Step 4: Update canonical API docs**

In `docs/canonical/api-contract.md`, replace the old deposit-base paragraph with:

```md
`POST /quotes/deposit-base` accepts optional `minYtOut`, `receiver`, and `referrerId`, and requires `sender` for exact current-block simulation. `sender` is the wallet address used as the `eth_call` account for `Market.depositInstant(...)`; if `receiver` is omitted, the backend uses `sender`.

When simulation succeeds, it returns `estimate.estimateType = "simulated_onchain"`, `estimate.estimatedYtOut` from the Market return value, `estimate.sharesOut` from the selected tranche `previewDeposit(estimatedYtOut)`, `action.method = "depositInstant"`, `action.contract = market`, `action.args` (`asSenior`, `tokenIn`, `amountIn`, `minYtOut`, `receiver`, `referrerId`), and `action.approval` where `token = baseToken`, `spender = market`, and `amount = amountIn`.

When simulation reverts, the endpoint keeps the quote response shape with `availability.available = false`, `estimate.estimateType = "simulation_reverted"`, and a reason such as `MIN_YT_OUT_NOT_MET`, `INSUFFICIENT_ALLOWANCE_OR_BALANCE`, or `SIMULATION_REVERTED`. This quote is exact for the current block only; mined transactions can still differ if state changes.
```

- [ ] **Step 5: Update integration rules**

In `docs/canonical/integration-rules.md`, under `## FE wagmi transaction flow`, add:

```md
- `POST /quotes/deposit-base` uses current-block `eth_call` simulation of `Market.depositInstant(...)` when `sender` is supplied. FE should treat `simulated_onchain` as exact for the current block, not as a guarantee for future mined state.
- If simulation returns `INSUFFICIENT_ALLOWANCE_OR_BALANCE`, FE should prompt approval/funding and re-quote after state changes.
```

- [ ] **Step 6: Run Swagger/doc test to verify GREEN**

Run:

```bash
pnpm test src/swagger.fe-api.spec.ts
```

Expected: PASS.

## Task 4: Initiative handoff and verification

**Files:**
- Modify: `backend/docs/initiatives/backend-fe-wagmi-trade-support/tracker.md`
- Modify: `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md`
- Create: `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-live-deposit-base-simulation.md`

- [ ] **Step 1: Update tracker**

Set active slice:

```md
## Active

- Epic: Follow-up — Live deposit-base onchain simulation
- Slice: Live deposit-base current-block simulation
- Session kickoff: `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md`
- Latest session: `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-live-deposit-base-simulation.md`
```

Add `Recently Updated` entry:

```md
- 2026-05-05: Follow-up slice started for exact current-block `POST /quotes/deposit-base` simulation using `Market.depositInstant(...)` via viem `eth_call`. API impact: `API contract change` because request adds `sender` for exact simulation and estimate source changes from placeholder to simulated onchain when available.
```

- [ ] **Step 2: Write session log**

Create `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/2026-05-05-live-deposit-base-simulation.md` with:

```md
# Session — Live Deposit-Base Onchain Simulation

Date: 2026-05-05

## Scope

Implement exact current-block on-chain simulation for `POST /quotes/deposit-base` using `Market.depositInstant(...)` via viem `eth_call`.

## TDD record

RED/GREEN records will be filled during implementation.

## API impact for FE

`API contract change`.

- `POST /quotes/deposit-base` request adds `sender` for exact current-block simulation.
- Successful estimates use `estimateType = "simulated_onchain"`.
- Reverted simulations use `estimateType = "simulation_reverted"` and `availability.available = false`.

## Architecture docs

Pending architecture doc sync check.

## Verification

Pending.

## Remaining risks

- Simulation is exact only for current block.
- Allowance/balance failures can make quote unavailable until FE approval/funding is complete.

## Next step

Run TDD implementation for simulation service and quote response.
```

- [ ] **Step 3: Update kickoff prompt**

Point `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md` to the new active slice and latest session log.

- [ ] **Step 4: Run full verification**

Run:

```bash
pnpm test
pnpm lint
pnpm build
```

Expected: all pass.

- [ ] **Step 5: Run Docker DB migration smoke**

Run:

```bash
cd backend/docker && docker compose up -d postgres
cd .. && set -a; source .env; set +a; pnpm db:migrate
```

Expected: migrations applied successfully.

- [ ] **Step 6: Run deposit-base API smoke**

With backend running, call:

```bash
curl -s -H 'content-type: application/json' \
  -d '{"market":"0x3aDa769dC813e3376fCD40d05bEA12263048A487","tranche":"junior","amount":"1000000","sender":"0x00000000000000000000000000000000000000aa"}' \
  http://127.0.0.1:3000/quotes/deposit-base
```

Expected: HTTP 201 with either `estimate.estimateType = "simulated_onchain"` or `estimate.estimateType = "simulation_reverted"`; response must not include calldata.

- [ ] **Step 7: Architecture doc sync**

Check whether these changes alter module boundaries, dependency graph, runtime flow, infrastructure choice, data ownership, API/schema/event behavior, or source-of-truth assumptions:

- API request/response semantics changed, so update `docs/canonical/api-contract.md` in Task 3.
- Runtime flow changes from placeholder estimate to onchain simulation; update `docs/canonical/integration-rules.md` in Task 3.
- No new module boundary if only extending `ContractReaderService`; record `Architecture docs checked; no update needed` unless implementation adds a module.

- [ ] **Step 8: Complete session log**

Update session log with:

- Files changed.
- RED/GREEN TDD commands and results.
- API impact summary for FE.
- Verification commands and outputs.
- Architecture docs checked note.
- Remaining risks.
- Next step.

## Self-review

- Spec coverage: all approved design requirements map to tasks: viem simulation, sender requirement, receiver default, revert mapping, no calldata/signing, Swagger/API docs, integration docs, tracker/session, verification.
- Placeholder scan: no `TBD`, no unresolved implementation placeholders, no deferred edge cases without explicit behavior.
- Type consistency: `simulateDepositBaseInstant`, `sender`, `estimatedYtOut`, `sharesOut`, `simulated_onchain`, `simulation_reverted`, and `unavailable` are consistent across tasks.
