# Backend Initiative Template

Use this template when generating an initiative folder from a plan.

## Input

Plan path:

```text
backend/docs/plans/YYYY-MM-DD-<plan-slug>.md
```

Initiative path:

```text
backend/docs/initiatives/<plan-slug>/
```

## Files to generate

### `README.md`

```markdown
# <Plan Title> Initiative

## Purpose

This initiative coordinates agent-driven backend work for:

- Plan: `backend/docs/plans/YYYY-MM-DD-<plan-slug>.md`

## Scope

- <derive from plan>

## Non-goals

- <derive from plan>

## Source-of-truth order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. Relevant root `docs/canonical/*`
4. This plan: `backend/docs/plans/YYYY-MM-DD-<plan-slug>.md`
5. Root `docs/raw/current-mvp/backend-mvp-implementation-plan.md` when canonical docs are insufficient
6. Backend source files under `backend/src/`

## Folder map

- `tracker.md` — current state, active slice, next action, risks, decisions needed.
- `session-kickoff-prompt.md` — prompt for starting agent sessions.
- `architecture.md` — initiative-specific execution architecture.
- `decisions.md` — durable decisions for this plan.
- `templates.md` — local templates.
- `epics/` — epic contracts, generated only when plan is activated for execution.
- `sessions/` — append-only session logs.
- `runbooks/` — risky operation checklists.

## Current state

No epic is active until user requests activation/execution.
```

### `tracker.md`

```markdown
# Tracker — <Plan Title>

## Active

- None.

## Active plan

- `backend/docs/plans/YYYY-MM-DD-<plan-slug>.md`

## Planned

- None. Epics not generated yet.

## In Progress

- None.

## Next Up

- Await user request to activate this plan and generate epics/slices.

## Done

- Initiative skeleton generated from plan.

## Blocked

- None.

## Risks

- <derive risks from plan>

## Needs Decision

- <derive open decisions from plan, or None>

## Recently Updated

- YYYY-MM-DD: Initiative skeleton generated from plan.
```

### `session-kickoff-prompt.md`

```markdown
# Session Kickoff — <Plan Title>

## Copy-paste prompt for next agent

```text
Follow `backend/docs/HANDOFF.md`.
Do not scan unrelated plans/initiatives.
Work one bounded slice only.

Read first:
1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/YYYY-MM-DD-<plan-slug>.md`
5. `backend/docs/initiatives/<plan-slug>/tracker.md`
6. <exact active epic path, or active epic named by tracker>
7. Latest relevant session log only if tracker names it or tracker lacks context.

Active slice: <exact active slice, or initiative complete status>.
Latest session log: <path or none>.

Rules:
- Stay within plan scope.
- Do not implement beyond active slice unless explicitly requested.
- Use TDD when implementation changes behavior: failing test first, minimal implementation, passing test.
- Do not pull future-phase scope forward.
- Do not create backend behavior not supported by deployed contract surface.
- Before marking done, apply architecture doc sync rules from `backend/docs/HANDOFF.md`.
- Classify FE API impact using `backend/docs/HANDOFF.md`.
- Write session log under `sessions/`, update tracker, and keep this copy-paste prompt current.

Completion report required:
- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
```

## First response instructions

Follow `backend/docs/HANDOFF.md`. Do not scan unrelated plans/initiatives. Work one bounded slice only.

## Read first

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/HANDOFF.md`
4. `backend/docs/plans/YYYY-MM-DD-<plan-slug>.md`
5. `backend/docs/initiatives/<plan-slug>/tracker.md`
6. Active epic contract, if any
7. Latest relevant session log only if tracker lacks context

## Session rules

- Stay within plan scope.
- Execute one bounded slice per session unless user asks otherwise.
- Do not pull future-phase scope forward.
- Do not create backend behavior not supported by deployed contract surface.
- Record verification evidence before marking done.
- Before marking done, apply backend architecture doc sync from `backend/docs/HANDOFF.md`.
- Keep `## Copy-paste prompt for next agent` current: exact active epic, active slice, latest relevant session log, and next action.
```

### `architecture.md`

```markdown
# Architecture — <Plan Title>

## Purpose

This file explains how this plan is executed through initiative docs.

## Operating flow

```text
plan
  -> tracker
    -> epic contract
      -> execution slice
        -> session log
        -> handoff
```

## Plan boundaries

- <scope from plan>

## Backend module boundaries

- <modules touched by plan>

## Handoff quality bar

- active plan path
- active epic/slice path
- files touched
- verification command and result
- architecture docs updated, or `Architecture docs checked; no update needed`
- unresolved risks
- next exact action
```

### `decisions.md`

```markdown
# Decisions — <Plan Title>

## Accepted decisions

None.

## Proposed decisions

None.

## Rejected decisions

None.
```

### `templates.md`

Copy standard epic/session/runbook templates from this file or generate plan-specific versions.

## Standard session handoff field

Generated session templates must include:

```markdown
## Architecture docs sync

- Updated: <docs updated, or none>
- Checked; no update needed: <reason, if no docs changed>
```

## Standard subfolders

Create:

```text
epics/
sessions/
runbooks/
```

Use `.gitkeep` only if empty folders must be tracked.
