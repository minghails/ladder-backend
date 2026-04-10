# Quotes

Preflight reads and simulations for deposit/withdraw flows.

## API endpoints (from `docs/canonical/api-contract.md`)
- `POST /quotes/deposit-yt` — preview direct YT deposit
- `POST /quotes/withdraw-yt` — preview direct YT withdraw
- `POST /quotes/deposit-base` — preview async base deposit

## Dependencies
- `market-state` — current NAV, ratio, halt status
- `shared/blockchain` — contract reads for simulation
