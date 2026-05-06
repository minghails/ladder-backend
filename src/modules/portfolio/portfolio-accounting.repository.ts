import { Inject, Injectable, Optional } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { portfolioCashflows, portfolioCostBasis } from '@shared/database/schema';
import type { CostBasisState } from './portfolio-accounting.service';

type Tranche = 'senior' | 'junior';
type CashflowType = 'deposit' | 'withdraw';

type PortfolioCashflowRow = typeof portfolioCashflows.$inferSelect;
type PortfolioCostBasisRow = typeof portfolioCostBasis.$inferSelect;

export type CashflowInsertResult = { inserted: boolean };

export type PortfolioDepositCashflowInput = {
  chainId: number;
  marketAddress: string;
  walletAddress: string;
  tranche: Tranche;
  shares: string;
  assets: string;
  value: string;
  txHash: string;
  logIndex: string;
  blockNumber: string;
  blockTimestamp: Date;
  sourceEventName: 'DepositYT' | 'DepositSettled';
};

export type PortfolioWithdrawalCashflowInput = {
  chainId: number;
  marketAddress: string;
  walletAddress: string;
  tranche: Tranche;
  shares: string;
  assets: string;
  value: string;
  txHash: string;
  logIndex: string;
  blockNumber: string;
  blockTimestamp: Date;
  sourceEventName: 'WithdrawYT';
};

type CostBasisInput = {
  walletAddress: string;
  marketAddress: string;
  tranche: Tranche;
  state: CostBasisState;
  lastProcessedBlock: string;
};

type FixtureAccountingDatabase = {
  portfolioCashflowRows: PortfolioCashflowRow[];
  portfolioCostBasisRows: PortfolioCostBasisRow[];
};

type ReturningInsertBuilder<T> = {
  returning(): Promise<T[]>;
};

type ConflictInsertBuilder<T> = {
  onConflictDoNothing(input: unknown): ReturningInsertBuilder<T>;
  onConflictDoUpdate(input: unknown): ReturningInsertBuilder<T>;
};

type ValuesInsertBuilder<T> = {
  values(value: unknown): ConflictInsertBuilder<T>;
};

type QueryBuilder<T> = {
  where(condition: unknown): Promise<T[]>;
};

type SelectBuilder<T> = {
  from(table: unknown): QueryBuilder<T>;
};

type AccountingWriteDatabase = {
  insert(table: typeof portfolioCashflows): ValuesInsertBuilder<PortfolioCashflowRow>;
  insert(table: typeof portfolioCostBasis): ValuesInsertBuilder<PortfolioCostBasisRow>;
  select(): SelectBuilder<PortfolioCashflowRow | PortfolioCostBasisRow>;
};

type AccountingDatabase = FixtureAccountingDatabase | AccountingWriteDatabase;

function isFixtureAccountingDatabase(db: AccountingDatabase | undefined): db is FixtureAccountingDatabase {
  return Boolean(db && 'portfolioCashflowRows' in db && 'portfolioCostBasisRows' in db);
}

