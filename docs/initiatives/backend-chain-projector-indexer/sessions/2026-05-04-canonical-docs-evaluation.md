# Session — Canonical Docs Evaluation

## Slice

Epic 5 — Runbook and Verification, Slice 2 — canonical docs evaluation.

## Scope completed

Compared implemented projector/indexed API behavior against canonical docs:

- `docs/canonical/api-contract.md`
- `docs/canonical/backend-architecture.md`
- `docs/canonical/smartcontract-events.md`
- `docs/canonical/integration-rules.md`

## Result

No canonical doc edits needed.

## Findings

- API contract already documents `GET /markets/:address/history`, indexed chart source semantics, `GET /deposit-requests/:id`, portfolio nullable `adaptorRequestId`, and semantic `stJtRatio` naming.
- Backend architecture already documents projector idempotency, derived table identities, cursor identity, deposit request lifecycle fields, and `jtStRatioAfter` normalization.
- Smart contract events already document relevant Market events and the legacy ABI ratio field normalization rule.
- Integration rules already document ABI policy, frontend dependency on normalized leverage fields, and backend projector dependencies.

## API impact for FE

No FE-facing API impact in this slice. Docs-only evaluation; no endpoint, response, data-source, source label, or error behavior changed.

## Architecture docs checked

Architecture docs checked; no update needed.

## Verification

- Readback comparison of canonical docs against active plan/tracker deltas: pass.

## Remaining risks

- Full backend verification remains in Epic 5 Slice 3.
- Production-like projector replay still needs exact deployment block and local RPC/DB availability.

## Handoff

Next slice: Epic 5, Slice 3 — full verification gate.
