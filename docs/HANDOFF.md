# Backend Handoff

Use this as the entrypoint for backend agent sessions.

## Read order

1. Root `AGENTS.md`
2. Root `docs/canonical/SUMMARY.md`
3. `backend/docs/initiatives/README.md`
4. `backend/docs/plans/README.md`
5. Exact active plan file, if user names one
6. Exact initiative tracker, if initiative exists
7. Active epic/slice named by tracker, if any
8. Latest session log only when tracker names it or lacks enough context

## Context-budget rules

- Do not scan all backend plans.
- Do not scan all backend initiatives.
- Do not scan all session logs.
- Do not read `backend/docs/initiatives/TEMPLATE.md` unless generating a new initiative.
- Do not read root `docs/raw/*` until canonical docs and active plan are insufficient.
- Prefer exact files named by user, tracker, or active plan.

## Plan-to-initiative rule

Given:

```text
backend/docs/plans/YYYY-MM-DD-<plan-slug>.md
```

Create or use:

```text
backend/docs/initiatives/<plan-slug>/
```

Do not create a generic backend initiative folder for unrelated plans.

## Normal session flow

```text
read handoff rules
  -> read exact plan or tracker
    -> confirm active slice
      -> work one bounded slice
        -> run verification
          -> update tracker
            -> write session log
```

## Activation flow

Only when user asks to activate or execute a plan:

1. Read exact plan file.
2. Derive plan slug from filename.
3. Create matching initiative folder if missing.
4. Generate tracker and session kickoff from plan.
5. Generate epics/slices only from the plan scope.
6. Leave future work ungenerated until needed.

## Architecture doc sync

Before marking any backend slice done:

1. Compare source changes against root `docs/canonical/backend-architecture.md`.
2. Compare backend module dependency changes against `backend/docs/architecture.md`.
3. If backend module boundaries, dependency graph, runtime flow, infrastructure choice, or data ownership changed, update both architecture docs as needed.
4. If backend API endpoints, request/response shape, auth behavior, or error format changed, update root `docs/canonical/api-contract.md`.
5. If backend indexing/decoding changed smart contract event assumptions or event-derived semantics, update root `docs/canonical/smartcontract-events.md` and root `docs/canonical/integration-rules.md` when cross-module behavior changes.
6. If DB schema/table ownership/projection model changed, update root `docs/canonical/backend-architecture.md` and the active initiative/session docs.
7. If implementation matches existing architecture exactly, do not edit docs for noise; record `Architecture docs checked; no update needed` in tracker/session handoff.

Backend architecture docs are the source of truth for intended backend architecture and agent handoff. Deployed contracts and operator-supplied ABIs remain execution truth for on-chain behavior.

## API impact reporting

After every backend slice, classify frontend-facing API impact explicitly.

Use these categories:

- `API contract change`: FE may need code changes. This includes added/removed endpoints, path/method/auth changes, request query/body changes, response field rename/add/remove, field type changes, nullability/requiredness changes, enum/status value changes, pagination shape changes, error shape/code changes, or visible semantic changes that alter how FE should parse or branch.
- `API data-source/behavior change`: endpoint contract stays stable, but returned data source or runtime behavior changes. Examples: mock/config data replaced by indexed/live data, empty states become possible, source labels change, ordering changes within an already documented contract, or freshness/data-quality semantics become real. Report what changed and whether FE action is needed; do not require FE changes by default if names, types, and shapes are unchanged.
- `No FE-facing API impact`: backend-only changes such as config, migrations with no exposed shape change, internal projector behavior, tests, docs, or refactors.

If any `API contract change` occurred, update `docs/canonical/api-contract.md` in the same PR and include a before/after contract summary for FE.

If only `API data-source/behavior change` occurred, still report it, including whether FE needs to adjust copy, empty-state handling, loading assumptions, source labels, or QA fixtures. If no FE change is needed, say `FE action needed: none`.

If unsure whether FE must change, classify as `FE review recommended` and explain the uncertainty.

At the end of every epic, add an API impact summary that consolidates all slice-level API deltas, including endpoints changed, behavior changes that did not require FE code changes, docs updated, and open FE follow-ups.

## Completion report

Always report:

- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step
