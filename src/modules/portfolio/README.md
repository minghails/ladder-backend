# Portfolio

User balances, pending requests, and activity views.

## API endpoints (from `docs/canonical/api-contract.md`)
- `GET /portfolio/:address` — user balances + pending requests
- `GET /portfolio/:address/requests` — request history from indexed deposit events

## Dependencies
- `chain-projector` — indexed events for request history
- `shared/database` — portfolio_positions table
- `shared/blockchain` — live balance reads
