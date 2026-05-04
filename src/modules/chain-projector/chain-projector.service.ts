import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeEventLog, type Address, type Hex } from 'viem';
import { eq } from 'drizzle-orm';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { ViemClientService } from '@shared/blockchain/viem-client.service';
import { MARKET_ABI } from '@shared/blockchain/contracts';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketEvents, markets, projectorCursors } from '@shared/database/schema';
import { normalizeEventArgs, SUPPORTED_MARKET_EVENT_NAMES } from './projector-events';
import type { ProjectedEventName } from './projector.types';

interface ChainProjectorDatabase {
  query: {
    projectorCursors: {
      findFirst: (config: unknown) => Promise<{ lastBlockNumber: string } | undefined>;
    };
  };
  insert: (table: unknown) => {
    values: (value: unknown) => {
      onConflictDoUpdate: (config: unknown) => Promise<unknown>;
      onConflictDoNothing: () => Promise<unknown>;
    };
  };
}

interface ProjectorBatchSummary {
  fromBlock: string;
  toBlock: string;
  logsFetched: number;
  eventsDecoded: number;
  eventsInserted: number;
  eventsSkipped: number;
  cursorUpdated: boolean;
}

interface RawMarketLog {
  blockNumber?: bigint | null;
  blockHash?: string | null;
  transactionHash?: string | null;
  logIndex?: number | bigint | null;
  data?: Hex;
  topics?: readonly Hex[];
}

