# Backend Plans

Place backend implementation plans here.

Each plan should be standalone and named:

```text
YYYY-MM-DD-<kebab-case-topic>.md
```

A plan is not active by default. When user asks to activate a plan, create a matching initiative folder:

```text
backend/docs/initiatives/<kebab-case-topic>/
```

Example:

```text
backend/docs/plans/2026-05-04-chain-projector-indexer.md
backend/docs/initiatives/chain-projector-indexer/
```

## Plan requirements

A plan should include:

- Goal
- Architecture constraints
- Scope
- Non-goals
- Required source-of-truth docs
- File/module plan
- Milestones or execution tasks
- Verification gates
- Open decisions
- Risks

## Activation checklist

Before activating a plan, confirm:

- [ ] User explicitly asked to activate or execute this plan.
- [ ] Plan file exists under `backend/docs/plans/`.
- [ ] Plan filename follows `YYYY-MM-DD-<kebab-case-topic>.md`.
- [ ] Plan has Goal, Scope, Non-goals, File/module plan, Verification gates, Risks.
- [ ] Plan is Ladder backend scope, not frontend or contract-source scope.
- [ ] Root canonical docs have been read for affected API/schema/event behavior.
- [ ] Future-phase scope is excluded unless user explicitly requested it.

## Activation rule

Do not create epics/slices until user explicitly asks to activate or execute a plan.

When activated, derive initiative slug from the plan filename and create:

```text
backend/docs/initiatives/<kebab-case-topic>/
```
