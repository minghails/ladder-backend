import { Inject, Injectable, Optional } from '@nestjs/common';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { depositRequests } from '@shared/database/schema';
import type { PortfolioClaimableItemDto } from './portfolio.service';

type DepositRequestRow = typeof depositRequests.$inferSelect;

type FixtureClaimablesDatabase = {
  depositRequestRows: DepositRequestRow[];
};

type ClaimablesQuery = {
  orderBy(...columns: unknown[]): Promise<DepositRequestRow[]>;
};

type ClaimablesWhere = {
  where(condition: unknown): ClaimablesQuery;
};

type ClaimablesSelectBuilder = {
  from(table: typeof depositRequests): ClaimablesWhere;
};

type ClaimablesReadDatabase = {
  select(): ClaimablesSelectBuilder;
};

type ClaimablesDatabase = ClaimablesReadDatabase | FixtureClaimablesDatabase;

export type PortfolioClaimableDto = PortfolioClaimableItemDto & {
  walletAddress: string;
};

function isFixtureClaimablesDatabase(db: ClaimablesDatabase | undefined): db is FixtureClaimablesDatabase {
  return Boolean(db && 'depositRequestRows' in db);
}

function isClaimablesReadDatabase(db: ClaimablesDatabase | undefined): db is ClaimablesReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function mapClaimable(row: DepositRequestRow, walletAddress: string, marketSymbol: string): PortfolioClaimableDto {
  const wallet = normalizeAddress(walletAddress);
  const requester = normalizeAddress(row.user);
  const basePulled = row.pulledTxHash !== null;
  const requesterOnly = requester === wallet;
  const enabled = requesterOnly && !basePulled;

  let reason: string | null = null;

  if (!requesterOnly) {
    reason = 'REFUND_ONLY_REQUESTER';
  } else if (basePulled) {
    reason = 'REFUND_UNAVAILABLE_BASE_PULLED';
  }

  return {
    id: `refund-${row.requestId}`,
    walletAddress: wallet,
    marketAddress: row.marketAddress,
    marketSymbol,
    date: (row.rejectedAt ?? row.updatedAt).toISOString(),
    type: 'refund',
    amount: row.amountIn,
    token: row.tokenIn,
    action: {
      label: 'Refund',
      enabled,
      reason,
    },
    source: 'db',
  };
}

function sortByDateDesc(left: DepositRequestRow, right: DepositRequestRow): number {
  const leftTime = (left.rejectedAt ?? left.updatedAt).getTime();
  const rightTime = (right.rejectedAt ?? right.updatedAt).getTime();
  return rightTime - leftTime;
}

@Injectable()
export class PortfolioClaimablesRepository {
  constructor(
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: ClaimablesDatabase,
  ) {}

  async findByWallet(address: string, marketSymbol: string): Promise<PortfolioClaimableDto[]> {
    const wallet = normalizeAddress(address);
    const rows = await this.readRows(wallet);

    return rows
      .map((row) => mapClaimable(row, wallet, marketSymbol));
  }

  private async readRows(wallet: string): Promise<DepositRequestRow[]> {
    if (isFixtureClaimablesDatabase(this.db)) {
      return this.db.depositRequestRows
        .filter(
          (row) =>
            (normalizeAddress(row.user) === wallet || normalizeAddress(row.receiver) === wallet) &&
            row.status === 'rejected' &&
            row.refundedTxHash === null,
        )
        .sort(sortByDateDesc);
    }

    if (!isClaimablesReadDatabase(this.db)) {
      return [];
    }

    try {
      return await this.db
        .select()
        .from(depositRequests)
        .where(
          and(
            or(eq(depositRequests.user, wallet), eq(depositRequests.receiver, wallet)),
            eq(depositRequests.status, 'rejected'),
            isNull(depositRequests.refundedTxHash),
          ),
        )
        .orderBy(desc(depositRequests.rejectedAt), desc(depositRequests.updatedAt));
    } catch {
      return [];
    }
  }
}
