# Templates — Backend FE Wagmi Trade Support

## Session log template

```markdown
# Session — <slice name>

## Active context

- Plan: `backend/docs/plans/2026-05-05-backend-fe-wagmi-trade-support.md`
- Initiative: `backend/docs/initiatives/backend-fe-wagmi-trade-support/`
- Epic: `<path>`
- Slice: `<slice>`

## Work completed

- <files/behavior>

## Files changed

- <path>

## Docs changed

- <path or none>

## API impact for FE

- <API contract change | API data-source/behavior change | No FE-facing API impact | FE review recommended>
- FE action needed: <none or detail>

## Verification run

- `<command>` — <result>

## Architecture docs sync

- Updated: <docs updated, or none>
- Checked; no update needed: <reason, if no docs changed>

## Remaining risks

- <risk or none>

## Next step

- <exact next slice/action>
```

## Kickoff prompt update rule

After every completed slice or epic, update `backend/docs/initiatives/backend-fe-wagmi-trade-support/session-kickoff-prompt.md` before reporting done.

The top `## Copy-paste prompt for next agent` block must include:

- exact plan path
- exact tracker path
- exact active epic path
- exact active slice name
- latest relevant session log path, if one exists
- next action in one sentence
- bounded-slice rule
- verification/doc-sync/API-impact requirements

## Tracker update template

```markdown
## Active

- Epic: `<epic path>`
- Slice: `<slice name>`
- Session: `<session path>`

## Recently Updated

- 2026-05-05: <summary>
```
