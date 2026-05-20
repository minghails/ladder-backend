import { afterEach, describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { encodeAbiParameters, encodeEventTopics } from 'viem';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { ViemClientService } from '@shared/blockchain/viem-client.service';
import { MARKET_ABI, ST_TRANCHE_ABI } from '@shared/blockchain/contracts';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketEvents, markets, projectorCursors } from '@shared/database/schema';
import { PortfolioAccountingRepository } from '../portfolio/portfolio-accounting.repository';
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

  function depositSettledLog() {
    return {
      address: LIVE_MARKET.address,
      blockNumber: 100n,
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000100',
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000300',
      logIndex: 8,
      topics: encodeEventTopics({
        abi: MARKET_ABI,
        eventName: 'DepositSettled',
        args: {
          requestId: 42n,
          receiver: '0xabcdef0000000000000000000000000000000001',
        },
      }),
      data: encodeAbiParameters(
        [
          { type: 'bool', name: 'asSenior' },
          { type: 'uint256', name: 'ytIn' },
          { type: 'uint256', name: 'sharesMinted' },
          { type: 'uint256', name: 'depositValue' },
          { type: 'uint256', name: 'navAfter' },
          { type: 'uint256', name: 'navStAfter' },
          { type: 'uint256', name: 'navJtAfter' },
          { type: 'uint256', name: 'jtStRatioAfter' },
        ],
        [true, 90n, 100n, 1000n, 1n, 2n, 3n, 4n],
      ),
    };
  }

  function withdrawYtLog() {
    return {
      address: LIVE_MARKET.address,
      blockNumber: 100n,
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000100',
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000400',
      logIndex: 9,
      topics: encodeEventTopics({
        abi: MARKET_ABI,
        eventName: 'WithdrawYT',
        args: {
          user: '0xabcdef0000000000000000000000000000000001',
          receiver: '0x2222222222222222222222222222222222222222',
          fromSenior: false,
        },
      }),
      data: encodeAbiParameters(
        [
          { type: 'bool', name: 'byShares' },
          { type: 'uint256', name: 'sharesIn' },
          { type: 'uint256', name: 'assetsOut' },
          { type: 'uint256', name: 'withdrawValue' },
          { type: 'uint256', name: 'navAfter' },
          { type: 'uint256', name: 'navStAfter' },
          { type: 'uint256', name: 'navJtAfter' },
          { type: 'uint256', name: 'jtStRatioAfter' },
        ],
        [true, 40n, 35n, 600n, 1n, 2n, 3n, 4n],
      ),
    };
  }

  function directDepositYtLog() {
    return {
      address: LIVE_MARKET.address,
      blockNumber: 100n,
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000100',
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000500',
      logIndex: 10,
      topics: encodeEventTopics({
        abi: MARKET_ABI,
        eventName: 'DepositYT',
        args: {
          user: '0xabcdef0000000000000000000000000000000001',
          asSenior: true,
        },
      }),
      data: encodeAbiParameters(
        [
          { type: 'uint256', name: 'assets' },
          { type: 'uint256', name: 'shares' },
          { type: 'uint256', name: 'depositValue' },
          { type: 'uint256', name: 'navAfter' },
          { type: 'uint256', name: 'navStAfter' },
          { type: 'uint256', name: 'navJtAfter' },
          { type: 'uint256', name: 'jtStRatioAfter' },
        ],
        [90n, 100n, 1000n, 1n, 2n, 3n, 4n],
      ),
    };
  }

  function trancheDepositLog() {
    return {
      address: LIVE_MARKET.seniorTrancheAddress,
      blockNumber: 100n,
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000100',
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000500',
      logIndex: 11,
      topics: encodeEventTopics({
        abi: ST_TRANCHE_ABI,
        eventName: 'Deposit',
        args: {
          sender: LIVE_MARKET.address,
          owner: '0x3333333333333333333333333333333333333333',
        },
      }),
      data: encodeAbiParameters(
        [
          { type: 'uint256', name: 'assets' },
          { type: 'uint256', name: 'shares' },
        ],
        [90n, 100n],
      ),
    };
  }

  function persistedMarketRow(
    overrides: Partial<{
      updatedAt: Date;
      seniorTrancheAddress: string;
      juniorTrancheAddress: string;
    }> = {},
  ) {
    return {
      address: LIVE_MARKET.address.toLowerCase(),
      name: 'mEDGE',
      ytTokenAddress: LIVE_MARKET.ytTokenAddress.toLowerCase(),
      baseTokenAddress: LIVE_MARKET.baseTokenAddress.toLowerCase(),
      seniorTrancheAddress: (
        overrides.seniorTrancheAddress ?? LIVE_MARKET.seniorTrancheAddress
      ).toLowerCase(),
      juniorTrancheAddress: (
        overrides.juniorTrancheAddress ?? LIVE_MARKET.juniorTrancheAddress
      ).toLowerCase(),
      halted: false,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      updatedAt: overrides.updatedAt ?? new Date(),
    };
  }

  async function createService({
    liveMarket = LIVE_MARKET,
    persistedMarket,
    head = 100n,
    cursor,
    logs = [],
    deploymentBlock = 100,
    confirmations = 0,
    batchSize = 100,
    projectorEnabled = false,
    pollIntervalMs = 15_000,
    marketRefreshMs = 900_000,
    eventInsertRejects = false,
    snapshotProjector = { projectEvents: vi.fn().mockResolvedValue(undefined) },
    priceUpdateProjector = { projectEvents: vi.fn().mockResolvedValue(undefined) },
    depositRequestProjector = { projectEvents: vi.fn().mockResolvedValue(undefined) },
    portfolioAccountingRepository = {
      recordDepositCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      recordWithdrawalCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      findCostBasisByWallet: vi.fn().mockResolvedValue([]),
      upsertCostBasis: vi.fn().mockResolvedValue(undefined),
    },
    marketsFindFirst,
  }: {
    liveMarket?: LiveMarketState;
    persistedMarket?: ReturnType<typeof persistedMarketRow>;
    head?: bigint;
    cursor?: { lastBlockNumber: string };
    logs?: ReturnType<typeof priceUpdatedLog>[];
    deploymentBlock?: number;
    confirmations?: number;
    batchSize?: number;
    projectorEnabled?: boolean;
    pollIntervalMs?: number;
    marketRefreshMs?: number;
    eventInsertRejects?: boolean;
    snapshotProjector?: { projectEvents: ReturnType<typeof vi.fn> };
    priceUpdateProjector?: { projectEvents: ReturnType<typeof vi.fn> };
    depositRequestProjector?: { projectEvents: ReturnType<typeof vi.fn> };
    portfolioAccountingRepository?: {
      recordDepositCashflow: ReturnType<typeof vi.fn>;
      recordWithdrawalCashflow: ReturnType<typeof vi.fn>;
      findCostBasisByWallet: ReturnType<typeof vi.fn>;
      upsertCostBasis: ReturnType<typeof vi.fn>;
    };
    marketsFindFirst?: ReturnType<typeof vi.fn>;
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
          'projector.marketRefreshMs': marketRefreshMs,
        };
        if (key === 'projector.enabled') return projectorEnabled;
        return values[key];
      }),
    };
    const marketsQueryFindFirst =
      marketsFindFirst ?? vi.fn().mockResolvedValue(persistedMarket);
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
              markets: {
                findFirst: marketsQueryFindFirst,
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
        {
          provide: PortfolioAccountingRepository,
          useValue: portfolioAccountingRepository,
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
      portfolioAccountingRepository,
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
    const freshRow = persistedMarketRow({ updatedAt: new Date() });
    const { service, contractReader, db } = await createService({
      marketsFindFirst: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue(freshRow),
    });

    await service.runOnce();
    await service.runOnce();

    expect(contractReader.getMarketState).toHaveBeenCalledTimes(1);
    expect(db.marketValues).toHaveBeenCalledTimes(1);
    expect(db.marketValues).toHaveBeenCalledWith(
      expect.objectContaining({
        address: LIVE_MARKET.address.toLowerCase(),
        name: 'mEDGE',
      }),
    );
    expect(db.marketOnConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it('uses persisted market addresses for getLogs when a fresh markets row exists', async () => {
    const row = persistedMarketRow({ updatedAt: new Date() });
    const { service, contractReader, publicClient, db } = await createService({
      persistedMarket: row,
    });

    await service.runOnce();

    expect(contractReader.getMarketState).not.toHaveBeenCalled();
    expect(publicClient.getLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        address: [
          row.address,
          row.seniorTrancheAddress,
          row.juniorTrancheAddress,
        ],
      }),
    );
    expect(db.marketValues).not.toHaveBeenCalled();
  });

  it('refreshes live market metadata when the persisted row is stale', async () => {
    vi.useFakeTimers();
    const staleUpdatedAt = new Date('2026-05-01T00:00:00.000Z');
    vi.setSystemTime(new Date('2026-05-01T00:20:00.000Z'));
    const { service, contractReader } = await createService({
      persistedMarket: persistedMarketRow({ updatedAt: staleUpdatedAt }),
      marketRefreshMs: 900_000,
    });

    await service.runOnce();

    expect(contractReader.getMarketState).toHaveBeenCalledTimes(1);
  });

  it('uses mEDGE as projected market name for production YT address', async () => {
    const productionLikeMarket = {
      ...LIVE_MARKET,
      ytTokenAddress: '0x7060176d148D07834050473C8a9123244c0B44CD',
      seniorSymbol: 'LST',
      juniorSymbol: 'LJT',
    };
    const { service, db } = await createService({ liveMarket: productionLikeMarket });

    await service.runOnce();

    expect(db.marketValues).toHaveBeenCalledWith(
      expect.objectContaining({
        address: productionLikeMarket.address.toLowerCase(),
        name: 'mEDGE',
      }),
    );
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

  it('projects DepositSettled into portfolio accounting', async () => {
    const portfolioAccountingRepository = {
      recordDepositCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      recordWithdrawalCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      findCostBasisByWallet: vi.fn().mockResolvedValue([]),
      upsertCostBasis: vi.fn().mockResolvedValue(undefined),
    };
    const { service } = await createService({
      logs: [depositSettledLog()],
      portfolioAccountingRepository,
    });

    await service.runOnce();

    expect(portfolioAccountingRepository.recordDepositCashflow).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '0xabcdef0000000000000000000000000000000001',
        tranche: 'senior',
        shares: '100',
        assets: '90',
        value: '1000',
        sourceEventName: 'DepositSettled',
      }),
    );
    expect(portfolioAccountingRepository.upsertCostBasis).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '0xabcdef0000000000000000000000000000000001',
        tranche: 'senior',
        lastProcessedBlock: '100',
      }),
    );
  });

  it('projects WithdrawYT into portfolio accounting', async () => {
    const portfolioAccountingRepository = {
      recordDepositCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      recordWithdrawalCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      findCostBasisByWallet: vi.fn().mockResolvedValue([
        {
          marketAddress: LIVE_MARKET.address.toLowerCase(),
          tranche: 'junior',
          openShares: '100',
          openCostBasis: '1000',
          realizedPnl: '0',
          depositedValue: '1000',
          withdrawnValue: '0',
          dataQuality: 'full',
        },
      ]),
      upsertCostBasis: vi.fn().mockResolvedValue(undefined),
    };
    const { service } = await createService({
      logs: [withdrawYtLog()],
      portfolioAccountingRepository,
    });

    await service.runOnce();

    expect(portfolioAccountingRepository.recordWithdrawalCashflow).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '0xabcdef0000000000000000000000000000000001',
        tranche: 'junior',
        shares: '40',
        assets: '35',
        value: '600',
        sourceEventName: 'WithdrawYT',
      }),
    );
    expect(portfolioAccountingRepository.upsertCostBasis).toHaveBeenCalled();
    const upsertInput = portfolioAccountingRepository.upsertCostBasis.mock.calls[0]?.[0] as {
      state: { openShares: string; openCostBasis: string; realizedPnl: string };
    };
    expect(upsertInput.state).toMatchObject({
      openShares: '60',
      openCostBasis: '600',
      realizedPnl: '200',
    });
  });

  it('marks cost basis partial when withdrawal history starts without matching prior deposits', async () => {
    const portfolioAccountingRepository = {
      recordDepositCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      recordWithdrawalCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      findCostBasisByWallet: vi.fn().mockResolvedValue([]),
      upsertCostBasis: vi.fn().mockResolvedValue(undefined),
    };
    const { service } = await createService({
      logs: [withdrawYtLog()],
      portfolioAccountingRepository,
    });

    await service.runOnce();

    const upsertInput = portfolioAccountingRepository.upsertCostBasis.mock.calls[0]?.[0] as {
      state: { dataQuality: string };
    };
    expect(upsertInput.state.dataQuality).toBe('partial');
  });

  it('does not re-apply cost basis when replayed cashflow is duplicate', async () => {
    const portfolioAccountingRepository = {
      recordDepositCashflow: vi
        .fn()
        .mockResolvedValueOnce({ inserted: true })
        .mockResolvedValueOnce({ inserted: false }),
      recordWithdrawalCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      findCostBasisByWallet: vi.fn().mockResolvedValue([]),
      upsertCostBasis: vi.fn().mockResolvedValue(undefined),
    };
    const { service } = await createService({
      logs: [depositSettledLog(), depositSettledLog()],
      portfolioAccountingRepository,
    });

    await service.runOnce();

    expect(portfolioAccountingRepository.recordDepositCashflow).toHaveBeenCalledTimes(2);
    expect(portfolioAccountingRepository.upsertCostBasis).toHaveBeenCalledTimes(1);
  });

  it('correlates DepositYT with same transaction tranche Deposit owner', async () => {
    const portfolioAccountingRepository = {
      recordDepositCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      recordWithdrawalCashflow: vi.fn().mockResolvedValue({ inserted: true }),
      findCostBasisByWallet: vi.fn().mockResolvedValue([]),
      upsertCostBasis: vi.fn().mockResolvedValue(undefined),
    };
    const { service } = await createService({
      logs: [directDepositYtLog(), trancheDepositLog()],
      portfolioAccountingRepository,
    });

    await service.runOnce();

    expect(portfolioAccountingRepository.recordDepositCashflow).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '0x3333333333333333333333333333333333333333',
        tranche: 'senior',
        shares: '100',
        assets: '90',
        value: '1000',
        sourceEventName: 'DepositYT',
      }),
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
