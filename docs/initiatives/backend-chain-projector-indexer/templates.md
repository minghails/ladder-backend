# Templates — Backend Chain Projector / Indexer

## Epic template

```markdown
# Epic N — <name>

## Goal

<one sentence>

## Source plan sections

- `backend/docs/plans/2026-05-04-backend-chain-projector-indexer-plan.md` §<section>

## Scope

- <bullets>

## Non-goals

- <bullets>

## Slices

### Slice 1 — <name>

**Goal:** <bounded result>

**Files:**
- Modify: `<path>`
- Create: `<path>`
- Test: `<path>`

**Steps:**
- [ ] Read only source files needed for this slice.
- [ ] Write failing test.
- [ ] Run targeted test and confirm failure.
- [ ] Implement minimal code.
- [ ] Run targeted test and confirm pass.
- [ ] Run lints for edited files.
- [ ] Update tracker.
- [ ] Write session log.

**Verification:**
- `<command>` — expected: pass.

**Handoff:**
- Next slice: <slice>
```

## Session log template

```markdown
# Session — <slice name>

## Active slice

- Epic: `<path>`
- Slice: <name>

## Files changed

- <path>

## Tests added/changed

- <path>

## Verification run

```bash
<command>
```

Result: <pass/fail + evidence>

## Decisions made

- <decision or None>

## Risks / blockers

- <risk or None>

## Tracker update

- <what changed>

## Next step

- <exact next action>
```

## Runbook template

```markdown
# Runbook — <operation>

## When to use

<condition>

## Preconditions

- <checks>

## Steps

1. <step>
2. <step>

## Verification

- <command/query> — expected: <result>

## Rollback / stop condition

- <condition>
```
