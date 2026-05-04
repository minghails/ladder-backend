# Backend Initiatives

This folder is generated per backend plan.

Do not create one shared `backend-mvp` initiative for all work. Each approved plan gets its own initiative folder named from the plan slug.

## Folder rule

Given a plan file:

```text
backend/docs/plans/YYYY-MM-DD-<plan-slug>.md
```

Create matching initiative folder:

```text
backend/docs/initiatives/<plan-slug>/
```

Examples:

```text
backend/docs/plans/2026-05-04-chain-projector-indexer.md
backend/docs/initiatives/chain-projector-indexer/
```

```text
backend/docs/plans/2026-05-10-oracle-price-updates.md
backend/docs/initiatives/oracle-price-updates/
```

## Required generated structure per plan

When user asks to activate a plan, generate:

```text
backend/docs/initiatives/<plan-slug>/
  README.md
  tracker.md
  session-kickoff-prompt.md
  architecture.md
  decisions.md
  templates.md
  epics/
  sessions/
  runbooks/
```

Optional, only when needed:

```text
backend/docs/initiatives/<plan-slug>/notes/
backend/docs/initiatives/<plan-slug>/evidence/
```

## Source-of-truth order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. Relevant root `docs/canonical/*`
4. Active plan file in `backend/docs/plans/`
5. Root `docs/raw/current-mvp/backend-mvp-implementation-plan.md` when canonical docs are insufficient
6. Backend source files under `backend/src/`
7. Backend local docs under `backend/docs/`
8. Root `docs/raw/reference/*` only as supporting context
9. Root `docs/raw/future-phase/*` only when explicitly requested

## Context-budget rules

Normal backend sessions should stay narrow:

- Do not scan all initiatives.
- Do not scan all sessions.
- Do not scan all runbooks.
- Do not read `TEMPLATE.md` unless generating a new initiative.
- Read the target initiative `tracker.md` first.
- Read only the active epic/slice named by the tracker.
- Read latest session log only if tracker names it or tracker lacks enough context.
- Prefer exact files named by user, tracker, or active plan.

## Generation rules for agents

When creating an initiative from a plan:

1. Read the plan file first.
2. Derive `<plan-slug>` from the plan filename by removing `YYYY-MM-DD-` and `.md`.
3. Create `backend/docs/initiatives/<plan-slug>/`.
4. Write initiative docs using Ladder backend context only.
5. Do not import CRM/Greenhouse plan content or epic taxonomy.
6. Do not invent implementation scope not present in the plan.
7. Do not split epics until the user explicitly asks to activate/execute the plan.
8. Keep generated tracker state empty unless activation is requested.
9. If the plan changes API, schema, smart contract event handling, or integration rules, note that matching root canonical docs must be updated during execution.

## Initiative lifecycle

```text
plan added
  -> initiative generated from plan slug
    -> tracker initialized
      -> epics created from plan only when requested
        -> one slice per session
          -> session log + tracker update
```

## Naming rules

- Plan filenames: `YYYY-MM-DD-<kebab-case-topic>.md`
- Initiative folders: `<kebab-case-topic>`
- Epic files: `epics/YYYY-MM-DD-<short-epic-name>.md`
- Session logs: `sessions/YYYY-MM-DD-<short-topic>.md`
- Runbooks: `runbooks/<operation-name>.md`

## Do not

- Do not create a generic catch-all initiative for backend MVP.
- Do not place backend initiative docs in root `docs/initiatives/`.
- Do not activate old plan files unless user explicitly says so.
- Do not create epics from module order alone; create them from an approved plan.
