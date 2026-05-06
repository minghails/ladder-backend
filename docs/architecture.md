# Backend Architecture

See `docs/canonical/backend-architecture.md` in the project root for the canonical reference.

This backend is a TypeScript modular monolith using feature-first flat modules.
Each module maps 1:1 with the canonical architecture. See individual module READMEs for details.

## Module dependency graph

- `admin-ops` → `oracle`, `risk-monitoring`, `deposit-requests`, `market-state`
- `market-state` → `chain-projector`, `shared/database`, `shared/blockchain`
- `quotes` → `market-state`, `shared/blockchain`
- `portfolio` → `chain-projector`, `shared/database`, `shared/blockchain`
- `deposit-requests` → `chain-projector`, `shared/database`
- `oracle` → `shared/blockchain`, `shared/database`
- `risk-monitoring` → `market-state`, `shared/database`
- `tx-status` → `shared/database`
- `chain-projector` → `shared/blockchain`, `shared/database`, `portfolio` accounting repository
