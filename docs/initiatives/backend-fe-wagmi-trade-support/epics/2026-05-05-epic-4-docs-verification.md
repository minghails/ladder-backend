# Epic 4 — Docs, Integration Checklist, and Demo Smoke

## Goal

Update canonical docs and run full verification/smoke for FE wagmi trade support.

## Files expected

- Modify: `docs/canonical/api-contract.md`
- Possibly modify: `docs/canonical/integration-rules.md`
- Possibly modify: `docs/canonical/backend-architecture.md`
- Possibly modify: `backend/docs/architecture.md`
- Modify: `backend/docs/initiatives/backend-fe-wagmi-trade-support/tracker.md`
- Create final session log under `backend/docs/initiatives/backend-fe-wagmi-trade-support/sessions/`

## Slice 1 — Canonical API docs

### Scope

Document public contract changes for FE.

### Steps

1. Read `docs/canonical/api-contract.md` and `docs/canonical/integration-rules.md`.
2. Add/confirm docs for:
   - `POST /quotes/deposit-yt`
   - upgraded `POST /quotes/deposit-base` action/approval semantics
   - corrected `POST /quotes/withdraw-yt` Market `withdraw` semantics
   - upgraded `GET /markets/:address/trade-constraints`
   - new `GET /tx/:hash`
   - `calldataIncluded = false` no-calldata guarantee
3. Update `integration-rules.md` only if FE approval/wagmi rules are not already covered.
4. Run targeted docs check if project has one; otherwise note no docs test exists.
5. Update tracker/session log; classify API impact summary as `API contract change`.

## Slice 2 — Full verification and API smoke

### Scope

Run final backend verification and smoke checklist.

### Steps

1. From `backend/`, run:
   - `pnpm test`
   - `pnpm lint`
   - `pnpm build`
2. Run Docker DB migration smoke:
   - `cd docker && docker compose up -d postgres`
   - `cd ..`
   - `set -a; source .env; set +a`
   - `pnpm db:migrate`
3. With app running, smoke:
   - `GET /markets/:address/trade-constraints`
   - `POST /quotes/deposit-yt`
   - `POST /quotes/deposit-base`
   - `POST /quotes/withdraw-yt`
   - `GET /tx/<known-or-fake-hash>`
4. Confirm projector still supports Alchemy free-tier range assumption with `PROJECTOR_BATCH_SIZE=10` if projector verification is in scope for environment.
5. Update tracker/session log with final FE API impact summary.

## Epic done criteria

- Full verification passes or failures are documented with exact commands/output.
- API smoke returns expected JSON shapes.
- Tracker names plan complete or names exact remaining blocker.
