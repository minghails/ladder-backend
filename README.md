# Ladder Markets — Backend

Backend MVP for the one-market private-pilot. TypeScript modular monolith built with NestJS.

## Quick start

```bash
pnpm install
docker compose -f docker/docker-compose.yml up -d
cp .env.example .env
pnpm db:migrate
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with watch |
| `pnpm build` | Build for production |
| `pnpm start:prod` | Start production build |
| `pnpm test` | Run unit tests |
| `pnpm test:int` | Run integration tests (needs Docker) |
| `pnpm test:e2e` | Run e2e tests (needs Docker) |
| `pnpm db:generate` | Generate Drizzle migration |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |
