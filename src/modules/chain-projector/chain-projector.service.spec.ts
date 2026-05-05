import { afterEach, describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { encodeAbiParameters, encodeEventTopics } from 'viem';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { ViemClientService } from '@shared/blockchain/viem-client.service';
import { MARKET_ABI } from '@shared/blockchain/contracts';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketEvents, markets, projectorCursors } from '@shared/database/schema';
import { ChainProjectorService } from './chain-projector.service';
import { MarketSnapshotProjector } from './market-snapshot.projector';
import { PriceUpdateProjector } from './price-update.projector';
import { DepositRequestProjector } from './deposit-request.projector';

const LIVE_MARKET: LiveMarketState = {
  address: '0x3aDa769dC813e3376fCD40d05bEA12263048A487',
  ytTokenAddress: '0x00000000000000000000000000000000000000b1',
  baseTokenAddress: '0x00000000000000000000000000000000000000a0',
  seniorTrancheAddress: '0x00000000000000000000000000000000000000c1',
  juniorTrancheAddress: '0x00000000000000000000000000000000000000d1',
  seniorSymbol: 'st-mEDGE',
  juniorSymbol: 'jt-mEDGE',
  nav: '40000000000000000000000000',
  navSt: '30000000000000000000000000',
  navJt: '10000000000000000000000000',
  currentStJtRatio: '3000000000000000000',
  maxStJtRatio: '6000000000000000000',
  latestYtPrice: '1000000000000000000',
  lastUpdatedTime: '1777507200',
  halted: false,
  capabilities: {
    depositBaseInstant: true,
    depositBaseRequest: true,
    withdrawBaseAsync: false,
    withdrawBaseInstant: false,
  },
};

