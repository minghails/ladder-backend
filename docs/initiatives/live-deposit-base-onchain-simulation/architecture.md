# Architecture — Live Deposit-Base Onchain Simulation

## Existing architecture used

This initiative extends existing backend modules:

```text
QuotesModule
  -> QuotesService
    -> ContractReaderService
      -> ViemClientService
        -> Base Sepolia RPC
```

No new NestJS module is planned.

## Runtime flow

1. FE calls `POST /quotes/deposit-base` with market, tranche, amount, sender, optional receiver, minYtOut, referrerId.
2. `QuotesService` reads live market state through `ContractReaderService.getMarketState()`.
3. If halted, instant disabled, capacity exceeded, or sender missing, service returns unavailable without simulation.
4. If preflight allows, `QuotesService` calls `ContractReaderService.simulateDepositBaseInstant(...)`.
5. `ContractReaderService` uses viem `simulateContract` with Market ABI and `account = sender`.
6. On success, service returns `estimateType = simulated_onchain` with returned YT and tranche preview shares.
7. On revert, service returns `estimateType = simulation_reverted`, `availability.available = false`, and mapped reason.

## Boundaries

- Backend provides quote/read-model support only.
- Frontend remains transaction submitter through wallet/wagmi.
- Deployed contracts and operator-supplied ABIs remain execution truth.
- Backend must not return mandatory calldata, sign, submit, or store keys.

## Docs sync expectation

Implementation changes API request/response semantics and runtime quote source. Update:

- `docs/canonical/api-contract.md`
- `docs/canonical/integration-rules.md`

If implementation stays within existing module boundaries, record `Architecture docs checked; no update needed` for root/backend architecture docs.
