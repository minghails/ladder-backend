import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ViemClientService } from '@shared/blockchain/viem-client.service';
import { DependencyHealthIndicator } from './dependency-health.indicator';

const marketAddress = '0x1234567890123456789012345678901234567890';

function createIndicator(options?: {
  dbExecute?: () => Promise<unknown>;
  cursor?: { lastBlockNumber: string };
  getBlockNumber?: () => Promise<bigint>;
  timeoutMs?: number;
  maxLagBlocks?: number;
}) {
  const db = {
    execute: vi
      .fn()
      .mockImplementation(options?.dbExecute ?? (() => Promise.resolve([{ ok: 1 }]))),
    query: {
      projectorCursors: {
        findFirst: vi.fn().mockResolvedValue(
          options?.cursor ?? {
            lastBlockNumber: '98',
          },
        ),
      },
    },
  };
  const viem = {
    getChainId: vi.fn().mockReturnValue(84532),
    getMarketAddress: vi.fn().mockReturnValue(marketAddress),
    getPublicClient: vi.fn().mockReturnValue({
      getBlockNumber: vi
        .fn()
        .mockImplementation(options?.getBlockNumber ?? (() => Promise.resolve(100n))),
    }),
  };
  const config = {
    get: vi.fn((key: string) => {
      if (key === 'health.timeoutMs') {
        return options?.timeoutMs ?? 25;
      }
      if (key === 'health.projectorMaxLagBlocks') {
        return options?.maxLagBlocks ?? 10;
      }
      return undefined;
    }),
  };

  return {
    db,
    viem,
    indicator: new DependencyHealthIndicator(
      new HealthIndicatorService(),
      db,
      viem as unknown as ViemClientService,
      config as unknown as ConfigService,
    ),
  };
}

describe('DependencyHealthIndicator', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('reports dependencies up when DB, RPC, and projector freshness pass', async () => {
    const { db, indicator } = createIndicator();

    await expect(indicator.isHealthy()).resolves.toEqual({
      dependencies: {
        status: 'up',
        database: { status: 'up' },
        rpc: { status: 'up', currentBlockNumber: '100' },
        projector: {
          status: 'up',
          currentBlockNumber: '100',
          lastBlockNumber: '98',
          lagBlocks: '2',
          maxLagBlocks: '10',
        },
      },
    });
    expect(db.execute).toHaveBeenCalledWith(sql`select 1`);
  });

  it('throws a health check error when DB is unreachable', async () => {
    const { indicator } = createIndicator({
      dbExecute: () => Promise.reject(new Error('connection refused')),
    });

    await expect(indicator.isHealthy()).resolves.toMatchObject({
      dependencies: {
        status: 'down',
        database: { status: 'down' },
      },
    });
  });

  it('throws a health check error when RPC is unreachable', async () => {
    const { indicator } = createIndicator({
      getBlockNumber: () => Promise.reject(new Error('rpc down')),
    });

    await expect(indicator.isHealthy()).resolves.toMatchObject({
      dependencies: {
        status: 'down',
        rpc: { status: 'down' },
      },
    });
  });

  it('throws a health check error when projector lag exceeds the configured threshold', async () => {
    const { indicator } = createIndicator({
      cursor: { lastBlockNumber: '80' },
      maxLagBlocks: 10,
    });

    await expect(indicator.isHealthy()).resolves.toMatchObject({
      dependencies: {
        status: 'down',
        projector: { status: 'down' },
      },
    });
  });

  it('times out slow checks so /health remains responsive', async () => {
    const { indicator } = createIndicator({
      dbExecute: () => new Promise((resolve) => setTimeout(resolve, 50)),
      timeoutMs: 5,
    });

    const startedAt = Date.now();
    await expect(indicator.isHealthy()).resolves.toMatchObject({
      dependencies: {
        status: 'down',
        database: { status: 'down' },
      },
    });
    expect(Date.now() - startedAt).toBeLessThan(45);
  });
});
