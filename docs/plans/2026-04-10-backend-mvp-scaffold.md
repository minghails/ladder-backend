# Backend MVP Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the complete backend project scaffold — infrastructure, module shells, and database schema — ready for feature implementation.

**Architecture:** TypeScript modular monolith using NestJS 11 with feature-first flat modules. Backend owns projection, orchestration, observability, and clean read APIs. Contract code remains the execution source of truth.

**Tech Stack:** NestJS 11, TypeScript 5.8+, Drizzle ORM 0.45.2, PostgreSQL 17, viem 2.47.11, Vitest 4.1.4, pino, Zod, Docker Compose, pnpm

**Spec:** `docs/superpowers/specs/2026-04-10-backend-mvp-scaffold-design.md`

---

## Phase 1: Project Bootstrap

### Task 1: Init git + pnpm project

**Files:**
- Create: `backend/package.json`
- Create: `backend/.gitignore`
- Create: `backend/.nvmrc`
- Create: `backend/README.md`

- [ ] **Step 1: Init git repo**

```bash
cd backend
git init
```

- [ ] **Step 2: Create `.nvmrc`**

```
22
```

- [ ] **Step 3: Create `.gitignore`**

```gitignore
node_modules/
dist/
.env
.env.local
*.log
coverage/
.turbo/
.DS_Store
```

- [ ] **Step 4: Init pnpm project**

```bash
pnpm init
```

- [ ] **Step 5: Install NestJS core + CLI**

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
pnpm add -D @nestjs/cli @nestjs/schematics @nestjs/testing typescript @types/node @types/express
```

- [ ] **Step 6: Create README.md**

```markdown
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
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: init backend project with pnpm and NestJS deps"
```

---

### Task 2: TypeScript configuration

**Files:**
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@app/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@modules/*": ["src/modules/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

- [ ] **Step 2: Create `tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*.spec.ts"]
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: add TypeScript config with strict mode and path aliases"
```

---

### Task 3: ESLint 9 flat config + Prettier

**Files:**
- Create: `backend/eslint.config.mjs`
- Create: `backend/.prettierrc`
- Create: `backend/.prettierignore`

- [ ] **Step 1: Install ESLint + Prettier deps**

```bash
pnpm add -D eslint @eslint/js typescript-eslint eslint-config-prettier eslint-plugin-prettier prettier
```

- [ ] **Step 2: Create `eslint.config.mjs`**

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'eslint.config.mjs'],
  },
);
```

- [ ] **Step 3: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

- [ ] **Step 4: Create `.prettierignore`**

```
dist
node_modules
pnpm-lock.yaml
```

- [ ] **Step 5: Add lint/format scripts to `package.json`**

Add to `scripts`:
```json
{
  "lint": "eslint \"src/**/*.ts\" \"test/**/*.ts\"",
  "lint:fix": "eslint \"src/**/*.ts\" \"test/**/*.ts\" --fix",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add ESLint 9 flat config and Prettier"
```

---

### Task 4: Vitest setup with SWC

**Files:**
- Create: `backend/vitest.config.ts`
- Create: `backend/vitest.config.integration.ts`
- Create: `backend/vitest.config.chain.ts`
- Create: `backend/vitest.config.e2e.ts`

- [ ] **Step 1: Install Vitest + SWC deps**

```bash
pnpm add -D vitest unplugin-swc @swc/core vite-tsconfig-paths @vitest/coverage-v8
```

- [ ] **Step 2: Create `vitest.config.ts` (unit tests)**

```typescript
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.module.ts', 'src/main.ts'],
    },
  },
});
```

- [ ] **Step 3: Create `vitest.config.integration.ts`**

```typescript
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    root: './',
    include: ['test/integration/**/*.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    globalSetup: ['test/integration/global-setup.ts'],
  },
});
```

- [ ] **Step 4: Create `vitest.config.chain.ts`**

```typescript
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    root: './',
    include: ['test/chain/**/*.spec.ts'],
    testTimeout: 30_000,
  },
});
```

- [ ] **Step 5: Create `vitest.config.e2e.ts`**

```typescript
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    root: './',
    include: ['test/e2e/**/*.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
```

- [ ] **Step 6: Add test scripts to `package.json`**

Add to `scripts`:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:unit": "vitest run",
  "test:int": "vitest run -c vitest.config.integration.ts",
  "test:chain": "vitest run -c vitest.config.chain.ts",
  "test:e2e": "vitest run -c vitest.config.e2e.ts",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add Vitest configs with SWC for unit, integration, chain, and e2e"
```

---

### Task 5: NestJS bootstrap files

**Files:**
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/nest-cli.json`

- [ ] **Step 1: Create `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';

@Module({
  imports: [],
})
export class AppModule {}
```

- [ ] **Step 2: Create `src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ladder Markets API')
    .setDescription('Backend MVP for the one-market private pilot')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

void bootstrap();
```

- [ ] **Step 3: Create `nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

- [ ] **Step 4: Add dev/build scripts to `package.json`**

Add to `scripts`:
```json
{
  "build": "nest build",
  "dev": "nest start --watch",
  "start:prod": "node dist/main"
}
```

- [ ] **Step 5: Install SWC for NestJS builder**

```bash
pnpm add -D @swc/cli @swc/register
```

- [ ] **Step 6: Verify app boots**

```bash
pnpm build
```

Expected: Build succeeds, `dist/` folder created.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add NestJS bootstrap with SWC builder"
```

---

## Phase 2: Shared Infrastructure

### Task 6: Config module (Zod env validation)

**Files:**
- Create: `backend/src/shared/config/config.module.ts`
- Create: `backend/src/shared/config/env.validation.ts`
- Create: `backend/src/shared/config/app.config.ts`
- Create: `backend/src/shared/config/env.validation.spec.ts`

- [ ] **Step 1: Install deps**

```bash
pnpm add @nestjs/config zod nestjs-zod @nestjs/swagger
```

- [ ] **Step 2: Write failing test for env validation**

Create `src/shared/config/env.validation.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateEnv, type EnvConfig } from './env.validation';

describe('validateEnv', () => {
  it('should validate a complete valid env', () => {
    const env = {
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
      RPC_URL: 'http://localhost:8545',
      MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
    };

    const result = validateEnv(env);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should throw on missing required fields', () => {
    expect(() => validateEnv({})).toThrow();
  });

  it('should apply defaults for optional fields', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
      RPC_URL: 'http://localhost:8545',
      MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
    };

    const result = validateEnv(env);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test -- src/shared/config/env.validation.spec.ts
```