interface CompleteMarketLog {
  blockNumber: bigint;
  blockHash: string;
  transactionHash: string;
  logIndex: number | bigint;
  data: Hex;
  topics: [Hex, ...Hex[]];
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function marketNameFromLiveState(live: LiveMarketState): string {
  const symbol = live.seniorSymbol.replace(/^st-/, '').trim();
  return symbol === '' ? normalizeAddress(live.address) : symbol;
}

@Injectable()
export class ChainProjectorService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ChainProjectorService.name);
  private isRunning = false;
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly contractReader: ContractReaderService,
    private readonly viem: ViemClientService,
    private readonly config: ConfigService,
    @Inject(DRIZZLE_DB)
    private readonly db: ChainProjectorDatabase,
  ) {}

  onApplicationBootstrap(): void {
    const enabled = this.config.get<boolean>('projector.enabled') ?? false;
    if (!enabled) {
      return;
    }

    const pollIntervalMs =
      this.config.get<number>('projector.pollIntervalMs') ?? 15_000;
    void this.runGuarded();
    this.interval = setInterval(() => {
      void this.runGuarded();
    }, pollIntervalMs);
    this.interval.unref();
  }

  onApplicationShutdown(): void {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  async runOnce(): Promise<ProjectorBatchSummary> {
    const client = this.viem.getPublicClient();
    const chainId = this.viem.getChainId();
    const marketAddress = normalizeAddress(this.viem.getMarketAddress());
    const deploymentBlock = BigInt(
      this.config.get<number>('projector.deploymentBlock') ?? 0,
    );
    const confirmations = BigInt(
      this.config.get<number>('projector.confirmations') ?? 3,
    );
    const batchSize = BigInt(this.config.get<number>('projector.batchSize') ?? 2_000);
    const head = await client.getBlockNumber();
    const safeToBlock = head >= confirmations ? head - confirmations : 0n;
    const cursorId = cursorIdForMarket(chainId, marketAddress);
    const cursor = await this.db.query.projectorCursors.findFirst({
      where: eq(projectorCursors.id, cursorId),
    });
    const fromBlock =
      cursor === undefined ? deploymentBlock : BigInt(cursor.lastBlockNumber) + 1n;

    if (fromBlock > safeToBlock) {
      return batchSummary(fromBlock, safeToBlock, false);
    }

    const toBlock = minBigInt(fromBlock + batchSize - 1n, safeToBlock);

    await this.bootstrapConfiguredMarket();
    const logs = (await client.getLogs({
      address: marketAddress as Address,
      fromBlock,
      toBlock,
    })) as RawMarketLog[];
    const blockTimestamps = await this.fetchBlockTimestamps(logs);
    const decoded = this.decodeLogs(logs, chainId, marketAddress, blockTimestamps);

    if (decoded.events.length > 0) {
      await this.db
        .insert(marketEvents)
        .values(decoded.events)
        .onConflictDoNothing();
    }

    await this.updateCursor(cursorId, chainId, marketAddress, toBlock);

    return {
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      logsFetched: logs.length,
      eventsDecoded: decoded.events.length,
      eventsInserted: decoded.events.length,
      eventsSkipped: decoded.skipped,
      cursorUpdated: true,
    };
  }

  private async runGuarded(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const summary = await this.runOnce();
      this.logger.log({ summary }, 'projector batch completed');
    } catch (error) {
      this.logger.error(error, 'projector batch failed');
    } finally {
      this.isRunning = false;
    }
  }

  private async bootstrapConfiguredMarket(): Promise<void> {
    const live = await this.contractReader.getMarketState();
    const now = new Date();
    const row = {
      address: normalizeAddress(live.address),
      name: marketNameFromLiveState(live),
      ytTokenAddress: normalizeAddress(live.ytTokenAddress),
      baseTokenAddress: normalizeAddress(live.baseTokenAddress),
      seniorTrancheAddress: normalizeAddress(live.seniorTrancheAddress),
      juniorTrancheAddress: normalizeAddress(live.juniorTrancheAddress),
      halted: live.halted,
      updatedAt: now,
    };

    await this.db
      .insert(markets)
      .values(row)
      .onConflictDoUpdate({
        target: markets.address,
        set: {
          name: row.name,
          ytTokenAddress: row.ytTokenAddress,
          baseTokenAddress: row.baseTokenAddress,
          seniorTrancheAddress: row.seniorTrancheAddress,
          juniorTrancheAddress: row.juniorTrancheAddress,
          halted: row.halted,
          updatedAt: now,
        },
      });
  }

  private async fetchBlockTimestamps(logs: RawMarketLog[]): Promise<Map<string, Date>> {
    const blockNumbers = [
      ...new Set(
        logs
          .map((log) => log.blockNumber)
          .filter((blockNumber): blockNumber is bigint => blockNumber !== undefined && blockNumber !== null)
          .map((blockNumber) => blockNumber.toString()),
      ),
    ];
    const timestamps = new Map<string, Date>();

    await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        const block = await this.viem.getPublicClient().getBlock({
          blockNumber: BigInt(blockNumber),
        });
        timestamps.set(blockNumber, new Date(Number(block.timestamp) * 1_000));
      }),
    );

    return timestamps;
  }

  private decodeLogs(
    logs: RawMarketLog[],
    chainId: number,
    marketAddress: string,
    blockTimestamps: Map<string, Date>,
  ): { events: (typeof marketEvents.$inferInsert)[]; skipped: number } {
    const events: (typeof marketEvents.$inferInsert)[] = [];
    let skipped = 0;

    for (const log of logs) {
      if (!hasCompleteLogIdentity(log)) {
        skipped += 1;
        continue;
      }

      try {
        const decoded = decodeEventLog({
          abi: MARKET_ABI,
          data: log.data,
          topics: log.topics,
        });
        const eventName = decoded.eventName;
        if (!isProjectedEventName(eventName)) {
          skipped += 1;
          continue;
        }
        const blockNumber = log.blockNumber.toString();
        const blockTimestamp = blockTimestamps.get(blockNumber);
        if (blockTimestamp === undefined) {
          skipped += 1;
          continue;
        }
        events.push({
          chainId,
          marketAddress,
          eventName,
          blockNumber,
          blockHash: log.blockHash,
          blockTimestamp,
          txHash: log.transactionHash,
          logIndex: log.logIndex.toString(),
          args: normalizeEventArgs(decoded.args as Record<string, unknown>),
        });
      } catch {
        skipped += 1;
      }
    }

    return { events, skipped };
  }

  private async updateCursor(
    cursorId: string,
    chainId: number,
    marketAddress: string,
    toBlock: bigint,
  ): Promise<void> {
    const row = {
      id: cursorId,
      chainId,
      marketAddress,
      lastBlockNumber: toBlock.toString(),
      lastLogIndex: '0',
      updatedAt: new Date(),
    };

    await this.db
      .insert(projectorCursors)
      .values(row)
      .onConflictDoUpdate({
        target: projectorCursors.id,
        set: {
          chainId: row.chainId,
          marketAddress: row.marketAddress,
          lastBlockNumber: row.lastBlockNumber,
          lastLogIndex: row.lastLogIndex,
          updatedAt: row.updatedAt,
        },
      });
  }
}

function cursorIdForMarket(chainId: number, marketAddress: string): string {
  return `market:${String(chainId)}:${normalizeAddress(marketAddress)}`;
}

function minBigInt(left: bigint, right: bigint): bigint {
  return left < right ? left : right;
}

function batchSummary(
  fromBlock: bigint,
  toBlock: bigint,
  cursorUpdated: boolean,
): ProjectorBatchSummary {
  return {
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    logsFetched: 0,
    eventsDecoded: 0,
    eventsInserted: 0,
    eventsSkipped: 0,
    cursorUpdated,
  };
}

function hasCompleteLogIdentity(log: RawMarketLog): log is CompleteMarketLog {
  return (
    log.blockNumber !== undefined &&
    log.blockNumber !== null &&
    log.blockHash !== undefined &&
    log.blockHash !== null &&
    log.transactionHash !== undefined &&
    log.transactionHash !== null &&
    log.logIndex !== undefined &&
    log.logIndex !== null &&
    log.data !== undefined &&
    log.topics !== undefined &&
    log.topics.length > 0
  );
}

function isProjectedEventName(eventName: string): eventName is ProjectedEventName {
  return SUPPORTED_MARKET_EVENT_NAMES.includes(eventName as ProjectedEventName);
}
