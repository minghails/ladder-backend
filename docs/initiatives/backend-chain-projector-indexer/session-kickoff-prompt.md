# Session Kickoff — Backend Chain Projector / Indexer

Use this prompt to start each implementation session.

```text
Follow backend/docs/HANDOFF.md.

Implement exactly one bounded slice from:
backend/docs/initiatives/backend-chain-projector-indexer/tracker.md

Read order:
1. AGENTS.md
2. docs/canonical/SUMMARY.md
3. backend/docs/HANDOFF.md
4. backend/docs/initiatives/README.md
5. backend/docs/plans/README.md
6. backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md
7. backend/docs/initiatives/backend-chain-projector-indexer/tracker.md
8. Active epic/slice named by tracker
9. Latest relevant session log only if tracker lacks enough context

Rules:
- Stay inside plan scope.
- Implement only active slice unless user explicitly expands scope.
- Use TDD: failing test first, minimal implementation, passing test.
- Do not implement signer/admin write orchestration.
- Do not introduce Redis, queues, Temporal, TimescaleDB, microservices, or separate worker.
- Use existing ABI package under backend/src/shared/blockchain/contracts/.
- Preserve existing live read APIs.
- Use block timestamps from viem getBlock for projected history.
- Normalize legacy ABI field jtStRatioAfter to semantic stJtRatioAfter in code/API.
- Update canonical docs in same PR if API/schema/event-facing behavior changes.
- Before handoff, run targeted verification, update tracker, and write session log.

Completion report must include:
- files changed
- docs changed
- verification run
- remaining risks
- next step
```

## First session target

Start with:

- Epic: `backend/docs/initiatives/backend-chain-projector-indexer/epics/2026-05-04-epic-01-minimum-working-projector.md`
- Slice: Slice 1 — projector config

## Session log path format

Use:

```text
backend/docs/initiatives/backend-chain-projector-indexer/sessions/YYYY-MM-DD-<slice-short-name>.md
```
