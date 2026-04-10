# Admin Ops

HTTP layer for all admin operations. Injects headless domain services (oracle, risk-monitoring) for price updates and risk alerts.

## API endpoints (from `docs/canonical/api-contract.md`)
- `GET /admin/markets/:address/health`
- `GET /admin/markets/:address/deposit-requests`
- `POST /admin/markets/:address/trigger-update-from-adaptor`
- `POST /admin/markets/:address/price-updates`
- `POST /admin/markets/:address/deposit-requests/:id/reject`
- `POST /admin/markets/:address/collect-fees`
- `GET /admin/actions`
- `GET /admin/risk-alerts`
- `POST /admin/risk-alerts/:id/ack`

## Dependencies
- `oracle` — price update logic
- `risk-monitoring` — risk alert data
- `deposit-requests` — request lifecycle
- `market-state` — market health data
