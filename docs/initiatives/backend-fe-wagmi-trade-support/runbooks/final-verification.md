# Runbook — Final Verification

## When to run

Run during Epic 4 after all implementation slices pass local targeted tests.

## Commands

From `backend/`:

```bash
pnpm test
pnpm lint
pnpm build
```

Docker DB migration smoke:

```bash
cd docker && docker compose up -d postgres
cd ..
set -a; source .env; set +a
pnpm db:migrate
```

API smoke with app running:

- `GET /markets/:address/trade-constraints`
- `POST /quotes/deposit-yt`
- `POST /quotes/deposit-base`
- `POST /quotes/withdraw-yt`
- `GET /tx/<known-or-fake-hash>`

## Evidence to record

- command output summary
- sample response shapes
- API impact summary for FE
- architecture docs sync result
