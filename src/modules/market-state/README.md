# Market State

Builds current market snapshots from contract reads and indexed events. Serves public market endpoints.

## API endpoints (from `docs/canonical/api-contract.md`)
- `GET /markets` — list markets
- `GET /markets/:address` — market detail
- `GET /markets/:address/history` — historical snapshots
- `GET /markets/:address/deposit-limits` — deposit capacity
- `GET /markets/:address/price-status` — price freshness

## Dependencies
- `chain-projector` — indexed events
- `shared/database` — market_snapshots, markets tables
- `shared/blockchain` — live contract reads
