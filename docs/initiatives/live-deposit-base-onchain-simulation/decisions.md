# Decisions — Live Deposit-Base Onchain Simulation

## D1 — Use Market simulation, not adaptor-only quote

Decision: use viem `simulateContract`/`eth_call` against `Market.depositInstant(...)`.

Reason: FE needs exact current on-chain behavior for the user-facing transaction path, including Market checks, adaptor checks, allowance/balance effects, min output, and ratio constraints.

## D2 — Require sender for exact simulation

Decision: `sender` is required for exact simulation semantics.

Reason: `eth_call` must use realistic `msg.sender`; otherwise allowance/balance and receiver defaults can be misleading.

## D3 — Backend still no calldata/signing

Decision: response continues to provide action hints only.

Reason: frontend must submit wallet transactions through wagmi and operator-supplied ABI. Backend remains read/preflight service.

## D4 — Current-block exact, not mining guarantee

Decision: docs must state simulation is exact for current block only.

Reason: chain state can change before transaction mines.
