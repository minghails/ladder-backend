# Dev Environment Setup

## Prerequisites
- Node.js 22 LTS
- pnpm
- Docker (for PostgreSQL)
- Foundry/Anvil (for chain tests, optional)

## Quick start

1. `pnpm install`
2. `docker compose -f docker/docker-compose.yml up -d`
3. `cp .env.example .env`
4. `pnpm db:migrate`
5. `pnpm dev`
6. Open http://localhost:3000/health/ready for dependency readiness, or http://localhost:3000/health/live for process liveness
7. Open http://localhost:3000/api-docs (Swagger)

## Deploy health probes

Point Railway or k8s readiness probes at `/health/ready` so deploys fail fast when PostgreSQL, RPC, or the projector cursor is unhealthy. Use `/health/live` only for process liveness.
