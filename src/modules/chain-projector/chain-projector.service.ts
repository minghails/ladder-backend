import {
  Inject,
  Injectable,
  Logger,
  Optional,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeEventLog, type Address, type Hex } from 'viem';
import { eq } from 'drizzle-orm';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { marketDisplaySymbol } from '@shared/blockchain/token-display.config';
import { ViemClientService } from '@shared/blockchain/viem-client.service';
import { JT_TRANCHE_ABI, MARKET_ABI, ST_TRANCHE_ABI } from '@shared/blockchain/contracts';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketEvents, markets, projectorCursors } from '@shared/database/schema';
import { normalizeEventArgs, SUPPORTED_MARKET_EVENT_NAMES } from './projector-events';
import type { ProjectedEventName } from './projector.types';
import { MarketSnapshotProjector } from './market-snapshot.projector';
import { PriceUpdateProjector } from './price-update.projector';
import { DepositRequestProjector } from './deposit-request.projector';
import { PortfolioAccountingRepository } from '../portfolio/portfolio-accounting.repository';
import { applyDeposit, applyWithdrawal, type CostBasisState } from '../portfolio/portfolio-accounting.service';

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
  address?: string | null;
  blockNumber?: bigint | null;
  blockHash?: string | null;
  transactionHash?: string | null;
  logIndex?: number | bigint | null;
  data?: Hex;
  topics?: readonly Hex[];
}

interface CompleteMarketLog {
  address?: string | null;
  blockNumber: bigint;
  blockHash: string;
  transactionHash: string;
  logIndex: number | bigint;
  data: Hex;
  topics: [Hex, ...Hex[]];
}