Expected: FAIL — `validateEnv` not found.

- [ ] **Step 4: Implement env validation**

Create `src/shared/config/env.validation.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  RPC_URL: z.string().url(),
  MARKET_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(
  config: Record<string, unknown>,
): EnvConfig {
  const parsed = envSchema.parse(config);
  return parsed;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test -- src/shared/config/env.validation.spec.ts
```

Expected: PASS

- [ ] **Step 6: Create app config**

Create `src/shared/config/app.config.ts`:

```typescript
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env['DATABASE_URL']!,
}));

export const blockchainConfig = registerAs('blockchain', () => ({
  rpcUrl: process.env['RPC_URL']!,
  marketAddress: process.env['MARKET_ADDRESS']!,
}));
```

- [ ] **Step 7: Create config module**

Create `src/shared/config/config.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';
import { appConfig, databaseConfig, blockchainConfig } from './app.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: validateEnv,
      load: [appConfig, databaseConfig, blockchainConfig],
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
```

- [ ] **Step 8: Wire into AppModule**

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/config/config.module';

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(config): add Zod env validation and config module"
```

---

### Task 7: Database module (Drizzle + postgres.js)

**Files:**
- Create: `backend/src/shared/database/database.module.ts`
- Create: `backend/src/shared/database/database.constants.ts`
- Create: `backend/src/shared/database/schema/index.ts`
- Create: `backend/drizzle.config.ts`

- [ ] **Step 1: Install Drizzle deps**

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

- [ ] **Step 2: Create database constants**

Create `src/shared/database/database.constants.ts`:

```typescript
export const DRIZZLE_DB = Symbol('DRIZZLE_DB');
```

- [ ] **Step 3: Create empty schema barrel**

Create `src/shared/database/schema/index.ts`:

```typescript
// Drizzle table definitions — add tables here as they are created
```

- [ ] **Step 4: Create database module**

Create `src/shared/database/database.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DRIZZLE_DB } from './database.constants';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('database.url');
        const client = postgres(url);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DatabaseModule {}
```

- [ ] **Step 5: Create Drizzle config at project root**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/database/schema/index.ts',
  out: './src/shared/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 6: Wire into AppModule**

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class AppModule {}
```

- [ ] **Step 7: Add db scripts to `package.json`**

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(database): add Drizzle ORM module with postgres.js driver"
```

---

### Task 8: Blockchain module (viem client)

**Files:**
- Create: `backend/src/shared/blockchain/blockchain.module.ts`
- Create: `backend/src/shared/blockchain/viem-client.service.ts`
- Create: `backend/src/shared/blockchain/viem-client.service.spec.ts`
- Create: `backend/src/shared/blockchain/contracts/market-abi.ts`
- Create: `backend/src/shared/blockchain/README.md`

- [ ] **Step 1: Install viem**

```bash
pnpm add viem
```

- [ ] **Step 2: Write failing test for viem client service**

Create `src/shared/blockchain/viem-client.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ViemClientService } from './viem-client.service';

describe('ViemClientService', () => {
  it('should create a public client', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              blockchain: {
                rpcUrl: 'http://localhost:8545',
                marketAddress: '0x1234567890123456789012345678901234567890',
              },
            }),
          ],
        }),
      ],
      providers: [ViemClientService],
    }).compile();

    const service = module.get(ViemClientService);
    expect(service).toBeDefined();
    expect(service.getPublicClient()).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test -- src/shared/blockchain/viem-client.service.spec.ts
