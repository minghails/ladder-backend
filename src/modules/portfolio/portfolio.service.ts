import { Inject, Injectable, Optional } from '@nestjs/common';
import { desc, or, eq } from 'drizzle-orm';
import { ContractReaderService, type LivePortfolioPosition } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { depositRequests } from '@shared/database/schema';

export interface PortfolioSummaryDto {
  totalValue: string;
  totalValueChange: {
    amount: string;
    percent: string;
  };
  currentEarning: string;
  earning30d: string;
  claimable: {
    amount: string;
    token: string;
  };
}

export interface PortfolioPositionDto {
  marketAddress: string;
  marketSymbol: string;
  assetType: 'senior' | 'junior';
  assetSymbol: string;
  tokenAddress: string;
  amount: string;
  value: string;
  currentApy: string;
  allocationPercent: string;
}

export interface PortfolioMetricsDto {
  totalValue: string;
  netApy: string;
}

export interface PortfolioDataQualityDto {
  earningsEstimated: boolean;
  historyAvailable: boolean;
  activityIndexedUntilBlock: string | null;
}

export type PortfolioRequestStatus = 'pending' | 'settled' | 'rejected' | 'refunded';

export interface PortfolioRequestDto {
  id: string;
  marketAddress: string;
  marketSymbol: string;
  date: string;
  type: 'buy_senior_token' | 'buy_junior_token';
  amount: string;
  value: string;
  status: PortfolioRequestStatus;
  ladderRequestId: string;
  txHash: string | null;
  settlement: {
    estimatedAt: string | null;
    note: string;
  };
}

export interface PortfolioResponseDto {
  walletAddress: string;
  summary: PortfolioSummaryDto;
  positions: PortfolioPositionDto[];
  portfolioMetrics: PortfolioMetricsDto;
  claimableItems: unknown[];
  pendingRequests: PortfolioRequestDto[];
  recentActivities: unknown[];
  dataQuality: PortfolioDataQualityDto;
}

export interface PortfolioRequestsResponseDto {
  walletAddress: string;
  requests: PortfolioRequestDto[];
}

type DepositRequestRow = typeof depositRequests.$inferSelect;

type DrizzleDepositRequestQuery = {
  where(condition: unknown): {
    orderBy(...columns: unknown[]): Promise<DepositRequestRow[]>;
  };
};

type DrizzleQueryBuilder = {
  from(table: typeof depositRequests): DrizzleDepositRequestQuery;
};

type PortfolioReadDatabase = {
  select(): DrizzleQueryBuilder;
};

type FixtureReadDatabase = {
  depositRequestRows: DepositRequestRow[];
};

type PortfolioDatabase = PortfolioReadDatabase | FixtureReadDatabase;

const SCALE = 10n ** 18n;

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function isFixtureReadDatabase(db: PortfolioDatabase | undefined): db is FixtureReadDatabase {
  return Boolean(db && 'depositRequestRows' in db);
}

function isPortfolioReadDatabase(db: PortfolioDatabase | undefined): db is PortfolioReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
}

function mapRequestStatus(status: string): PortfolioRequestStatus {
  switch (status) {
    case 'settled':
      return 'settled';
    case 'rejected':
      return 'rejected';
    case 'refunded':
      return 'refunded';
    default:
      return 'pending';
  }
}

function requestMarketSymbol(row: DepositRequestRow, liveMarketAddress: string, liveMarketSymbol: string): string {
  if (row.marketAddress.toLowerCase() === liveMarketAddress.toLowerCase()) {
    return liveMarketSymbol;
  }

  return 'Unknown Market';
}

function toPortfolioRequestDto(
  row: DepositRequestRow,
  liveMarketAddress: string,
  liveMarketSymbol: string,
): PortfolioRequestDto {
  return {
    id: row.requestId,
    marketAddress: row.marketAddress,
    marketSymbol: requestMarketSymbol(row, liveMarketAddress, liveMarketSymbol),
    date: row.createdAt.toISOString(),
    type: row.asSenior ? 'buy_senior_token' : 'buy_junior_token',
    amount: row.amountIn,
    value: row.amountIn,
    status: mapRequestStatus(row.status),
    ladderRequestId: row.requestId,
    txHash: row.txHash,
    settlement: {
      estimatedAt: null,
      note: 'Final value may vary at settlement',
    },
  };
}

