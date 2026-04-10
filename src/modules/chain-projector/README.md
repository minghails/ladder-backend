# Chain Projector

Indexes contract events from Market.sol, maintains projector cursors, handles replay and reorg recovery.

## Responsibility
- Listen to / poll for on-chain events (Data Plane)
- Maintain `projector_cursors` for reliable indexing
- Write raw events to `market_events` table
- Trigger downstream snapshot updates

## Dependencies
- `shared/blockchain` — viem client for event fetching
- `shared/database` — Drizzle for persistence

## Events indexed
See `docs/canonical/smartcontract-events.md` for full event list.
