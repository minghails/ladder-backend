# Oracle

Headless domain service for price updates. No HTTP controller — admin endpoints are served by `admin-ops`.

## Responsibility
- Store raw price reports to `price_reports_raw`
- Manage safe adaptor and manual price update flows
- Check price freshness and staleness

## Consumed by
- `admin-ops` controller for `POST /admin/markets/:address/trigger-update-from-adaptor` and `POST /admin/markets/:address/price-updates`
- `market-state` for price freshness in `GET /markets/:address/price-status`
