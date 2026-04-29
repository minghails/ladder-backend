import { Inject, Injectable, Optional } from '@nestjs/common';
import { desc, or, eq } from 'drizzle-orm';
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

const PORTFOLIO_POSITIONS: PortfolioPositionDto[] = [
  {
    marketAddress: '0x0000000000000000000000000000000000000001',
    marketSymbol: 'Token A',
    assetType: 'senior',
    assetSymbol: 'Senior Token',
    tokenAddress: '0x0000000000000000000000000000000000000101',
    amount: '40000',
    value: '150000',
    currentApy: '0.0500',
    allocationPercent: '0.15',
  },
  {
    marketAddress: '0x0000000000000000000000000000000000000002',
    marketSymbol: 'Token B',
    assetType: 'junior',
    assetSymbol: 'Junior Token',
    tokenAddress: '0x0000000000000000000000000000000000000102',
    amount: '35000',
    value: '400000',
    currentApy: '0.0400',
    allocationPercent: '0.25',
  },
  {
    marketAddress: '0x0000000000000000000000000000000000000003',
    marketSymbol: 'Token C',
    assetType: 'senior',
    assetSymbol: 'Senior Token',
    tokenAddress: '0x0000000000000000000000000000000000000103',
    amount: '60000',
    value: '275000',
    currentApy: '0.0550',
    allocationPercent: '0.30',
  },
  {
    marketAddress: '0x0000000000000000000000000000000000000004',
    marketSymbol: 'Token D',
    assetType: 'junior',
    assetSymbol: 'Junior Token',
    tokenAddress: '0x0000000000000000000000000000000000000104',
    amount: '20000',
    value: '270000',
    currentApy: '0.0800',
    allocationPercent: '0.30',
  },
];

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function isFixtureReadDatabase(db: PortfolioDatabase | undefined): db is FixtureReadDatabase {
  return Boolean(db && 'depositRequestRows' in db);
}

function isPortfolioReadDatabase(db: PortfolioDatabase | undefined): db is PortfolioReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
}

function marketSymbolForAddress(marketAddress: string): string {
  const position = PORTFOLIO_POSITIONS.find(
    (item) => item.marketAddress.toLowerCase() === marketAddress.toLowerCase(),
  );

  return position?.marketSymbol ?? 'Unknown Market';
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

function toPortfolioRequestDto(row: DepositRequestRow): PortfolioRequestDto {
  return {
    id: row.requestId,
    marketAddress: row.marketAddress,
    marketSymbol: marketSymbolForAddress(row.marketAddress),
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

@Injectable()
export class PortfolioService {
  constructor(
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: PortfolioDatabase,
  ) {}

  async getPortfolio(address: string): Promise<PortfolioResponseDto> {
    const pendingRequests = (await this.readRequests(address))
      .filter((row) => mapRequestStatus(row.status) === 'pending')
      .map(toPortfolioRequestDto);

    return {
      walletAddress: normalizeAddress(address),
      summary: {
        totalValue: '852340.05',
        totalValueChange: {
          amount: '4420.00',
          percent: '0.52',
        },
        currentEarning: '6420.75',
        earning30d: '980.50',
        claimable: {
          amount: '295466.00',
          token: 'USDC',
        },
      },
      positions: PORTFOLIO_POSITIONS,
      portfolioMetrics: {
        totalValue: '852340.05',
        netApy: '0.0754',
      },
      claimableItems: [],
      pendingRequests,
      recentActivities: [],
      dataQuality: {
        earningsEstimated: true,
        historyAvailable: false,
        activityIndexedUntilBlock: null,
      },
    };
  }

  async getRequests(address: string): Promise<PortfolioRequestsResponseDto> {
    return {
      walletAddress: normalizeAddress(address),
      requests: (await this.readRequests(address)).map(toPortfolioRequestDto),
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
