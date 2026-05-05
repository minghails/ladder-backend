# Templates — Live Data Cutover For Mock-Backed Endpoints

## Session log template

```md
# Session — <Slice Name>

Date: 2026-05-05

## Scope

<One bounded slice only.>

## Changes

- <Docs/source changes made.>

## TDD record

RED verified with:

```text
<command>
```

Expected failure: <failure reason>.

GREEN verified with:

```text
<command>
```

Result: <pass count>.

## API impact for FE

<Use `backend/docs/HANDOFF.md` categories. Include endpoint and FE action needed.>

## Architecture docs sync

- Updated: <docs updated, or none>
- Checked; no update needed: <reason, if no docs changed>

## Verification

- `<command>` — <result>

## Remaining risks

- <risk>

## Next step

<exact next epic/slice/session log>
```

## Completion report template

- files changed
- docs changed
- API impact for FE
- verification run
- remaining risks
- next step

## Tracker update template

```md
## Recently Updated

- 2026-05-05: <slice> completed. API impact: <category>. Latest session: `<path>`. Next: <next exact action>.
```
