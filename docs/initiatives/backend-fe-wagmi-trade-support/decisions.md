# Decisions — Backend FE Wagmi Trade Support

## Accepted decisions

1. FE submits transactions with wagmi; backend never signs, holds keys, or returns mandatory calldata.
2. `GET /tx/:hash` uses indexed `market_events` only in first implementation; no RPC receipt fallback.
3. `deposit-base` first implementation focuses instant `depositInstant`; async request orchestration remains out of scope.
4. Direct YT deposit and withdraw quotes must label estimates as derived from current indexed/live state, not execution guarantees.

## Proposed decisions

1. Add ordered args array alongside args object only if frontend requests it during implementation.

## Rejected decisions

1. Backend transaction submission.
2. Base-token sell/withdraw MVP path.