describe('ChainProjectorService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function priceUpdatedLog(blockNumber = 100n) {
    return {
      address: LIVE_MARKET.address,
      blockNumber,
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000100',
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000200',
      logIndex: 7,
      topics: encodeEventTopics({
        abi: MARKET_ABI,
        eventName: 'PriceUpdated',
      }),
      data: encodeAbiParameters(
        [
          { type: 'uint256', name: 'newPrice' },
          { type: 'uint256', name: 'oracleTimestamp' },
          { type: 'uint256', name: 'navAfter' },
          { type: 'uint256', name: 'navStAfter' },
          { type: 'uint256', name: 'navJtAfter' },
          { type: 'uint256', name: 'jtStRatioAfter' },
          { type: 'bool', name: 'halted' },
        ],
        [1n, 2n, 3n, 4n, 5n, 6n, false],
      ),
    };
  }

  async function createService({
    liveMarket = LIVE_MARKET,
    head = 100n,
    cursor,
    logs = [],
    deploymentBlock = 100,
    confirmations = 0,
    batchSize = 100,
    projectorEnabled = false,
    pollIntervalMs = 15_000,
    eventInsertRejects = false,
    snapshotProjector = { projectEvents: vi.fn().mockResolvedValue(undefined) },
    priceUpdateProjector = { projectEvents: vi.fn().mockResolvedValue(undefined) },
    depositRequestProjector = { projectEvents: vi.fn().mockResolvedValue(undefined) },
  }: {
    liveMarket?: LiveMarketState;
    head?: bigint;
    cursor?: { lastBlockNumber: string };
    logs?: ReturnType<typeof priceUpdatedLog>[];
    deploymentBlock?: number;
    confirmations?: number;
    batchSize?: number;
    projectorEnabled?: boolean;
    pollIntervalMs?: number;
    eventInsertRejects?: boolean;
    snapshotProjector?: { projectEvents: ReturnType<typeof vi.fn> };
    priceUpdateProjector?: { projectEvents: ReturnType<typeof vi.fn> };
    depositRequestProjector?: { projectEvents: ReturnType<typeof vi.fn> };
  } = {}) {
    const marketOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const eventOnConflictDoNothing = eventInsertRejects
      ? vi.fn().mockRejectedValue(new Error('event insert failed'))
      : vi.fn().mockResolvedValue(undefined);
    const cursorOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const marketValues = vi.fn().mockReturnValue({
      onConflictDoUpdate: marketOnConflictDoUpdate,
    });
    const eventValues = vi.fn().mockReturnValue({
      onConflictDoNothing: eventOnConflictDoNothing,
    });
    const cursorValues = vi.fn().mockReturnValue({
      onConflictDoUpdate: cursorOnConflictDoUpdate,
    });
    const insert = vi.fn((table) => {
      if (table === markets) return { values: marketValues };
      if (table === marketEvents) return { values: eventValues };
      if (table === projectorCursors) return { values: cursorValues };
      throw new Error('unexpected table');
    });
    const publicClient = {
      getBlockNumber: vi.fn().mockResolvedValue(head),
      getLogs: vi.fn().mockResolvedValue(logs),
      getBlock: vi.fn().mockResolvedValue({
        timestamp: 1777507200n,
        hash: '0x0000000000000000000000000000000000000000000000000000000000000100',
      }),
    };
    const viemClient = {
      getPublicClient: vi.fn().mockReturnValue(publicClient),
      getMarketAddress: vi.fn().mockReturnValue(liveMarket.address),
      getChainId: vi.fn().mockReturnValue(84532),
    };
    const config = {
      get: vi.fn((key: string) => {
        const values: Record<string, number> = {
          'projector.deploymentBlock': deploymentBlock,
          'projector.confirmations': confirmations,
          'projector.batchSize': batchSize,
          'projector.pollIntervalMs': pollIntervalMs,
        };
        if (key === 'projector.enabled') return projectorEnabled;
        return values[key];
      }),
    };
    const contractReader = {
      getMarketState: vi.fn().mockResolvedValue(liveMarket),
    };

    const module = await Test.createTestingModule({
      providers: [
        ChainProjectorService,
        {
          provide: ContractReaderService,
          useValue: contractReader,
        },
        {
          provide: ViemClientService,
          useValue: viemClient,
        },
        {
          provide: ConfigService,
          useValue: config,
        },
        {
          provide: DRIZZLE_DB,
          useValue: {
            insert,
            query: {
              projectorCursors: {
                findFirst: vi.fn().mockResolvedValue(cursor),
              },
            },
          },
        },
        {
          provide: MarketSnapshotProjector,
          useValue: snapshotProjector,
        },
        {
          provide: PriceUpdateProjector,
          useValue: priceUpdateProjector,
        },
        {
          provide: DepositRequestProjector,
          useValue: depositRequestProjector,
        },
      ],
    }).compile();

    return {
      service: module.get(ChainProjectorService),
      contractReader,
      publicClient,
      db: {
        insert,
        marketValues,
        eventValues,
        cursorValues,
        marketOnConflictDoUpdate,
        eventOnConflictDoNothing,
        cursorOnConflictDoUpdate,
      },
      snapshotProjector,
      priceUpdateProjector,
      depositRequestProjector,
    };
  }

  it('should be defined', async () => {
    const { service } = await createService();

    expect(service).toBeDefined();
  });

  it('runOnce upserts the configured market before projected rows', async () => {
    const { service, db } = await createService();

    await service.runOnce();

    expect(db.insert).toHaveBeenCalledWith(markets);
    expect(db.marketValues).toHaveBeenCalledWith(
      expect.objectContaining({
        address: LIVE_MARKET.address.toLowerCase(),
        ytTokenAddress: LIVE_MARKET.ytTokenAddress,
        baseTokenAddress: LIVE_MARKET.baseTokenAddress,
        seniorTrancheAddress: LIVE_MARKET.seniorTrancheAddress,
        juniorTrancheAddress: LIVE_MARKET.juniorTrancheAddress,
        halted: false,
      }),
    );
    expect(db.marketOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: markets.address,
      }),
    );
  });

  it('runOnce bootstraps market metadata from live contract state idempotently', async () => {
    const { service, contractReader, db } = await createService();

    await service.runOnce();
    await service.runOnce();

    expect(contractReader.getMarketState).toHaveBeenCalledTimes(2);
    expect(db.marketValues).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        address: LIVE_MARKET.address.toLowerCase(),
        name: 'mEDGE',
      }),
    );
    expect(db.marketValues).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        address: LIVE_MARKET.address.toLowerCase(),
        name: 'mEDGE',
      }),
    );
    expect(db.marketOnConflictDoUpdate).toHaveBeenCalledTimes(2);
  });

  it('runOnce starts at deployment block when no cursor exists', async () => {
    const { service, publicClient } = await createService({
      deploymentBlock: 123,
      head: 130n,
      confirmations: 0,
      batchSize: 100,
    });

    const summary = await service.runOnce();

    expect(publicClient.getLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        fromBlock: 123n,
        toBlock: 130n,
      }),
    );
    expect(summary).toMatchObject({
      fromBlock: '123',
      toBlock: '130',
      cursorUpdated: true,
    });
  });

  it('runOnce returns no-op when confirmations put safe head below deployment block', async () => {
    const { service, publicClient, db } = await createService({
      deploymentBlock: 100,
      head: 102n,
      confirmations: 3,
    });

    const summary = await service.runOnce();

    expect(publicClient.getLogs).not.toHaveBeenCalled();
    expect(db.marketValues).not.toHaveBeenCalled();
    expect(summary.cursorUpdated).toBe(false);
  });

  it('runOnce caps the batch by configured batch size', async () => {
    const { service, publicClient } = await createService({
      deploymentBlock: 100,
      head: 200n,
      confirmations: 0,
      batchSize: 25,
    });

    await service.runOnce();

    expect(publicClient.getLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        fromBlock: 100n,
        toBlock: 124n,
      }),
    );
  });

  it('runOnce decodes and inserts duplicate logs idempotently', async () => {
    const log = priceUpdatedLog();
    const { service, db } = await createService({
      logs: [log, log],
    });

    const summary = await service.runOnce();

    expect(db.eventValues).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          chainId: 84532,
          marketAddress: LIVE_MARKET.address.toLowerCase(),
          eventName: 'PriceUpdated',
          blockNumber: '100',
          txHash: log.transactionHash,
          logIndex: '7',
        }),
      ]),
    );
    const firstEventInsertCall = db.eventValues.mock.calls[0] as
      | [Array<typeof marketEvents.$inferInsert>]
      | undefined;
    expect(firstEventInsertCall?.[0][0]?.args).toMatchObject({
      newPrice: '1',
      stJtRatioAfter: '6',
    });
    expect(db.eventOnConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(summary.eventsDecoded).toBe(2);
  });

  it('runOnce does not advance cursor when event insert fails', async () => {
    const { service, db } = await createService({
      logs: [priceUpdatedLog()],
      eventInsertRejects: true,
    });

    await expect(service.runOnce()).rejects.toThrow('event insert failed');

    expect(db.cursorValues).not.toHaveBeenCalled();
  });

  it('runOnce projects decoded snapshots before advancing cursor', async () => {
    const snapshotProjector = { projectEvents: vi.fn().mockResolvedValue(undefined) };
    const { service, db } = await createService({
      logs: [priceUpdatedLog()],
      snapshotProjector,
    });

    await service.runOnce();

    expect(snapshotProjector.projectEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'PriceUpdated',
        txHash:
          '0x0000000000000000000000000000000000000000000000000000000000000200',
      }),
    ]);
    expect(snapshotProjector.projectEvents.mock.invocationCallOrder[0]).toBeLessThan(
      db.cursorValues.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it('runOnce projects decoded price updates before advancing cursor', async () => {
    const priceUpdateProjector = {
      projectEvents: vi.fn().mockResolvedValue(undefined),
    };
    const { service, db } = await createService({
      logs: [priceUpdatedLog()],
      priceUpdateProjector,
    });

    await service.runOnce();

    expect(priceUpdateProjector.projectEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'PriceUpdated',
      }),
    ]);
    expect(
      priceUpdateProjector.projectEvents.mock.invocationCallOrder[0],
    ).toBeLessThan(
      db.cursorValues.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it('runOnce projects decoded deposit requests before advancing cursor', async () => {
    const depositRequestProjector = {
      projectEvents: vi.fn().mockResolvedValue(undefined),
    };
    const { service, db } = await createService({
      logs: [priceUpdatedLog()],
      depositRequestProjector,
    });

    await service.runOnce();

    expect(depositRequestProjector.projectEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'PriceUpdated',
      }),
    ]);
    expect(
      depositRequestProjector.projectEvents.mock.invocationCallOrder[0],
    ).toBeLessThan(
      db.cursorValues.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it('does not start the background loop when projector is disabled', async () => {
    const { service } = await createService({ projectorEnabled: false });
    const runOnce = vi.spyOn(service, 'runOnce');

    service.onApplicationBootstrap();

    expect(runOnce).not.toHaveBeenCalled();
  });

  it('starts immediate and interval runs when projector is enabled', async () => {
    vi.useFakeTimers();
    const { service } = await createService({
      projectorEnabled: true,
      pollIntervalMs: 1_000,
    });
    const runOnce = vi.spyOn(service, 'runOnce').mockResolvedValue({
      fromBlock: '0',
      toBlock: '0',
      logsFetched: 0,
      eventsDecoded: 0,
      eventsInserted: 0,
      eventsSkipped: 0,
      cursorUpdated: false,
    });

    service.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(runOnce).toHaveBeenCalledTimes(2);
    service.onApplicationShutdown();
  });
});
