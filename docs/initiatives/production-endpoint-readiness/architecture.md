# Production Endpoint Readiness Architecture Notes

## Architecture boundary

This initiative keeps the current NestJS modular monolith. Contracts remain execution truth. Backend serves production-safe read models from live RPC reads and indexed PostgreSQL projections.

## Data ownership

- Contracts own execution state: Market NAV, tranche state, price state, deposit requests, tx events.
- Backend owns projections: market snapshots, APY snapshots if needed, portfolio cashflows/cost basis, production data-quality labels.
- Frontend owns wallet tx submission and wagmi receipt status.

## Locked decisions

- APY source: tranche exchange-rate snapshots using `st.convertToAssets(1e18)` and `jt.convertToAssets(1e18)`.
- APY formula: compound annualized preferred; simple annualized allowed only as MVP fallback if fixed-point exponent is not implemented yet.
- Utilization: unavailable in current MVP because current contracts/ABIs expose no idle/deployed/liquidity source state.
- Admin: skipped until FE/admin surface exists.
