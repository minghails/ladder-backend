# Production Endpoint Readiness Decisions

## Accepted

1. **No default production mock data**
   - Default and production endpoint responses must not return mock rows, mock summaries, or fixture chart data.

2. **APY formula**
   - Use ST/JT tranche exchange-rate snapshots: `convertToAssets(1e18)`.
   - Prefer compound annualized APY: `(priceNow / pricePast)^(365 / daysElapsed) - 1`.
   - If compound fixed-point exponent is deferred, MVP may use simple annualized APY: `(priceNow / pricePast - 1) * 365 / daysElapsed`.
   - Fewer than 2 valid points returns `unavailable`.

3. **Utilization**
   - Return `unavailable`.
   - Do not derive utilization from NAV, `totalAssets`, capacity, or request counts.
   - Future utilization requires contract/adaptor source state for idle cash, deployed assets, available liquidity, or equivalent.

4. **Admin**
   - Admin endpoints/signers are out of scope for this initiative.

5. **Tx status**
   - `GET /tx/:hash` remains indexed-event status only; FE uses wagmi receipt for chain tx status.

## Open

- Exact APY snapshot table shape if existing `market_snapshots` cannot hold ST/JT share prices cleanly.
- Whether FE accepts new `dataQuality.sources.apy`/`apySource` fields or prefers existing shape with documented unavailable semantics.
