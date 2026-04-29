import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { markets, marketSnapshots } from '@shared/database/schema';

export interface MarketNetworkDto {
  chainId: number;
  name: string;
  icon: string;
}

export interface MarketTrancheDto {
  symbol: string;
  apy: string;
  tvl: string;
}

export interface MarketRatioDto {
  display: string;
  stJtRatio: string;
  maxStJtRatio: string;
}

export interface MarketStatusDto {
  halted: boolean;
  stalePrice: boolean;
  warnings: string[];
}

export interface MarketListItemDto {
  address: string;
  symbol: string;
  name: string;
  description: string;
  network: MarketNetworkDto;
  totalTvl: string;
  senior: MarketTrancheDto;
  junior: MarketTrancheDto;
  ratio: MarketRatioDto;
  status: MarketStatusDto;
}

export interface MarketDetailDto extends MarketListItemDto {
  underlying: {
    symbol: string;
    address: string;
    baseToken: {
      symbol: string;
      address: string;
      decimals: number;
    };
  };
  nav: {
    total: string;
    senior: string;
    junior: string;
  };
  price: {
    lastUpdatedAt: string;
    stale: boolean;
  };
  capabilities: {
    depositYt: boolean;
    withdrawYt: boolean;
    depositBaseInstant: boolean;
    depositBaseRequest: boolean;
    withdrawBaseAsync: boolean;
  };
}

export interface MarketListResponseDto {
  markets: MarketListItemDto[];
}

type MarketRow = typeof markets.$inferSelect;
type SnapshotRow = typeof marketSnapshots.$inferSelect;

type DrizzleMarketQuery = {
  orderBy(...columns: unknown[]): Promise<MarketRow[]>;
};

type DrizzleSnapshotQuery = {
  where(condition: unknown): {
    orderBy(...columns: unknown[]): {
      limit(count: number): Promise<SnapshotRow[]>;
    };
  };
};

type DrizzleQueryBuilder = {
  from(table: typeof markets): DrizzleMarketQuery;
  from(table: typeof marketSnapshots): DrizzleSnapshotQuery;
};

type MarketReadDatabase = {
  select(): DrizzleQueryBuilder;
};

type FixtureReadDatabase = {
  marketRows: MarketRow[];
  snapshotRows: SnapshotRow[];
};

type MarketStateDatabase = MarketReadDatabase | FixtureReadDatabase;

const BASE_SEPOLIA: MarketNetworkDto = {
  chainId: 84532,
  name: 'Base Sepolia',
  icon: 'ethereum',
};

const BASE_TOKEN = {
  symbol: 'USDC',
  address: '0x00000000000000000000000000000000000000a0',
  decimals: 6,
};

