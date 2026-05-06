# Initiative — Portfolio Earnings And Claimables Live Projection

## Plan

`backend/docs/plans/2026-05-06-portfolio-earnings-claimables-live-projection.md`

## Goal

Build backend-owned event-derived portfolio accounting so earnings, claimables, and overview aggregates use live indexed data without contract or ABI changes.

## Scope

- Add immutable `portfolio_cashflows` and aggregate `portfolio_cost_basis` tables.
- Project deposits/withdrawals from existing Market events plus tranche ERC-4626 owner-correlation events.
- Serve live `GET /portfolio/:address/earnings` from cost basis plus live positions.
- Serve live `GET /portfolio/:address/claimables` from rejected, unrefunded async deposit requests.
- Update `/portfolio/:address` overview financial aggregate fields that depend on earnings/claimables.
- Update canonical API, backend architecture, and integration docs during implementation.

## Non-goals

- No contract changes.
- No ABI changes.
- No rewards, airdrops, or user-fee claimables until a future contract source exists.
- No exact net APY or time-weighted return model.
- No backend signing or transaction submission.
- No mandatory calldata.

## Source-of-truth order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. Active plan file
5. `tracker.md`
6. Active epic file only
7. Latest session log only when tracker names it or context is missing

## Folder map

- `tracker.md` — active epic/slice, risks, decisions, next action.
- `session-kickoff-prompt.md` — copy-paste prompt for next backend agent.
- `architecture.md` — initiative-specific execution architecture.
- `decisions.md` — durable decisions/open decisions.
- `templates.md` — local session/tracker templates.
- `epics/` — bounded slice contracts generated from plan scope.
- `sessions/` — append-only implementation session logs.
- `runbooks/` — risky operation checklists.

## Current status

Prepared for implementation. No backend source code changed by initiative preparation.