function sumValues(positions: LivePortfolioPosition[]): bigint {
  return positions.reduce((total, position) => total + BigInt(position.value), 0n);
}

function allocationPercent(value: string, totalValue: bigint): string {
  if (totalValue === 0n) {
    return '0';
  }

  const scaled = (BigInt(value) * SCALE) / totalValue;
  const integer = scaled / SCALE;
  const fraction = scaled % SCALE;

  if (fraction === 0n) {
    return integer.toString();
  }

  return `${integer.toString()}.${fraction.toString().padStart(18, '0').replace(/0+$/, '')}`;
}

function toPortfolioPositionDto(position: LivePortfolioPosition, totalValue: bigint): PortfolioPositionDto {
  return {
    marketAddress: position.marketAddress,
    marketSymbol: position.marketSymbol,
    assetType: position.assetType,
    assetSymbol: position.assetSymbol,
    tokenAddress: position.tokenAddress,
    amount: position.assets,
    value: position.value,
    currentApy: '0',
    allocationPercent: allocationPercent(position.value, totalValue),
  };
}

function stripTranchePrefix(symbol: string): string {
  return symbol.replace(/^(st|jt)-/, '') || symbol;
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly contractReader: ContractReaderService,
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: PortfolioDatabase,
  ) {}

  async getPortfolio(address: string): Promise<PortfolioResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const [livePositions, liveMarket, requestRows] = await Promise.all([
      this.contractReader.getPortfolioPositions(normalizedAddress),
      this.contractReader.getMarketState(),
      this.readRequests(normalizedAddress),
    ]);
    const totalValue = sumValues(livePositions);
    const pendingRequests = requestRows
      .filter((row) => mapRequestStatus(row.status) === 'pending')
      .map((row) => toPortfolioRequestDto(row, liveMarket.address, stripTranchePrefix(liveMarket.seniorSymbol)));

    return {
      walletAddress: normalizedAddress,
      summary: {
        totalValue: totalValue.toString(),
        totalValueChange: {
          amount: '0',
          percent: '0',
        },
        currentEarning: '0',
        earning30d: '0',
        claimable: {
          amount: '0',
          token: 'USDC',
        },
      },
      positions: livePositions.map((position) => toPortfolioPositionDto(position, totalValue)),
      portfolioMetrics: {
        totalValue: totalValue.toString(),
        netApy: '0',
      },
      claimableItems: [],
      pendingRequests,
      recentActivities: [],
      dataQuality: {
        earningsEstimated: false,
        historyAvailable: false,
        activityIndexedUntilBlock: null,
      },
    };
  }

  async getRequests(address: string): Promise<PortfolioRequestsResponseDto> {
    const normalizedAddress = normalizeAddress(address);
    const [liveMarket, requests] = await Promise.all([
      this.contractReader.getMarketState(),
      this.readRequests(normalizedAddress),
    ]);

    return {
      walletAddress: normalizedAddress,
      requests: requests.map((row) =>
        toPortfolioRequestDto(row, liveMarket.address, stripTranchePrefix(liveMarket.seniorSymbol)),
      ),
    };
  }

  private async readRequests(address: string): Promise<DepositRequestRow[]> {
    const normalizedAddress = normalizeAddress(address);

    if (isFixtureReadDatabase(this.db)) {
      return this.db.depositRequestRows
        .filter(
          (row) =>
            row.user.toLowerCase() === normalizedAddress ||
            row.receiver.toLowerCase() === normalizedAddress,
        )
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    }

    if (!isPortfolioReadDatabase(this.db)) {
      return [];
    }

    try {
      return await this.db
        .select()
        .from(depositRequests)
        .where(
          or(eq(depositRequests.user, normalizedAddress), eq(depositRequests.receiver, normalizedAddress)),
        )
        .orderBy(desc(depositRequests.createdAt));
    } catch {
      return [];
    }
  }
}
