# Risk Monitoring

Headless domain service for risk detection. No HTTP controller — admin endpoints served by `admin-ops`.

## Responsibility
- Detect stale price conditions
- Monitor leverage ratio approaching limits
- Detect halted market state
- Track async request failures

## Consumed by
- `admin-ops` controller for `GET /admin/risk-alerts` and `POST /admin/risk-alerts/:id/ack`