const MARKET_DETAILS: MarketDetailDto[] = [
  {
    address: '0x0000000000000000000000000000000000000001',
    symbol: 'mEDGE',
    name: 'mEDGE',
    description: 'Onchain investment product tracking an Edge Capital strategy',
    network: BASE_SEPOLIA,
    totalTvl: '40000000',
    senior: {
      symbol: 'st-mEDGE',
      apy: '0.0500',
      tvl: '30000000',
    },
    junior: {
      symbol: 'jt-mEDGE',
      apy: '0.2080',
      tvl: '10000000',
    },
    ratio: {
      display: '4:1',
      stJtRatio: '4.0',
      maxStJtRatio: '6.0',
    },
    status: {
      halted: false,
      stalePrice: false,
      warnings: [],
    },
    underlying: {
      symbol: 'mEDGE',
      address: '0x00000000000000000000000000000000000000b1',
      baseToken: BASE_TOKEN,
    },
    nav: {
      total: '40000000',
      senior: '30000000',
      junior: '10000000',
    },
    price: {
      lastUpdatedAt: '2026-04-29T00:00:00.000Z',
      stale: false,
    },
    capabilities: {
      depositYt: true,
      withdrawYt: true,
      depositBaseInstant: true,
      depositBaseRequest: true,
      withdrawBaseAsync: false,
    },
  },
  {
    address: '0x0000000000000000000000000000000000000002',
    symbol: 'Token B',
    name: 'Token B',
    description:
      'Ladder Market tokens for Token B provide access to a diversified investment portfolio focusing on renewable energy projects.',
    network: BASE_SEPOLIA,
    totalTvl: '25000000',
    senior: {
      symbol: 'st-TokenB',
      apy: '0.0450',
      tvl: '15000000',
    },
    junior: {
      symbol: 'jt-TokenB',
      apy: '0.1800',
      tvl: '10000000',
    },
    ratio: {
      display: '3:2',
      stJtRatio: '1.5',
      maxStJtRatio: '6.0',
    },
    status: {
      halted: false,
      stalePrice: false,
      warnings: [],
    },
    underlying: {
      symbol: 'Token B',
      address: '0x00000000000000000000000000000000000000b2',
      baseToken: BASE_TOKEN,
    },
    nav: {
      total: '25000000',
      senior: '15000000',
      junior: '10000000',
    },
    price: {
      lastUpdatedAt: '2026-04-29T00:00:00.000Z',
      stale: false,
    },
    capabilities: {
      depositYt: true,
      withdrawYt: true,
      depositBaseInstant: true,
      depositBaseRequest: true,
      withdrawBaseAsync: false,
    },
  },
  {
    address: '0x0000000000000000000000000000000000000003',
    symbol: 'Token C',
    name: 'Token C',
    description:
      'Token C offers exposure to tech startup equity through a unique structured yield approach that balances risk and reward.',
    network: BASE_SEPOLIA,
    totalTvl: '35000000',
    senior: {
      symbol: 'st-TokenC',
      apy: '0.0600',
      tvl: '20000000',
    },
    junior: {
      symbol: 'jt-TokenC',
      apy: '0.2250',
      tvl: '15000000',
    },
    ratio: {
      display: '5:3',
      stJtRatio: '1.6667',
      maxStJtRatio: '6.0',
    },
    status: {
      halted: false,
      stalePrice: false,
      warnings: [],
    },
    underlying: {
      symbol: 'Token C',
      address: '0x00000000000000000000000000000000000000b3',
      baseToken: BASE_TOKEN,
    },
    nav: {
      total: '35000000',
      senior: '20000000',
      junior: '15000000',
    },
    price: {
      lastUpdatedAt: '2026-04-29T00:00:00.000Z',
      stale: false,
    },
    capabilities: {
      depositYt: true,
      withdrawYt: true,
      depositBaseInstant: true,
      depositBaseRequest: true,
      withdrawBaseAsync: false,
    },
  },
  {
    address: '0x0000000000000000000000000000000000000004',
    symbol: 'Token D',
    name: 'Token D',
    description:
      'Tokens from Ladder Market offer a new opportunity in agricultural technology investments with structured yields.',
    network: BASE_SEPOLIA,
    totalTvl: '50000000',
    senior: {
      symbol: 'st-TokenD',
      apy: '0.0575',
      tvl: '30000000',
    },
    junior: {
      symbol: 'jt-TokenD',
      apy: '0.1500',
      tvl: '20000000',
    },
    ratio: {
      display: '6:4',
      stJtRatio: '1.5',
      maxStJtRatio: '6.0',
    },
    status: {
      halted: false,
      stalePrice: false,
      warnings: [],
    },
    underlying: {
      symbol: 'Token D',
      address: '0x00000000000000000000000000000000000000b4',
      baseToken: BASE_TOKEN,
    },
    nav: {
      total: '50000000',
      senior: '30000000',
      junior: '20000000',
    },
    price: {
      lastUpdatedAt: '2026-04-29T00:00:00.000Z',
      stale: false,
    },
    capabilities: {
      depositYt: true,
      withdrawYt: true,
      depositBaseInstant: true,
      depositBaseRequest: true,
      withdrawBaseAsync: false,
    },
  },
];

function toListItem(market: MarketDetailDto): MarketListItemDto {
  return {
    address: market.address,
    symbol: market.symbol,
    name: market.name,
    description: market.description,
    network: market.network,
    totalTvl: market.totalTvl,
    senior: market.senior,
    junior: market.junior,
    ratio: market.ratio,
    status: market.status,
  };
}

function isFixtureReadDatabase(db: MarketStateDatabase | undefined): db is FixtureReadDatabase {
  return Boolean(db && 'marketRows' in db && 'snapshotRows' in db);
}

function isMarketReadDatabase(db: MarketStateDatabase | undefined): db is MarketReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
}

function isSnapshotHalted(snapshot: SnapshotRow | undefined, market: MarketRow): boolean {
  if (!snapshot) {
    return market.halted;
  }

  return snapshot.halted === 'true' || snapshot.halted === '1';
}

function latestSnapshotForMarket(
  marketAddress: string,
  snapshots: SnapshotRow[],
): SnapshotRow | undefined {
  return snapshots
    .filter((snapshot) => snapshot.marketAddress.toLowerCase() === marketAddress.toLowerCase())
    .sort((left, right) => right.snapshotAt.getTime() - left.snapshotAt.getTime())[0];
}

