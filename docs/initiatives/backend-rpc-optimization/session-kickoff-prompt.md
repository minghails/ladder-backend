# Backend RPC Optimization Session Kickoff

## Copy-paste prompt for next agent

```text
You are implementing the Ladder backend RPC optimization initiative.

Read order (do not scan unrelated backend plans/initiatives/sessions):
1. backend/docs/HANDOFF.md
2. backend/docs/plans/2026-05-20-backend-rpc-optimization.md
3. backend/docs/initiatives/backend-rpc-optimization/tracker.md
4. backend/docs/initiatives/backend-rpc-optimization/epics/2026-05-20-epic-01-rpc-read-cache-portfolio-dedup.md
5. Latest session log: backend/docs/initiatives/backend-rpc-optimization/sessions/2026-05-20-activation.md

Active work:
- Epic 1 — RPC read cache and portfolio dedup
- Slice 1 — RPC read cache utility and env

Rules:
- Work one bounded slice only.
- Do not scan unrelated initiatives, plans, or session logs.
- Preserve public API shapes and live-contract semantics.
- Report API impact category per HANDOFF.md after the slice.
- Check canonical architecture docs before marking slice done.
- Run targeted tests, lint, and build for changed backend files.

Slice 1 scope:
- Add rpc-read-cache helper with TTL get/set/expiry tests
- Add RPC_READ_CACHE_TTL_MS env/config (default 15000)
- Update backend/.env.example
- Do not implement ContractReaderService integration yet unless slice is expanded; stay within Slice 1 only

Required completion report:
- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
```

## Status

- Initiative: activated
- Active epic: Epic 1 — RPC read cache and portfolio dedup
- Active slice: Slice 1 — RPC read cache utility and env
- Latest session log: `sessions/2026-05-20-activation.md`

## Notes for next agent

- Backend-only scope. No FE changes.
- Expected API impact for all slices: No FE-facing API impact unless proven otherwise.
- Start with cache utility + env before touching ContractReaderService.