function isAccountingWriteDatabase(db: AccountingDatabase | undefined): db is AccountingWriteDatabase {
  return Boolean(db && 'insert' in db && typeof db.insert === 'function');
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function toSignedDelta(value: string, type: CashflowType): string {
  const amount = BigInt(value);
  return type === 'withdraw' ? (-amount).toString() : amount.toString();
}

function cashflowKey(row: Pick<PortfolioCashflowRow, 'chainId' | 'marketAddress' | 'txHash' | 'logIndex'>): string {
  return `${String(row.chainId)}:${normalizeAddress(row.marketAddress)}:${row.txHash}:${row.logIndex}`;
}

function costBasisKey(row: Pick<PortfolioCostBasisRow, 'walletAddress' | 'marketAddress' | 'tranche'>): string {
  return `${normalizeAddress(row.walletAddress)}:${normalizeAddress(row.marketAddress)}:${row.tranche}`;
}

@Injectable()
export class PortfolioAccountingRepository {
  constructor(
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: AccountingDatabase,
  ) {}

  async recordDepositCashflow(input: PortfolioDepositCashflowInput): Promise<CashflowInsertResult> {
    return this.recordCashflow(input, 'deposit');
  }

  async recordWithdrawalCashflow(input: PortfolioWithdrawalCashflowInput): Promise<CashflowInsertResult> {
    return this.recordCashflow(input, 'withdraw');
  }

  async upsertCostBasis(input: CostBasisInput): Promise<void> {
    const row = {
      walletAddress: normalizeAddress(input.walletAddress),
      marketAddress: normalizeAddress(input.marketAddress),
      tranche: input.tranche,
      openShares: input.state.openShares,
      openCostBasis: input.state.openCostBasis,
      realizedPnl: input.state.realizedPnl,
      depositedValue: input.state.depositedValue,
      withdrawnValue: input.state.withdrawnValue,
      lastProcessedBlock: input.lastProcessedBlock,
      dataQuality: input.state.dataQuality,
      updatedAt: new Date(),
    };

    if (isFixtureAccountingDatabase(this.db)) {
      const key = costBasisKey(row);
      const existingIndex = this.db.portfolioCostBasisRows.findIndex((candidate) => costBasisKey(candidate) === key);

      if (existingIndex >= 0) {
        const existingRow = this.db.portfolioCostBasisRows[existingIndex];
        if (existingRow === undefined) {
          return;
        }
        this.db.portfolioCostBasisRows[existingIndex] = { id: existingRow.id, ...row };
        return;
      }

      this.db.portfolioCostBasisRows.push({ id: this.db.portfolioCostBasisRows.length + 1, ...row });
      return;
    }

    if (!isAccountingWriteDatabase(this.db)) {
      return;
    }

    await this.db
      .insert(portfolioCostBasis)
      .values(row)
      .onConflictDoUpdate({
        target: [portfolioCostBasis.walletAddress, portfolioCostBasis.marketAddress, portfolioCostBasis.tranche],
        set: row,
      })
      .returning();
  }

  async findCostBasisByWallet(walletAddress: string): Promise<PortfolioCostBasisRow[]> {
    const wallet = normalizeAddress(walletAddress);

    if (isFixtureAccountingDatabase(this.db)) {
      return this.db.portfolioCostBasisRows.filter((row) => normalizeAddress(row.walletAddress) === wallet);
    }

    if (!isAccountingWriteDatabase(this.db)) {
      return [];
    }

    const rows = await this.db.select().from(portfolioCostBasis).where(eq(portfolioCostBasis.walletAddress, wallet));
    return rows as PortfolioCostBasisRow[];
  }

  async findCashflowsByWallet(walletAddress: string): Promise<PortfolioCashflowRow[]> {
    const wallet = normalizeAddress(walletAddress);

    if (isFixtureAccountingDatabase(this.db)) {
      return this.db.portfolioCashflowRows.filter((row) => normalizeAddress(row.walletAddress) === wallet);
    }

    if (!isAccountingWriteDatabase(this.db)) {
      return [];
    }

    const rows = await this.db.select().from(portfolioCashflows).where(eq(portfolioCashflows.walletAddress, wallet));
    return rows as PortfolioCashflowRow[];
  }

  private async recordCashflow(
    input: PortfolioDepositCashflowInput | PortfolioWithdrawalCashflowInput,
    type: CashflowType,
  ): Promise<CashflowInsertResult> {
    const row = {
      chainId: input.chainId,
      marketAddress: normalizeAddress(input.marketAddress),
      walletAddress: normalizeAddress(input.walletAddress),
      tranche: input.tranche,
      type,
      sharesDelta: toSignedDelta(input.shares, type),
      assetsDelta: toSignedDelta(input.assets, type),
      valueDelta: toSignedDelta(input.value, type),
      txHash: input.txHash,
      logIndex: input.logIndex,
      blockNumber: input.blockNumber,
      blockTimestamp: input.blockTimestamp,
      sourceEventName: input.sourceEventName,
    };

    if (isFixtureAccountingDatabase(this.db)) {
      const key = cashflowKey(row);

      if (this.db.portfolioCashflowRows.some((candidate) => cashflowKey(candidate) === key)) {
        return { inserted: false };
      }

      this.db.portfolioCashflowRows.push({
        id: this.db.portfolioCashflowRows.length + 1,
        createdAt: new Date(),
        ...row,
      });
      return { inserted: true };
    }

    if (!isAccountingWriteDatabase(this.db)) {
      return { inserted: false };
    }

    const inserted = await this.db
      .insert(portfolioCashflows)
      .values(row)
      .onConflictDoNothing({
        target: [
          portfolioCashflows.chainId,
          portfolioCashflows.marketAddress,
          portfolioCashflows.txHash,
          portfolioCashflows.logIndex,
        ],
      })
      .returning();

    return { inserted: inserted.length > 0 };
  }
}