interface TrancheDepositEvent {
  txHash: string;
  logIndex: string;
  tranche: 'senior' | 'junior';
  owner: string;
  assets: string;
  shares: string;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function valueToString(value: unknown): string | null {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
}

function valueToBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function valueToAddress(value: unknown): string | null {
  return typeof value === 'string' ? normalizeAddress(value) : null;
}

function marketNameFromLiveState(live: LiveMarketState): string {
  const symbol = marketDisplaySymbol(live).trim();
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
    @Optional()
    private readonly snapshotProjector?: MarketSnapshotProjector,
    @Optional()
    private readonly priceUpdateProjector?: PriceUpdateProjector,
    @Optional()
    private readonly depositRequestProjector?: DepositRequestProjector,
    @Optional()
    private readonly portfolioAccountingRepository?: PortfolioAccountingRepository,
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

    const live = await this.bootstrapConfiguredMarket();
    const watchedAddresses = [
      marketAddress,
      normalizeAddress(live.seniorTrancheAddress),
      normalizeAddress(live.juniorTrancheAddress),
    ] as Address[];
    const logs = (await client.getLogs({
      address: watchedAddresses,
      fromBlock,
      toBlock,
    })) as RawMarketLog[];
    const blockTimestamps = await this.fetchBlockTimestamps(logs);
    const decoded = this.decodeLogs(
      logs,
      chainId,
      marketAddress,
      blockTimestamps,
      live,
    );

    if (decoded.events.length > 0) {
      await this.db
        .insert(marketEvents)
        .values(decoded.events)
        .onConflictDoNothing();
      await this.snapshotProjector?.projectEvents(decoded.events);
      await this.priceUpdateProjector?.projectEvents(decoded.events);
      await this.depositRequestProjector?.projectEvents(decoded.events);
      await this.projectPortfolioAccounting(decoded.events, decoded.trancheDeposits);
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

  private async bootstrapConfiguredMarket(): Promise<LiveMarketState> {
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

    return live;
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
    live: LiveMarketState,
  ): {
    events: (typeof marketEvents.$inferInsert)[];
    trancheDeposits: TrancheDepositEvent[];
    skipped: number;
  } {
    const events: (typeof marketEvents.$inferInsert)[] = [];
    const trancheDeposits: TrancheDepositEvent[] = [];
    let skipped = 0;

    for (const log of logs) {
      if (!hasCompleteLogIdentity(log)) {
        skipped += 1;
        continue;
      }

      try {
        const logAddress = normalizeAddress(log.address ?? marketAddress);
        const blockNumber = log.blockNumber.toString();
        const blockTimestamp = blockTimestamps.get(blockNumber);
        if (blockTimestamp === undefined) {
          skipped += 1;
          continue;
        }

        if (logAddress === normalizeAddress(live.seniorTrancheAddress) || logAddress === normalizeAddress(live.juniorTrancheAddress)) {
          const decoded = decodeEventLog({
            abi: logAddress === normalizeAddress(live.seniorTrancheAddress) ? ST_TRANCHE_ABI : JT_TRANCHE_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName !== 'Deposit') {
            skipped += 1;
            continue;
          }

          const args = normalizeEventArgs(decoded.args as Record<string, unknown>);
          trancheDeposits.push({
            txHash: log.transactionHash,
            logIndex: log.logIndex.toString(),
            tranche: logAddress === normalizeAddress(live.seniorTrancheAddress) ? 'senior' : 'junior',
            owner: normalizeAddress(String(args['owner'])),
            assets: String(args['assets']),
            shares: String(args['shares']),
          });
          continue;
        }

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

    return { events, trancheDeposits, skipped };
  }

  private async projectPortfolioAccounting(
    events: (typeof marketEvents.$inferInsert)[],
    trancheDeposits: TrancheDepositEvent[],
  ): Promise<void> {
    if (this.portfolioAccountingRepository === undefined) {
      return;
    }

    for (const event of events) {
      const args = event.args as Record<string, unknown>;

      if (event.eventName === 'DepositYT') {
        const asSenior = valueToBoolean(args['asSenior']);
        const shares = valueToString(args['shares']);
        const assets = valueToString(args['assets']);
        const value = valueToString(args['depositValue']);
        const user = valueToAddress(args['user']);

        if (asSenior === null || shares === null || assets === null || value === null || user === null) {
          continue;
        }

        const tranche = asSenior ? 'senior' : 'junior';
        const owner = this.findTrancheDepositOwner(event, trancheDeposits, tranche, assets, shares) ?? user;
        const inserted = await this.portfolioAccountingRepository.recordDepositCashflow({
          chainId: event.chainId,
          marketAddress: event.marketAddress,
          walletAddress: owner,
          tranche,
          shares,
          assets,
          value,
          txHash: event.txHash,
          logIndex: event.logIndex,
          blockNumber: event.blockNumber,
          blockTimestamp: event.blockTimestamp,
          sourceEventName: 'DepositYT',
        });
        await this.applyCostBasisIfInserted(inserted.inserted, owner, event.marketAddress, tranche, event.blockNumber, 'deposit', shares, value);
        continue;
      }

      if (event.eventName === 'DepositSettled') {
        const asSenior = valueToBoolean(args['asSenior']);
        const shares = valueToString(args['sharesMinted']);
        const assets = valueToString(args['ytIn']);
        const value = valueToString(args['depositValue']);
        const receiver = valueToAddress(args['receiver']);

        if (asSenior === null || shares === null || assets === null || value === null || receiver === null) {
          continue;
        }

        const tranche = asSenior ? 'senior' : 'junior';
        const inserted = await this.portfolioAccountingRepository.recordDepositCashflow({
          chainId: event.chainId,
          marketAddress: event.marketAddress,
          walletAddress: receiver,
          tranche,
          shares,
          assets,
          value,
          txHash: event.txHash,
          logIndex: event.logIndex,
          blockNumber: event.blockNumber,
          blockTimestamp: event.blockTimestamp,
          sourceEventName: 'DepositSettled',
        });
        await this.applyCostBasisIfInserted(inserted.inserted, receiver, event.marketAddress, tranche, event.blockNumber, 'deposit', shares, value);
        continue;
      }

      if (event.eventName === 'WithdrawYT') {
        const fromSenior = valueToBoolean(args['fromSenior']);
        const shares = valueToString(args['sharesIn']);
        const assets = valueToString(args['assetsOut']);
        const value = valueToString(args['withdrawValue']);
        const user = valueToAddress(args['user']);

        if (fromSenior === null || shares === null || assets === null || value === null || user === null) {
          continue;
        }

        const tranche = fromSenior ? 'senior' : 'junior';
        const inserted = await this.portfolioAccountingRepository.recordWithdrawalCashflow({
          chainId: event.chainId,
          marketAddress: event.marketAddress,
          walletAddress: user,
          tranche,
          shares,
          assets,
          value,
          txHash: event.txHash,
          logIndex: event.logIndex,
          blockNumber: event.blockNumber,
          blockTimestamp: event.blockTimestamp,
          sourceEventName: 'WithdrawYT',
        });
        await this.applyCostBasisIfInserted(inserted.inserted, user, event.marketAddress, tranche, event.blockNumber, 'withdraw', shares, value);
      }
    }
  }

  private findTrancheDepositOwner(
    event: typeof marketEvents.$inferInsert,
    trancheDeposits: TrancheDepositEvent[],
    tranche: 'senior' | 'junior',
    assets: string,
    shares: string,
  ): string | null {
    const eventLogIndex = BigInt(event.logIndex);
    const matches = trancheDeposits.filter(
      (deposit) =>
        deposit.txHash === event.txHash &&
        deposit.tranche === tranche &&
        deposit.assets === assets &&
        deposit.shares === shares &&
        BigInt(deposit.logIndex) > eventLogIndex,
    );

    const match = matches[0];
    return matches.length === 1 && match !== undefined ? match.owner : null;
  }

  private async applyCostBasisIfInserted(
    inserted: boolean,
    walletAddress: string,
    marketAddress: string,
    tranche: 'senior' | 'junior',
    blockNumber: string,
    type: 'deposit' | 'withdraw',
    shares: string,
    value: string,
  ): Promise<void> {
    if (!inserted || this.portfolioAccountingRepository === undefined) {
      return;
    }

    const existing = (await this.portfolioAccountingRepository.findCostBasisByWallet(walletAddress)).find(
      (row) =>
        typeof row.marketAddress === 'string' &&
        normalizeAddress(row.marketAddress) === normalizeAddress(marketAddress) &&
        row.tranche === tranche,
    );
    const state: CostBasisState = existing === undefined ? {
      openShares: '0',
      openCostBasis: '0',
      realizedPnl: '0',
      depositedValue: '0',
      withdrawnValue: '0',
      dataQuality: 'full',
    } : {
      openShares: existing.openShares,
      openCostBasis: existing.openCostBasis,
      realizedPnl: existing.realizedPnl,
      depositedValue: existing.depositedValue,
      withdrawnValue: existing.withdrawnValue,
      dataQuality: existing.dataQuality === 'partial' ? 'partial' : 'full',
    };
    const nextState = type === 'deposit' ? applyDeposit(state, { shares, value }) : applyWithdrawal(state, { shares, value });

    await this.portfolioAccountingRepository.upsertCostBasis({
      walletAddress,
      marketAddress,
      tranche,
      state: nextState,
      lastProcessedBlock: blockNumber,
    });
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
