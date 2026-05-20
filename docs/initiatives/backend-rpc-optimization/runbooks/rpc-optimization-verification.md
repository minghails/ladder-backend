# RPC Optimization Verification Runbook

Use after each slice and before closing an epic.

## Targeted slice verification

```bash
cd backend
pnpm test <changed-spec-files>
pnpm lint
pnpm build
```

## Epic completion verification

```bash
cd backend
pnpm test src/shared/blockchain/contract-reader.service.spec.ts
pnpm test src/modules/portfolio/portfolio.service.spec.ts
pnpm test src/modules/chain-projector/chain-projector.service.spec.ts
pnpm test src/modules/chain-projector/market-snapshot.projector.spec.ts
pnpm lint
pnpm build
```

## Optional chain verification

When Base Sepolia RPC env is available:

```bash
cd backend
pnpm test:chain
```

## Manual RPC sanity (optional)

1. Call `GET /markets` twice within cache TTL and compare responses.
2. Confirm projector still advances cursor when enabled.
3. Monitor Alchemy dashboard for reduced request volume after Epic 2+3.

## Architecture doc sync

Before marking a slice done:

1. Compare changes to `docs/canonical/backend-architecture.md`.
2. If no API/schema/event semantics changed, record `Architecture docs checked; no update needed` in tracker/session log.