```

Expected: FAIL — `ViemClientService` not found.

- [ ] **Step 4: Create Market ABI stub**

Create `src/shared/blockchain/contracts/market-abi.ts`:

```typescript
export const MARKET_ABI = [
  // Price update events
  {
    type: 'event',
    name: 'PriceUpdated',
    inputs: [
      { name: 'newPrice', type: 'uint256', indexed: false },
      { name: 'oracleTimestamp', type: 'uint256', indexed: false },
      { name: 'navAfter', type: 'uint256', indexed: false },
      { name: 'navStAfter', type: 'uint256', indexed: false },
      { name: 'navJtAfter', type: 'uint256', indexed: false },
      { name: 'jtStRatioAfter', type: 'uint256', indexed: false },
      { name: 'halted', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DepositYT',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'asSenior', type: 'bool', indexed: true },
      { name: 'assets', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false },
      { name: 'depositValue', type: 'uint256', indexed: false },
      { name: 'navAfter', type: 'uint256', indexed: false },
      { name: 'navStAfter', type: 'uint256', indexed: false },
      { name: 'navJtAfter', type: 'uint256', indexed: false },
      { name: 'jtStRatioAfter', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WithdrawYT',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'fromSenior', type: 'bool', indexed: true },
      { name: 'byShares', type: 'bool', indexed: false },
      { name: 'sharesIn', type: 'uint256', indexed: false },
      { name: 'assetsOut', type: 'uint256', indexed: false },
      { name: 'withdrawValue', type: 'uint256', indexed: false },
      { name: 'navAfter', type: 'uint256', indexed: false },
      { name: 'navStAfter', type: 'uint256', indexed: false },
      { name: 'navJtAfter', type: 'uint256', indexed: false },
      { name: 'jtStRatioAfter', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DepositRequested',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'asSenior', type: 'bool', indexed: false },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'minYtOut', type: 'uint256', indexed: false },
      { name: 'referrerId', type: 'bytes32', indexed: false },
      { name: 'extraData', type: 'bytes', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DepositBasePulled',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'DepositSettled',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'asSenior', type: 'bool', indexed: false },
      { name: 'ytIn', type: 'uint256', indexed: false },
      { name: 'sharesMinted', type: 'uint256', indexed: false },
      { name: 'depositValue', type: 'uint256', indexed: false },
      { name: 'navAfter', type: 'uint256', indexed: false },
      { name: 'navStAfter', type: 'uint256', indexed: false },
      { name: 'navJtAfter', type: 'uint256', indexed: false },
      { name: 'jtStRatioAfter', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DepositRejected',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'reasonCode', type: 'uint32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DepositRefunded',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MarketHaltedEvent',
    inputs: [
      { name: 'oracleTimestamp', type: 'uint256', indexed: false },
      { name: 'lastPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CarryFeeAccrued',
    inputs: [
      { name: 'feeYt', type: 'uint256', indexed: false },
      { name: 'feeBase', type: 'uint256', indexed: false },
      { name: 'updateCase', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CarryFeeCollected',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'feeYt', type: 'uint256', indexed: false },
    ],
  },
] as const;
```

- [ ] **Step 5: Implement viem client service**

Create `src/shared/blockchain/viem-client.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http, type PublicClient, type Address } from 'viem';

@Injectable()
export class ViemClientService {
  private readonly publicClient: PublicClient;
  private readonly marketAddress: Address;

  constructor(private readonly config: ConfigService) {
    const rpcUrl = this.config.getOrThrow<string>('blockchain.rpcUrl');
    this.marketAddress = this.config.getOrThrow<string>(
      'blockchain.marketAddress',
    ) as Address;

    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
    });
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getMarketAddress(): Address {
    return this.marketAddress;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm test -- src/shared/blockchain/viem-client.service.spec.ts
```

Expected: PASS

- [ ] **Step 7: Create blockchain module**

Create `src/shared/blockchain/blockchain.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ViemClientService } from './viem-client.service';

@Global()
@Module({
  providers: [ViemClientService],
  exports: [ViemClientService],
})
export class BlockchainModule {}
```

- [ ] **Step 8: Create README**

Create `src/shared/blockchain/README.md`:

```markdown
# Blockchain Module

Provides viem-based Ethereum client for contract reads, event decoding, and calldata preparation.

## Services

- `ViemClientService` — creates and manages `PublicClient` instance

## Contract ABIs

- `contracts/market-abi.ts` — Market.sol event ABI (from `docs/canonical/smartcontract-events.md`)

## Usage

Inject `ViemClientService` to access the public client:

```typescript
constructor(private readonly viemClient: ViemClientService) {}

async getBlockNumber() {
  return this.viemClient.getPublicClient().getBlockNumber();
}
```
```

- [ ] **Step 9: Wire into AppModule**

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { BlockchainModule } from './shared/blockchain/blockchain.module';

@Module({
  imports: [ConfigModule, DatabaseModule, BlockchainModule],
})
export class AppModule {}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(blockchain): add viem client service with Market ABI"
```

---

### Task 9: Common module (error filter, validation pipe, logging)

**Files:**
- Create: `backend/src/shared/common/filters/http-exception.filter.ts`
- Create: `backend/src/shared/common/filters/http-exception.filter.spec.ts`
- Create: `backend/src/shared/common/pipes/zod-validation.pipe.ts`
- Create: `backend/src/shared/common/pipes/zod-validation.pipe.spec.ts`
- Create: `backend/src/shared/common/dto/error-response.dto.ts`

- [ ] **Step 1: Install logging deps**

```bash
pnpm add nestjs-pino pino-http
pnpm add -D pino-pretty
```

- [ ] **Step 2: Create error response DTO (shared utility, no test needed)**

Create `src/shared/common/dto/error-response.dto.ts`:

```typescript
import { z } from 'zod';

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return { error: { code, message, ...(details && { details }) } };
}
```

- [ ] **Step 3: Write failing test for HTTP exception filter**

Create `src/shared/common/filters/http-exception.filter.spec.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StandardExceptionFilter } from './http-exception.filter';
import { createErrorResponse } from '../dto/error-response.dto';

describe('StandardExceptionFilter', () => {
  it('should transform HttpException to standard error shape', () => {
    const filter = new StandardExceptionFilter();
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
    const host = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: () => ({ url: '/test' }),
      }),
    } as any;

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Not found',
        }),
      }),
    );
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
pnpm test -- src/shared/common/filters/http-exception.filter.spec.ts
```

Expected: FAIL — `StandardExceptionFilter` not found.

- [ ] **Step 5: Implement HTTP exception filter**

Create `src/shared/common/filters/http-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { createErrorResponse } from '../dto/error-response.dto';

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class StandardExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ?? exception.message;
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const { message: _, statusCode: __, error: ___, ...rest } =
          exceptionResponse as Record<string, unknown>;
        if (Object.keys(rest).length > 0) {
          details = rest;
        }
      }
    }

    const code = STATUS_CODE_MAP[status] ?? 'INTERNAL_SERVER_ERROR';
    response.status(status).json(createErrorResponse(code, message, details));
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm test -- src/shared/common/filters/http-exception.filter.spec.ts
```

Expected: PASS

- [ ] **Step 7: Write Zod validation pipe test**

Create `src/shared/common/pipes/zod-validation.pipe.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string(),
    amount: z.coerce.number().positive(),
  });

  it('should pass valid data through', () => {
    const pipe = new ZodValidationPipe(schema);
    const result = pipe.transform({ name: 'test', amount: '100' }, {} as any);
    expect(result).toEqual({ name: 'test', amount: 100 });
  });

  it('should throw BadRequestException for invalid data', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() =>
      pipe.transform({ name: 123 }, {} as any),
    ).toThrow(BadRequestException);
  });
});
```

- [ ] **Step 8: Implement Zod validation pipe**

Create `src/shared/common/pipes/zod-validation.pipe.ts`:

```typescript
import {
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formatted = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formatted,
      });
    }
    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!formatted[path]) formatted[path] = [];
      formatted[path].push(issue.message);
    }
    return formatted;
  }
}
```

- [ ] **Step 9: Run tests to verify all pass**

```bash
pnpm test -- src/shared/common
```

Expected: PASS

- [ ] **Step 10: Update `main.ts` with global filter, logging, and Swagger**

```typescript
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StandardExceptionFilter } from './shared/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new StandardExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ladder Markets API')
    .setDescription('Backend MVP for the one-market private pilot')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

void bootstrap();
```

- [ ] **Step 11: Wire pino logger into AppModule**

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { BlockchainModule } from './shared/blockchain/blockchain.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    DatabaseModule,
    BlockchainModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(common): add standard error filter, Zod validation pipe, and pino logging"
```

---

## Phase 3: Docker & Dev Environment

### Task 10: Docker Compose + env files

**Files:**
- Create: `backend/docker/docker-compose.yml`
- Create: `backend/docker/Dockerfile`
- Create: `backend/.env.example`

- [ ] **Step 1: Create `docker/docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: ladder_dev
      POSTGRES_USER: ladder
      POSTGRES_PASSWORD: ladder_local
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ladder']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

- [ ] **Step 2: Create `docker/Dockerfile`**

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

- [ ] **Step 3: Create `.env.example`**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://ladder:ladder_local@localhost:5432/ladder_dev
RPC_URL=http://localhost:8545
MARKET_ADDRESS=0x0000000000000000000000000000000000000000
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add Docker Compose, Dockerfile, and env example"
```

---

### Task 11: Health check endpoint

**Files:**
- Create: `backend/src/shared/common/health/health.controller.ts`
- Create: `backend/src/shared/common/health/health.controller.spec.ts`

- [ ] **Step 1: Install Terminus**

```bash
pnpm add @nestjs/terminus
```

- [ ] **Step 2: Write failing test**

Create `src/shared/common/health/health.controller.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    }).compile();

    const controller = module.get(HealthController);
    expect(controller).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm test -- src/shared/common/health/health.controller.spec.ts
```

Expected: FAIL — `HealthController` not found.

- [ ] **Step 4: Implement health controller**

Create `src/shared/common/health/health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test -- src/shared/common/health/health.controller.spec.ts
```

Expected: PASS

- [ ] **Step 6: Wire into AppModule**

Add `TerminusModule` and `HealthController` to `AppModule`:

```typescript
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './shared/common/health/health.controller';

// In @Module:
imports: [..., TerminusModule],
controllers: [HealthController],
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(health): add health check endpoint with Terminus"
```

---

### Task 12: Create backend docs structure and placeholders

**Files:**
- Create: `backend/docs/setup.md`
- Create: `backend/docs/architecture.md`
- Create: `backend/docs/adr/.gitkeep`
- Create: `backend/docs/modules/.gitkeep`
- Create: `backend/src/shared/common/interceptors/.gitkeep`
- Create: `backend/src/shared/common/guards/.gitkeep`
- Create: `backend/test/fixtures/.gitkeep`
- Create: `backend/test/integration/.gitkeep`
- Create: `backend/test/chain/.gitkeep`
- Create: `backend/test/e2e/.gitkeep`

- [ ] **Step 1: Create `docs/setup.md`**

```markdown
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
6. Open http://localhost:3000/health
7. Open http://localhost:3000/api-docs (Swagger)
```

- [ ] **Step 2: Create `docs/architecture.md`**

```markdown
# Backend Architecture

See `docs/canonical/backend-architecture.md` in the project root for the canonical reference.

This backend is a TypeScript modular monolith using feature-first flat modules.
Each module maps 1:1 with the canonical architecture. See individual module READMEs for details.

## Module dependency graph

- `admin-ops` → `oracle`, `risk-monitoring`, `deposit-requests`, `market-state`
- `market-state` → `chain-projector`, `shared/database`, `shared/blockchain`
- `quotes` → `market-state`, `shared/blockchain`
- `portfolio` → `chain-projector`, `shared/database`, `shared/blockchain`
- `deposit-requests` → `chain-projector`, `shared/database`
- `oracle` → `shared/blockchain`, `shared/database`
- `risk-monitoring` → `market-state`, `shared/database`
- `chain-projector` → `shared/blockchain`, `shared/database`
```

- [ ] **Step 3: Create placeholder directories**

```bash
mkdir -p docs/adr docs/modules src/shared/common/interceptors src/shared/common/guards test/fixtures test/integration test/chain test/e2e
touch docs/adr/.gitkeep docs/modules/.gitkeep src/shared/common/interceptors/.gitkeep src/shared/common/guards/.gitkeep test/fixtures/.gitkeep test/chain/.gitkeep test/e2e/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: add backend docs structure and placeholder directories"
```

---

### Task 12b: Verify full dev environment

- [ ] **Step 1: Copy env file and start PostgreSQL**

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
```

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Run all unit tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 4: Run lint**

```bash
pnpm lint
```

Expected: No errors.

- [ ] **Step 5: Start app and probe health endpoint**

```bash
pnpm dev &
sleep 3
curl -s http://localhost:3000/health | head -20
```

Expected: JSON response with `{"status":"ok","info":{},...}`.

- [ ] **Step 6: Probe Swagger docs**

```bash
curl -s http://localhost:3000/api-docs -o /dev/null -w "%{http_code}"
```

Expected: `200`.

- [ ] **Step 7: Stop dev server**

Kill the background process started in step 5.

---

## Phase 4: Module Shells

### Task 13: Chain Projector module shell

**Files:**
- Create: `backend/src/modules/chain-projector/chain-projector.module.ts`
- Create: `backend/src/modules/chain-projector/chain-projector.service.ts`
- Create: `backend/src/modules/chain-projector/chain-projector.service.spec.ts`
- Create: `backend/src/modules/chain-projector/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/chain-projector/chain-projector.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { ChainProjectorService } from './chain-projector.service';

describe('ChainProjectorService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [ChainProjectorService],
    }).compile();
    expect(module.get(ChainProjectorService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/chain-projector/chain-projector.service.spec.ts
```

Expected: FAIL — `ChainProjectorService` not found.

- [ ] **Step 3: Create service**

```typescript
// src/modules/chain-projector/chain-projector.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChainProjectorService {
  // Indexes contract events, maintains cursors, replay, reorg handling
}
```

- [ ] **Step 4: Create module**

```typescript
// src/modules/chain-projector/chain-projector.module.ts
import { Module } from '@nestjs/common';
import { ChainProjectorService } from './chain-projector.service';

@Module({
  providers: [ChainProjectorService],
  exports: [ChainProjectorService],
})
export class ChainProjectorModule {}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test -- src/modules/chain-projector/chain-projector.service.spec.ts
```

Expected: PASS

- [ ] **Step 6: Create README**

```markdown
# Chain Projector

Indexes contract events from Market.sol, maintains projector cursors, handles replay and reorg recovery.

## Responsibility
- Listen to / poll for on-chain events (Data Plane)
- Maintain `projector_cursors` for reliable indexing
- Write raw events to `market_events` table
- Trigger downstream snapshot updates

## Dependencies
- `shared/blockchain` — viem client for event fetching
- `shared/database` — Drizzle for persistence

## Events indexed
See `docs/canonical/smartcontract-events.md` for full event list.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(chain-projector): add module shell"
```

---

### Task 14: Market State module shell

**Files:**
- Create: `backend/src/modules/market-state/market-state.module.ts`
- Create: `backend/src/modules/market-state/market-state.controller.ts`
- Create: `backend/src/modules/market-state/market-state.service.ts`
- Create: `backend/src/modules/market-state/market-state.service.spec.ts`
- Create: `backend/src/modules/market-state/dto/.gitkeep`
- Create: `backend/src/modules/market-state/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/market-state/market-state.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { MarketStateService } from './market-state.service';

describe('MarketStateService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [MarketStateService],
    }).compile();
    expect(module.get(MarketStateService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/market-state/market-state.service.spec.ts
```

Expected: FAIL — `MarketStateService` not found.

- [ ] **Step 3: Create service, controller, module**

Service:
```typescript
// src/modules/market-state/market-state.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketStateService {
  // Build current market snapshots from contract reads and indexed events
}
```

Controller:
```typescript
// src/modules/market-state/market-state.controller.ts
import { Controller } from '@nestjs/common';
import { MarketStateService } from './market-state.service';

@Controller('markets')
export class MarketStateController {
  constructor(private readonly marketState: MarketStateService) {}
}
```

Module:
```typescript
// src/modules/market-state/market-state.module.ts
import { Module } from '@nestjs/common';
import { MarketStateController } from './market-state.controller';
import { MarketStateService } from './market-state.service';

@Module({
  controllers: [MarketStateController],
  providers: [MarketStateService],
  exports: [MarketStateService],
})
export class MarketStateModule {}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- src/modules/market-state/market-state.service.spec.ts
```

Expected: PASS

- [ ] **Step 5: Create README, `dto/.gitkeep`**

```markdown
# Market State

Builds current market snapshots from contract reads and indexed events. Serves public market endpoints.

## API endpoints (from `docs/canonical/api-contract.md`)
- `GET /markets` — list markets
- `GET /markets/:address` — market detail
- `GET /markets/:address/history` — historical snapshots
- `GET /markets/:address/deposit-limits` — deposit capacity
- `GET /markets/:address/price-status` — price freshness

## Dependencies
- `chain-projector` — indexed events
- `shared/database` — market_snapshots, markets tables
- `shared/blockchain` — live contract reads
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(market-state): add module shell"
```

---

### Task 15: Oracle module shell (headless)

**Files:**
- Create: `backend/src/modules/oracle/oracle.module.ts`
- Create: `backend/src/modules/oracle/oracle.service.ts`
- Create: `backend/src/modules/oracle/oracle.service.spec.ts`
- Create: `backend/src/modules/oracle/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/oracle/oracle.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { OracleService } from './oracle.service';

describe('OracleService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [OracleService],
    }).compile();
    expect(module.get(OracleService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/oracle/oracle.service.spec.ts
```

Expected: FAIL — `OracleService` not found.

- [ ] **Step 3: Create service, module (no controller — headless)**

Service:
```typescript
// src/modules/oracle/oracle.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class OracleService {
  // Store raw reports, manage safe adaptor/manual price update flows
}
```

Module:
```typescript
// src/modules/oracle/oracle.module.ts
import { Module } from '@nestjs/common';
import { OracleService } from './oracle.service';

@Module({
  providers: [OracleService],
  exports: [OracleService],
})
export class OracleModule {}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- src/modules/oracle/oracle.service.spec.ts
```

Expected: PASS

- [ ] **Step 5: Create README**

```markdown
# Oracle

Headless domain service for price updates. No HTTP controller — admin endpoints are served by `admin-ops`.

## Responsibility
- Store raw price reports to `price_reports_raw`
- Manage safe adaptor and manual price update flows
- Check price freshness and staleness

## Consumed by
- `admin-ops` controller for `POST /admin/markets/:address/trigger-update-from-adaptor` and `POST /admin/markets/:address/price-updates`
- `market-state` for price freshness in `GET /markets/:address/price-status`
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(oracle): add headless module shell"
```

---

### Task 16: Deposit Requests module shell

**Files:**
- Create: `backend/src/modules/deposit-requests/deposit-requests.module.ts`
- Create: `backend/src/modules/deposit-requests/deposit-requests.controller.ts`
- Create: `backend/src/modules/deposit-requests/deposit-requests.service.ts`
- Create: `backend/src/modules/deposit-requests/deposit-requests.service.spec.ts`
- Create: `backend/src/modules/deposit-requests/dto/.gitkeep`
- Create: `backend/src/modules/deposit-requests/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/deposit-requests/deposit-requests.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { DepositRequestsService } from './deposit-requests.service';

describe('DepositRequestsService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [DepositRequestsService],
    }).compile();
    expect(module.get(DepositRequestsService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/deposit-requests/deposit-requests.service.spec.ts
```

Expected: FAIL — `DepositRequestsService` not found.

- [ ] **Step 3: Create service, controller, module**

Service:
```typescript
// src/modules/deposit-requests/deposit-requests.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DepositRequestsService {
  // Track async base deposit lifecycle from request to settlement or refund
}
```

Controller:
```typescript
// src/modules/deposit-requests/deposit-requests.controller.ts
import { Controller } from '@nestjs/common';
import { DepositRequestsService } from './deposit-requests.service';

@Controller('deposit-requests')
export class DepositRequestsController {
  constructor(private readonly depositRequests: DepositRequestsService) {}
}
```

Module:
```typescript
// src/modules/deposit-requests/deposit-requests.module.ts
import { Module } from '@nestjs/common';
import { DepositRequestsController } from './deposit-requests.controller';
import { DepositRequestsService } from './deposit-requests.service';

@Module({
  controllers: [DepositRequestsController],
  providers: [DepositRequestsService],
  exports: [DepositRequestsService],
})
export class DepositRequestsModule {}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- src/modules/deposit-requests/deposit-requests.service.spec.ts
```

Expected: PASS

- [ ] **Step 5: Create README, `dto/.gitkeep`**

```markdown
# Deposit Requests

Tracks async base deposit lifecycle from request to settlement or refund.

## API endpoints
- `POST /deposit-requests` — register async base deposit request

## State machine (from contract events)
`DepositRequested` → `DepositBasePulled` → `DepositSettled` | `DepositRejected` → `DepositRefunded`

## Dependencies
- `chain-projector` — indexed deposit events
- `shared/database` — deposit_requests table
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(deposit-requests): add module shell"
```

---

### Task 17: Quotes module shell

**Files:**
- Create: `backend/src/modules/quotes/quotes.module.ts`
- Create: `backend/src/modules/quotes/quotes.controller.ts`
- Create: `backend/src/modules/quotes/quotes.service.ts`
- Create: `backend/src/modules/quotes/quotes.service.spec.ts`
- Create: `backend/src/modules/quotes/dto/.gitkeep`
- Create: `backend/src/modules/quotes/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/quotes/quotes.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { QuotesService } from './quotes.service';

describe('QuotesService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [QuotesService],
    }).compile();
    expect(module.get(QuotesService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/quotes/quotes.service.spec.ts
```

Expected: FAIL — `QuotesService` not found.

- [ ] **Step 3: Create service, controller, module**

Service:
```typescript
// src/modules/quotes/quotes.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuotesService {
  // Run preflight reads and simulations for direct YT and base deposit flows
}
```

Controller:
```typescript
// src/modules/quotes/quotes.controller.ts
import { Controller } from '@nestjs/common';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}
}
```

Module:
```typescript
// src/modules/quotes/quotes.module.ts
import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
```

- [ ] **Step 4: Create README**

```markdown
# Quotes

Preflight reads and simulations for deposit/withdraw flows.

## API endpoints (from `docs/canonical/api-contract.md`)
- `POST /quotes/deposit-yt` — preview direct YT deposit
- `POST /quotes/withdraw-yt` — preview direct YT withdraw
- `POST /quotes/deposit-base` — preview async base deposit

## Dependencies
- `market-state` — current NAV, ratio, halt status
- `shared/blockchain` — contract reads for simulation
```

- [ ] **Step 5: Run test to verify it passes, create `dto/.gitkeep`, commit**

```bash
pnpm test -- src/modules/quotes && git add -A && git commit -m "feat(quotes): add module shell"
```

---

### Task 18: Portfolio module shell

**Files:**
- Create: `backend/src/modules/portfolio/portfolio.module.ts`
- Create: `backend/src/modules/portfolio/portfolio.controller.ts`
- Create: `backend/src/modules/portfolio/portfolio.service.ts`
- Create: `backend/src/modules/portfolio/portfolio.service.spec.ts`
- Create: `backend/src/modules/portfolio/dto/.gitkeep`
- Create: `backend/src/modules/portfolio/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/portfolio/portfolio.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [PortfolioService],
    }).compile();
    expect(module.get(PortfolioService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/portfolio/portfolio.service.spec.ts
```

Expected: FAIL — `PortfolioService` not found.

- [ ] **Step 3: Create service, controller, module**

Service:
```typescript
// src/modules/portfolio/portfolio.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PortfolioService {
  // Expose balances, pending requests, and user activity views
}
```

Controller:
```typescript
// src/modules/portfolio/portfolio.controller.ts
import { Controller } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}
}
```

Module:
```typescript
// src/modules/portfolio/portfolio.module.ts
import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
```

- [ ] **Step 4: Create README**

```markdown
# Portfolio

User balances, pending requests, and activity views.

## API endpoints (from `docs/canonical/api-contract.md`)
- `GET /portfolio/:address` — user balances + pending requests
- `GET /portfolio/:address/requests` — request history from indexed deposit events

## Dependencies
- `chain-projector` — indexed events for request history
- `shared/database` — portfolio_positions table
- `shared/blockchain` — live balance reads
```

- [ ] **Step 5: Run test to verify it passes, create `dto/.gitkeep`, commit**

```bash
pnpm test -- src/modules/portfolio && git add -A && git commit -m "feat(portfolio): add module shell"
```

---

### Task 19: Risk Monitoring module shell (headless)

**Files:**
- Create: `backend/src/modules/risk-monitoring/risk-monitoring.module.ts`
- Create: `backend/src/modules/risk-monitoring/risk-monitoring.service.ts`
- Create: `backend/src/modules/risk-monitoring/risk-monitoring.service.spec.ts`
- Create: `backend/src/modules/risk-monitoring/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/risk-monitoring/risk-monitoring.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { RiskMonitoringService } from './risk-monitoring.service';

describe('RiskMonitoringService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [RiskMonitoringService],
    }).compile();
    expect(module.get(RiskMonitoringService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/risk-monitoring/risk-monitoring.service.spec.ts
```

Expected: FAIL — `RiskMonitoringService` not found.

- [ ] **Step 3: Create service, module (no controller — headless)**

Service:
```typescript
// src/modules/risk-monitoring/risk-monitoring.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class RiskMonitoringService {
  // Detect stale price, ratio-near-limit, halted market, request failures
}
```

Module:
```typescript
// src/modules/risk-monitoring/risk-monitoring.module.ts
import { Module } from '@nestjs/common';
import { RiskMonitoringService } from './risk-monitoring.service';

@Module({
  providers: [RiskMonitoringService],
  exports: [RiskMonitoringService],
})
export class RiskMonitoringModule {}
```

- [ ] **Step 4: Create README**

```markdown
# Risk Monitoring

Headless domain service for risk detection. No HTTP controller — admin endpoints served by `admin-ops`.

## Responsibility
- Detect stale price conditions
- Monitor leverage ratio approaching limits
- Detect halted market state
- Track async request failures

## Consumed by
- `admin-ops` controller for `GET /admin/risk-alerts` and `POST /admin/risk-alerts/:id/ack`
```

- [ ] **Step 5: Run test to verify it passes, commit**

```bash
pnpm test -- src/modules/risk-monitoring && git add -A && git commit -m "feat(risk-monitoring): add headless module shell"
```

---

### Task 20: Admin Ops module shell

**Files:**
- Create: `backend/src/modules/admin-ops/admin-ops.module.ts`
- Create: `backend/src/modules/admin-ops/admin-ops.controller.ts`
- Create: `backend/src/modules/admin-ops/admin-ops.service.ts`
- Create: `backend/src/modules/admin-ops/admin-ops.service.spec.ts`
- Create: `backend/src/modules/admin-ops/dto/.gitkeep`
- Create: `backend/src/modules/admin-ops/README.md`

- [ ] **Step 1: Write failing test**

Create `src/modules/admin-ops/admin-ops.service.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { AdminOpsService } from './admin-ops.service';

describe('AdminOpsService', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [AdminOpsService],
    }).compile();
    expect(module.get(AdminOpsService)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/modules/admin-ops/admin-ops.service.spec.ts
```

Expected: FAIL — `AdminOpsService` not found.

- [ ] **Step 3: Create service, controller, module**

Service:
```typescript
// src/modules/admin-ops/admin-ops.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminOpsService {
  // Show health views, audit logs, and operator actions
}
```

Controller:
```typescript
// src/modules/admin-ops/admin-ops.controller.ts
import { Controller } from '@nestjs/common';
import { AdminOpsService } from './admin-ops.service';

@Controller('admin')
export class AdminOpsController {
  constructor(private readonly adminOps: AdminOpsService) {}
}
```

Module:
```typescript
// src/modules/admin-ops/admin-ops.module.ts
import { Module } from '@nestjs/common';
import { AdminOpsController } from './admin-ops.controller';
import { AdminOpsService } from './admin-ops.service';

@Module({
  controllers: [AdminOpsController],
  providers: [AdminOpsService],
  exports: [AdminOpsService],
})
export class AdminOpsModule {}
```

- [ ] **Step 4: Create README**

```markdown
# Admin Ops

HTTP layer for all admin operations. Injects headless domain services (oracle, risk-monitoring) for price updates and risk alerts.

## API endpoints (from `docs/canonical/api-contract.md`)
- `GET /admin/markets/:address/health`
- `GET /admin/markets/:address/deposit-requests`
- `POST /admin/markets/:address/trigger-update-from-adaptor`
- `POST /admin/markets/:address/price-updates`
- `POST /admin/markets/:address/deposit-requests/:id/reject`
- `POST /admin/markets/:address/collect-fees`
- `GET /admin/actions`
- `GET /admin/risk-alerts`
- `POST /admin/risk-alerts/:id/ack`

## Dependencies
- `oracle` — price update logic
- `risk-monitoring` — risk alert data
- `deposit-requests` — request lifecycle
- `market-state` — market health data
```

- [ ] **Step 5: Run test to verify it passes, create `dto/.gitkeep`, commit**

```bash
pnpm test -- src/modules/admin-ops && git add -A && git commit -m "feat(admin-ops): add module shell"
```

---

### Task 21: Wire all modules into AppModule

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Import all modules**

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { BlockchainModule } from './shared/blockchain/blockchain.module';
import { HealthController } from './shared/common/health/health.controller';
import { ChainProjectorModule } from './modules/chain-projector/chain-projector.module';
import { MarketStateModule } from './modules/market-state/market-state.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { DepositRequestsModule } from './modules/deposit-requests/deposit-requests.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { RiskMonitoringModule } from './modules/risk-monitoring/risk-monitoring.module';
import { AdminOpsModule } from './modules/admin-ops/admin-ops.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    TerminusModule,
    DatabaseModule,
    BlockchainModule,
    ChainProjectorModule,
    MarketStateModule,
    OracleModule,
    DepositRequestsModule,
    QuotesModule,
    PortfolioModule,
    RiskMonitoringModule,
    AdminOpsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 2: Verify: build succeeds, all tests pass, no circular deps**

```bash
pnpm build && pnpm test
```

Expected: Build OK, all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: wire all module shells into AppModule"
```

---

## Phase 5: DB Schema & Migrations

### Task 22: Drizzle schema for 10 MVP tables

**Files:**
- Create: `backend/src/shared/database/schema/markets.ts`
- Create: `backend/src/shared/database/schema/market-snapshots.ts`
- Create: `backend/src/shared/database/schema/market-events.ts`
- Create: `backend/src/shared/database/schema/projector-cursors.ts`
- Create: `backend/src/shared/database/schema/price-reports-raw.ts`
- Create: `backend/src/shared/database/schema/price-updates.ts`
- Create: `backend/src/shared/database/schema/deposit-requests.ts`
- Create: `backend/src/shared/database/schema/portfolio-positions.ts`
- Create: `backend/src/shared/database/schema/risk-alerts.ts`
- Create: `backend/src/shared/database/schema/operator-actions.ts`
- Modify: `backend/src/shared/database/schema/index.ts`

- [ ] **Step 1: Create `schema/markets.ts`**

```typescript
import { pgTable, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const markets = pgTable('markets', {
  address: varchar('address', { length: 42 }).primaryKey(),
  name: text('name').notNull(),
  ytTokenAddress: varchar('yt_token_address', { length: 42 }).notNull(),
  baseTokenAddress: varchar('base_token_address', { length: 42 }).notNull(),
  seniorTrancheAddress: varchar('senior_tranche_address', { length: 42 }).notNull(),
  juniorTrancheAddress: varchar('junior_tranche_address', { length: 42 }).notNull(),
  halted: boolean('halted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 2: Create `schema/market-snapshots.ts`**

```typescript
import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const marketSnapshots = pgTable('market_snapshots', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  nav: text('nav').notNull(),
  navSt: text('nav_st').notNull(),
  navJt: text('nav_jt').notNull(),
  jtStRatio: text('jt_st_ratio').notNull(),
  ytPrice: text('yt_price').notNull(),
  halted: text('halted').notNull(),
  blockNumber: text('block_number').notNull(),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 3: Create `schema/market-events.ts`**

```typescript
import { pgTable, serial, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const marketEvents = pgTable('market_events', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  eventName: varchar('event_name', { length: 64 }).notNull(),
  blockNumber: text('block_number').notNull(),
  txHash: varchar('tx_hash', { length: 66 }).notNull(),
  logIndex: text('log_index').notNull(),
  args: jsonb('args').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: Create `schema/projector-cursors.ts`**

```typescript
import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const projectorCursors = pgTable('projector_cursors', {
  id: varchar('id', { length: 128 }).primaryKey(),
  lastBlockNumber: text('last_block_number').notNull(),
  lastLogIndex: text('last_log_index').notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 5: Create `schema/price-reports-raw.ts`**

```typescript
import { pgTable, serial, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const priceReportsRaw = pgTable('price_reports_raw', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  source: varchar('source', { length: 32 }).notNull(),
  rawPrice: text('raw_price').notNull(),
  oracleTimestamp: text('oracle_timestamp').notNull(),
  metadata: jsonb('metadata'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 6: Create `schema/price-updates.ts`**

```typescript
import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const priceUpdates = pgTable('price_updates', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  newPrice: text('new_price').notNull(),
  oracleTimestamp: text('oracle_timestamp').notNull(),
  navAfter: text('nav_after').notNull(),
  navStAfter: text('nav_st_after').notNull(),
  navJtAfter: text('nav_jt_after').notNull(),
  jtStRatioAfter: text('jt_st_ratio_after').notNull(),
  halted: boolean('halted').notNull().default(false),
  txHash: varchar('tx_hash', { length: 66 }),
  blockNumber: text('block_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 7: Create `schema/deposit-requests.ts`**

```typescript
import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const depositRequests = pgTable('deposit_requests', {
  id: serial('id').primaryKey(),
  requestId: text('request_id').notNull().unique(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  user: varchar('user', { length: 42 }).notNull(),
  receiver: varchar('receiver', { length: 42 }).notNull(),
  asSenior: boolean('as_senior').notNull(),
  tokenIn: varchar('token_in', { length: 42 }).notNull(),
  amountIn: text('amount_in').notNull(),
  minYtOut: text('min_yt_out').notNull(),
  status: varchar('status', { length: 32 }).notNull().default('requested'),
  reasonCode: text('reason_code'),
  txHash: varchar('tx_hash', { length: 66 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 8: Create `schema/portfolio-positions.ts`**

```typescript
import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const portfolioPositions = pgTable('portfolio_positions', {
  id: serial('id').primaryKey(),
  userAddress: varchar('user_address', { length: 42 }).notNull(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  seniorShares: text('senior_shares').notNull().default('0'),
  juniorShares: text('junior_shares').notNull().default('0'),
  lastUpdatedBlock: text('last_updated_block').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 9: Create `schema/risk-alerts.ts`**

```typescript
import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { markets } from './markets';

export const riskAlerts = pgTable('risk_alerts', {
  id: serial('id').primaryKey(),
  marketAddress: varchar('market_address', { length: 42 })
    .notNull()
    .references(() => markets.address),
  alertType: varchar('alert_type', { length: 64 }).notNull(),
  severity: varchar('severity', { length: 16 }).notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'),
  acknowledged: boolean('acknowledged').notNull().default(false),
  acknowledgedBy: varchar('acknowledged_by', { length: 42 }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 10: Create `schema/operator-actions.ts`**

```typescript
import { pgTable, serial, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const operatorActions = pgTable('operator_actions', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 64 }).notNull(),
  operatorAddress: varchar('operator_address', { length: 42 }).notNull(),
  marketAddress: varchar('market_address', { length: 42 }),
  txHash: varchar('tx_hash', { length: 66 }),
  params: jsonb('params'),
  result: jsonb('result'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 11: Update schema barrel export**

Update `src/shared/database/schema/index.ts`:

```typescript
export { markets } from './markets';
export { marketSnapshots } from './market-snapshots';
export { marketEvents } from './market-events';
export { projectorCursors } from './projector-cursors';
export { priceReportsRaw } from './price-reports-raw';
export { priceUpdates } from './price-updates';
export { depositRequests } from './deposit-requests';
export { portfolioPositions } from './portfolio-positions';
export { riskAlerts } from './risk-alerts';
export { operatorActions } from './operator-actions';
```

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(database): add Drizzle schema for 10 MVP tables"
```

---

### Task 23: Generate and run first migration

- [ ] **Step 1: Start PostgreSQL if not running**

```bash
docker compose -f docker/docker-compose.yml up -d
```

- [ ] **Step 2: Copy env file**

```bash
cp .env.example .env
```

- [ ] **Step 3: Generate migration**

```bash
pnpm db:generate
```

Expected: Migration files created in `src/shared/database/migrations/`

- [ ] **Step 4: Run migration**

```bash
pnpm db:migrate
```

Expected: All tables created successfully.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(database): generate initial migration for 10 MVP tables"
```

---

### Task 24: Testcontainers integration test setup

**Files:**
- Create: `backend/test/integration/global-setup.ts`
- Create: `backend/test/integration/database.integration.spec.ts`

- [ ] **Step 1: Install testcontainers**

```bash
pnpm add -D @testcontainers/postgresql testcontainers
```

- [ ] **Step 2: Create global setup**

Create `test/integration/global-setup.ts`:

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { GlobalSetupContext } from 'vitest/node';

let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;

export async function setup({ provide }: GlobalSetupContext) {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();

  provide('DATABASE_URL', container.getConnectionUri());
}

export async function teardown() {
  await container?.stop();
}

declare module 'vitest' {
  export interface ProvidedContext {
    DATABASE_URL: string;
  }
}
```

- [ ] **Step 3: Create integration test**

Create `test/integration/database.integration.spec.ts`:

```typescript
import { describe, it, expect, inject } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

describe('Database Integration', () => {
  it('should connect to PostgreSQL via testcontainers', async () => {
    const databaseUrl = inject('DATABASE_URL');
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    const result = await db.execute(sql`SELECT 1 as value`);
    expect(result[0]?.value).toBe(1);

    await client.end();
  });
});
```

- [ ] **Step 4: Run integration test**

```bash
pnpm test:int
```

Expected: PASS — connects to real PostgreSQL container.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: add testcontainers setup and database integration test"
```

---

### Task 25: Final verification

- [ ] **Step 1: Run all unit tests**

```bash
pnpm test
```

Expected: All pass.

- [ ] **Step 2: Run integration tests**

```bash
pnpm test:int
```

Expected: All pass.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: Clean.

- [ ] **Step 4: Build**

```bash
pnpm build
```

Expected: Success.

- [ ] **Step 5: Verify folder structure matches spec**

```bash
find src -type f | sort
```

Cross-check against design spec folder structure.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: scaffold complete — all phases verified"
```

---

## Summary

| Phase | Tasks | Key deliverables |
|-------|-------|-----------------|
| 1: Bootstrap | 1–5 | Git, pnpm, NestJS, TypeScript, ESLint, Vitest, Swagger |
| 2: Shared Infra | 6–9 | Config (Zod), Database (Drizzle), Blockchain (viem), Common (error filter, Zod pipe, pino logging) |
| 3: Docker & Dev | 10–12b | Docker Compose, health check, backend docs, dev environment verified with HTTP probe |
| 4: Module Shells | 13–21 | 8 feature modules (TDD: test-first per module) wired into AppModule |
| 5: DB Schema | 22–25 | 10 Drizzle tables, migration, testcontainers, final verification |

**Total tasks:** 26 (including 12b)  
**Total commits:** ~22  
**Estimated time:** 3–4 hours for an experienced developer
