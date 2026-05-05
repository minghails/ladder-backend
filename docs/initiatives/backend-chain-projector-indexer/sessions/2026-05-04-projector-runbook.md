# Session — Projector Runbook

## Slice

Epic 5 — Runbook and Verification, Slice 1 — projector runbook.

## Scope completed

- Updated `backend/src/modules/chain-projector/README.md` with current projector responsibilities, env setup, disabled/enabled startup, DB/API verification, and stop conditions.
- Updated `backend/docs/initiatives/backend-chain-projector-indexer/runbooks/projector-local-replay.md` with local replay steps, migrations, DB checks, API checks, replay idempotency check, stop conditions, and recovery notes.
- Included exact `DEPLOYMENT_BLOCK` requirement for real replay.

## API impact for FE

No FE-facing API impact. Docs-only operator/runbook slice; no endpoint, request, response, source label, pagination, or error behavior changed.

## Architecture docs checked

Architecture docs checked; no update needed.

## Verification

- Docs-only readback review: pass.
- `pnpm lint`: pass.
- `pnpm build`: pass.

## Remaining risks

- Production-like indexing still needs exact Market deployment block.
- Local DB migration smoke and live API smoke remain for Epic 5 Slice 3.
- RPC rate limits may require smaller projector batches.
- Multi-instance projector operation remains unsafe unless only one replica enables `PROJECTOR_ENABLED=true`.

## Handoff

Next slice: Epic 5, Slice 2 — canonical docs evaluation.