function toRatioDisplay(stJtRatio: string): string {
  return `${stJtRatio}:1`;
}

function toDbMarketDetail(market: MarketRow, snapshot: SnapshotRow | undefined): MarketDetailDto {
  const totalTvl = snapshot?.nav ?? '0';
  const seniorTvl = snapshot?.navSt ?? '0';
  const juniorTvl = snapshot?.navJt ?? '0';
  const stJtRatio = snapshot?.jtStRatio ?? '0';
  const halted = isSnapshotHalted(snapshot, market);
  const lastUpdatedAt = snapshot?.snapshotAt.toISOString() ?? market.updatedAt.toISOString();

  return {
    address: market.address,
    symbol: market.name,
    name: market.name,
    description: `${market.name} Ladder market`,
    network: BASE_SEPOLIA,
    totalTvl,
    senior: {
      symbol: `st-${market.name}`,
      apy: '0',
      tvl: seniorTvl,
    },
    junior: {
      symbol: `jt-${market.name}`,
      apy: '0',
      tvl: juniorTvl,
    },
    ratio: {
      display: toRatioDisplay(stJtRatio),
      stJtRatio,
      maxStJtRatio: '6.0',
    },
    status: {
      halted,
      stalePrice: false,
      warnings: halted ? ['MARKET_HALTED'] : [],
    },
    underlying: {
      symbol: market.name,
      address: market.ytTokenAddress,
      baseToken: {
        symbol: 'USDC',
        address: market.baseTokenAddress,
        decimals: 6,
      },
    },
    nav: {
      total: totalTvl,
      senior: seniorTvl,
      junior: juniorTvl,
    },
    price: {
      lastUpdatedAt,
      stale: false,
    },
    capabilities: {
      depositYt: !halted,
      withdrawYt: true,
      depositBaseInstant: !halted,
      depositBaseRequest: !halted,
      withdrawBaseAsync: false,
    },
  };
}

@Injectable()
export class MarketStateService {
  constructor(
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: MarketStateDatabase,
  ) {}

  async listMarkets(): Promise<MarketListResponseDto> {
    const dbMarkets = await this.readMarkets();

    if (dbMarkets.length === 0) {
      return {
        markets: MARKET_DETAILS.map(toListItem),
      };
    }

    const marketDetails = await Promise.all(
      dbMarkets.map(async (market) => toDbMarketDetail(market, await this.readLatestSnapshot(market.address))),
    );

    return {
      markets: marketDetails.map(toListItem),
    };
  }

  async getMarket(address: string): Promise<MarketDetailDto> {
    const dbMarkets = await this.readMarkets();

    if (dbMarkets.length > 0) {
      const dbMarket = dbMarkets.find(
        (item) => item.address.toLowerCase() === address.toLowerCase(),
      );

      if (dbMarket) {
        return toDbMarketDetail(dbMarket, await this.readLatestSnapshot(dbMarket.address));
      }
    }

    if (dbMarkets.length === 0) {
      const fallbackMarket = MARKET_DETAILS.find(
        (item) => item.address.toLowerCase() === address.toLowerCase(),
      );

      if (fallbackMarket) {
        return fallbackMarket;
      }
    }

    throw new NotFoundException({
      error: {
        code: 'INVALID_MARKET',
        message: 'Market not found',
        details: { address },
      },
    });
  }

  private async readMarkets(): Promise<MarketRow[]> {
    if (isFixtureReadDatabase(this.db)) {
      return this.db.marketRows;
    }

    if (!isMarketReadDatabase(this.db)) {
      return [];
    }

    try {
      return await this.db.select().from(markets).orderBy(markets.address);
    } catch {
      return [];
    }
  }

  private async readLatestSnapshot(marketAddress: string): Promise<SnapshotRow | undefined> {
    if (isFixtureReadDatabase(this.db)) {
      return latestSnapshotForMarket(marketAddress, this.db.snapshotRows);
    }

    if (!isMarketReadDatabase(this.db)) {
      return undefined;
    }

    try {
      const [snapshot] = await this.db
        .select()
        .from(marketSnapshots)
        .where(eq(marketSnapshots.marketAddress, marketAddress))
        .orderBy(desc(marketSnapshots.snapshotAt))
        .limit(1);

      return snapshot;
    } catch {
      return undefined;
    }
  }
}
