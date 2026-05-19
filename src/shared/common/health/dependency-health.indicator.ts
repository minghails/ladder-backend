import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { eq, sql, type SQL } from 'drizzle-orm';
import { ViemClientService } from '@shared/blockchain/viem-client.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { projectorCursors } from '@shared/database/schema';

interface ProjectorCursorRow {
  lastBlockNumber: string;
}

interface HealthDatabase {
  execute(query: SQL): Promise<unknown>;
  query: {
    projectorCursors: {
      findFirst(config: unknown): Promise<ProjectorCursorRow | undefined>;
    };
  };
}

type ComponentStatus = ComponentUpStatus | ComponentDownStatus;
type ComponentUpStatus = { status: 'up' } & Record<string, string>;
type ComponentDownStatus = { status: 'down'; reason: string } & Record<
  string,
  string
>;

@Injectable()
export class DependencyHealthIndicator {
  constructor(
    private readonly healthIndicator: HealthIndicatorService,
    @Inject(DRIZZLE_DB) private readonly db: HealthDatabase,
    private readonly viem: ViemClientService,
    private readonly config: ConfigService,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const timeoutMs = this.config.get<number>('health.timeoutMs') ?? 1_000;
    const maxLagBlocks =
      this.config.get<number>('health.projectorMaxLagBlocks') ?? 20;

    const database = await this.checkDatabase(timeoutMs);
    const rpc = await this.checkRpc(timeoutMs);
    const projectorLagCheckEnabled =
      this.config.get<boolean>('health.projectorLagCheckEnabled') ?? true;
    const projector =
      !projectorLagCheckEnabled
        ? { status: 'up' as const, lagCheck: 'disabled' }
        : rpc.status === 'up' && typeof rpc.currentBlockNumber === 'string'
          ? await this.checkProjectorFreshness(
              BigInt(rpc.currentBlockNumber),
              maxLagBlocks,
              timeoutMs,
            )
          : this.down('rpc unavailable');

    const details = { database, rpc, projector };
    const isHealthy =
      database.status === 'up' &&
      rpc.status === 'up' &&
      projector.status === 'up';

    if (!isHealthy) {
      return this.healthIndicator.check('dependencies').down(details);
    }

    return this.healthIndicator.check('dependencies').up(details);
  }

  private async checkDatabase(timeoutMs: number): Promise<ComponentStatus> {
    try {
      await withTimeout(this.db.execute(sql`select 1`), timeoutMs, 'database');
      return { status: 'up' };
    } catch (error) {
      return this.down(errorMessage(error));
    }
  }

  private async checkRpc(timeoutMs: number): Promise<ComponentStatus> {
    try {
      const currentBlockNumber = await withTimeout(
        this.viem.getPublicClient().getBlockNumber(),
        timeoutMs,
        'rpc',
      );
      return { status: 'up', currentBlockNumber: currentBlockNumber.toString() };
    } catch (error) {
      return this.down(errorMessage(error));
    }
  }

  private async checkProjectorFreshness(
    currentBlockNumber: bigint,
    maxLagBlocks: number,
    timeoutMs: number,
  ): Promise<ComponentStatus> {
    try {
      const chainId = String(this.viem.getChainId());
      const marketAddress = this.viem.getMarketAddress().toLowerCase();
      const cursor = await withTimeout(
        this.db.query.projectorCursors.findFirst({
          where: eq(projectorCursors.id, `market:${chainId}:${marketAddress}`),
        }),
        timeoutMs,
        'projector',
      );

      if (cursor === undefined) {
        return this.down('projector cursor missing');
      }

      const lastBlockNumber = BigInt(cursor.lastBlockNumber);
      const lagBlocks =
        currentBlockNumber > lastBlockNumber
          ? currentBlockNumber - lastBlockNumber
          : 0n;
      const shared = {
        currentBlockNumber: currentBlockNumber.toString(),
        lastBlockNumber: lastBlockNumber.toString(),
        lagBlocks: lagBlocks.toString(),
        maxLagBlocks: String(maxLagBlocks),
      };

      if (lagBlocks > BigInt(maxLagBlocks)) {
        return this.down('projector lag exceeds threshold', shared);
      }

      return { status: 'up', ...shared };
    } catch (error) {
      return this.down(errorMessage(error));
    }
  }

  private down(
    reason: string,
    details: Record<string, string> = {},
  ): ComponentStatus {
    return { status: 'down', reason, ...details };
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} health check timed out`));
      }, timeoutMs);
    }),
  ]);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown health check error';
}
