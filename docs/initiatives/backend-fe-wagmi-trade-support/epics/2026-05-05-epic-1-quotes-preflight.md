# Epic 1 — Correct and Complete Quote/Preflight Support

## Goal

Make quote endpoints return FE-safe wagmi action and approval hints for direct YT buy, Market withdraw, and base instant buy.

## Files expected

- Modify: `backend/src/modules/quotes/quotes.service.ts`
- Modify: `backend/src/modules/quotes/quotes.controller.ts`
- Modify: `backend/src/modules/quotes/dto/quote-swagger.dto.ts`
- Modify: `backend/src/modules/quotes/quotes.service.spec.ts`

## Slice 1 — Direct YT deposit quote

### Scope

Add `POST /quotes/deposit-yt` and service support for Market `depositYT(bool asSenior,uint256 amount)` preflight.

### Steps

1. Read only current quote files listed above.
2. Add failing tests in `quotes.service.spec.ts` for:
   - junior deposit available when market not halted
   - senior deposit unavailable when derived ST/JT ratio exceeds `maxStJtRatio`
   - senior first deposit unavailable when `navJt = 0`
   - action uses `contract = market`, `method = depositYT`, `approval.token = YT`, `approval.spender = market`
3. Implement derived math:
   - `depositValue = amountYt * latestYtPrice / 1e18`
   - senior: `navStAfter = navSt + depositValue`
   - junior: `navJtAfter = navJt + depositValue`
   - `navAfter = navStAfter + navJtAfter`
   - `stJtRatioAfter = navStAfter * 1e18 / navJtAfter`, guarded when denominator is zero
4. Return availability reasons exactly from plan: `MARKET_HALTED`, `ZERO_AMOUNT`, `SENIOR_CAPACITY_EXCEEDED`, `FIRST_DEPOSIT_MUST_BE_JUNIOR`.
5. Add controller route and Swagger DTO.
6. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` from `backend/`.
7. Update tracker/session log; classify API impact as `API contract change`.

### Acceptance

- Direct YT quote response contains `input`, `estimate`, `availability`, `warnings`, `action`, and `dataQuality` per plan.
- `action.calldataIncluded = false`.
- No backend calldata generation or signing.

## Slice 2 — Correct withdraw quote

### Scope

Correct `POST /quotes/withdraw-yt` to represent Market `withdraw(bool fromSenior,bool byShares,uint256 amount,address receiver)`.

### Steps

1. Add failing tests proving action no longer uses tranche `redeem`.
2. Support request `mode = shares|assets`, `amount`, `receiver`.
3. Preserve old `shares` request by mapping it to `mode = shares` if existing tests/API need compatibility.
4. Return action:
   - `contract = market`
   - `method = withdraw`
   - `args.fromSenior = tranche === senior`
   - `args.byShares = mode === shares`
   - `args.amount = amount`
   - `args.receiver = receiver`
   - approval token = ST for senior or JT for junior
   - approval spender = market
5. Add `ZERO_AMOUNT`, `ZERO_RECEIVER`, `JUNIOR_WITHDRAWAL_CAPACITY_EXCEEDED` checks; add `INSUFFICIENT_SHARES` only if wallet balance read is included.
6. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` from `backend/`.
7. Update tracker/session log; classify API impact as `API contract change`.

### Acceptance

- FE can call Market `withdraw` using returned action object.
- Approval target is Market, not tranche.

## Slice 3 — Upgrade base instant quote hints

### Scope

Make `POST /quotes/deposit-base` return `depositInstant` wagmi hints and honest estimate source labels.

### Steps

1. Add failing tests for base approval target and `depositInstant` args object.
2. Add optional `receiver` and `referrerId` request support.
3. Populate:
   - `action.method = depositInstant`
   - `action.contract = market`
   - `action.args.asSenior`
   - `action.args.tokenIn`
   - `action.args.amountIn`
   - `action.args.minYtOut`
   - `action.args.receiver`
   - `action.args.referrerId`
   - `approval.token = base token`
   - `approval.spender = market`
   - `approval.amount = amountIn`
4. Add `estimate.minYtOut`, `estimate.estimatedYtOut`, `estimate.sharesOut` where available.
5. If exact adaptor quote is unavailable, mark source as `placeholder` or `derived_from_latestYtPrice`; do not imply guaranteed executable quote.
6. Return `DEPOSIT_BASE_INSTANT_UNAVAILABLE` when instant adaptor path is disabled if current state exposes that flag.
7. Run `pnpm test src/modules/quotes/quotes.service.spec.ts` from `backend/`.
8. Update tracker/session log; classify API impact as `API contract change`.

## Epic done criteria

- All quote tests pass.
- API docs impact noted for Epic 4.
- Architecture docs checked; update only if module boundaries or API docs require it.
