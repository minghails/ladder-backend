# Deposit Requests

Tracks async base deposit lifecycle from request to settlement or refund.

## API endpoints
- `POST /deposit-requests` — register async base deposit request

## State machine (from contract events)
`DepositRequested` → `DepositBasePulled` → `DepositSettled` | `DepositRejected` → `DepositRefunded`

## Dependencies
- `chain-projector` — indexed deposit events
- `shared/database` — deposit_requests table
