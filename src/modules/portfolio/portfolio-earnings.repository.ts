import { Inject, Injectable, Optional } from '@nestjs/common';
import { and, eq, gte } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { portfolioCashflows, portfolioCostBasis } from '@shared/database/schema';

type PortfolioCashflowRow = typeof portfolioCashflows.$inferSelect;
type PortfolioCostBasisRow = typeof portfolioCostBasis.$inferSelect;

export type PortfolioCostBasisDto = Pick<
  PortfolioCostBasisRow,
  | 'walletAddress'
  | 'marketAddress'
  | 'tranche'
  | 'openShares'
  | 'openCostBasis'
  | 'realizedPnl'
  | 'depositedValue'
  | 'withdrawnValue'
  | 'dataQuality'
>;

export type PortfolioCashflowDto = PortfolioCashflowRow;

type FixtureEarningsDatabase = {
  portfolioCashflowRows: PortfolioCashflowRow[];
  portfolioCostBasisRows: PortfolioCostBasisRow[];
};

type CashflowQueryBuilder = {
  where(condition: unknown): Promise<PortfolioCashflowRow[]>;
};

type CostBasisQueryBuilder = {
  where(condition: unknown): Promise<PortfolioCostBasisRow[]>;
};

type EarningsSelectBuilder = {
  from(table: typeof portfolioCashflows): CashflowQueryBuilder;
  from(table: typeof portfolioCostBasis): CostBasisQueryBuilder;
};

type EarningsReadDatabase = {
  select(): EarningsSelectBuilder;
};

type EarningsDatabase = EarningsReadDatabase | FixtureEarningsDatabase;

function isFixtureEarningsDatabase(db: EarningsDatabase | undefined): db is FixtureEarningsDatabase {
  return Boolean(db && 'portfolioCashflowRows' in db && 'portfolioCostBasisRows' in db);
}

function isEarningsReadDatabase(db: EarningsDatabase | undefined): db is EarningsReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function toCostBasisDto(row: PortfolioCostBasisRow): PortfolioCostBasisDto {
  return {
    walletAddress: row.walletAddress,
    marketAddress: row.marketAddress,
    tranche: row.tranche,
    openShares: row.openShares,
    openCostBasis: row.openCostBasis,
    realizedPnl: row.realizedPnl,
    depositedValue: row.depositedValue,
    withdrawnValue: row.withdrawnValue,
    dataQuality: row.dataQuality,
  };
}

@Injectable()
export class PortfolioEarningsRepository {
  constructor(
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: EarningsDatabase,
  ) {}

  async findCostBasis(walletAddress: string): Promise<PortfolioCostBasisDto[]> {
    const wallet = normalizeAddress(walletAddress);

    if (isFixtureEarningsDatabase(this.db)) {
      return this.db.portfolioCostBasisRows
        .filter((row) => normalizeAddress(row.walletAddress) === wallet)
        .map(toCostBasisDto);
    }

    if (!isEarningsReadDatabase(this.db)) {
      return [];
    }

    const rows = await this.db.select().from(portfolioCostBasis).where(eq(portfolioCostBasis.walletAddress, wallet));
    return rows.map(toCostBasisDto);
  }

  async findCashflowsSince(walletAddress: string, since: Date): Promise<PortfolioCashflowDto[]> {
    const wallet = normalizeAddress(walletAddress);

    if (isFixtureEarningsDatabase(this.db)) {
      return this.db.portfolioCashflowRows.filter(
        (row) => normalizeAddress(row.walletAddress) === wallet && row.blockTimestamp >= since,
      );
    }

    if (!isEarningsReadDatabase(this.db)) {
      return [];
    }

    return this.db
      .select()
      .from(portfolioCashflows)
      .where(and(eq(portfolioCashflows.walletAddress, wallet), gte(portfolioCashflows.blockTimestamp, since)));
  }
}
