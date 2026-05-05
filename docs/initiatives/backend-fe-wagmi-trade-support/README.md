# Backend FE Wagmi Trade Support Initiative

## Purpose

Coordinate backend-only implementation for frontend wagmi trade support.

- Plan: `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`

## Scope

- Quote/preflight APIs for direct YT buy, base-token instant buy, and ST/JT sell to YT.
- Approval, method, and action hints for frontend wagmi calls.
- Trade constraints shape for FE forms.
- Transaction status endpoint backed by indexed `market_events`.
- Canonical API/integration docs updates during execution.

## Non-goals

- No backend signing, keys, mandatory calldata, contract changes, base-token sell path, async operator orchestration, broad portfolio earnings/cost-basis work.

## Source-of-truth order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`
5. This initiative tracker
6. Active epic/slice file
7. Backend source under `backend/src/`

## Folder map

- `tracker.md` — active state and next action.
- `session-kickoff-prompt.md` — prompt for next agent.
- `architecture.md` — initiative-specific module map.
- `decisions.md` — durable decisions.
- `templates.md` — session/epic templates.
- `epics/` — slice contracts.
- `sessions/` — append-only logs.
- `runbooks/` — verification/smoke checklists.
