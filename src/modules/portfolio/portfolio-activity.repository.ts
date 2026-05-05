import { Inject, Injectable, Optional } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketEvents } from '@shared/database/schema';
import type { PortfolioActivityDto, PortfolioTransactionStatus, PortfolioTransactionType } from './portfolio.service';

type MarketEventRow = typeof marketEvents.$inferSelect;

type FixtureActivityDatabase = {
  marketEventRows: MarketEventRow[];
};

type MarketEventQuery = {
  orderBy(...columns: unknown[]): Promise<MarketEventRow[]>;
};

type MarketEventQueryBuilder = {
  from(table: typeof marketEvents): MarketEventQuery;
};

type ActivityReadDatabase = {
  select(): MarketEventQueryBuilder;
};

type ActivityDatabase = ActivityReadDatabase | FixtureActivityDatabase;

type ActivityCandidate = {
  row: MarketEventRow;
  type: PortfolioTransactionType;
  amount: string;
  value: string;
  status: PortfolioTransactionStatus;
};

const ACTIVITY_EVENTS = new Set([
  'DepositYT',
  'WithdrawYT',
  'DepositRequested',
  'DepositSettled',
]);

function isFixtureActivityDatabase(db: ActivityDatabase | undefined): db is FixtureActivityDatabase {
  return Boolean(db && 'marketEventRows' in db);
}

function isActivityReadDatabase(db: ActivityDatabase | undefined): db is ActivityReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
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
  if (typeof value === 'boolean') {
    return value;
  }

  return null;
}

function valueToAddress(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return normalizeAddress(value);
}

function sortEvents(left: MarketEventRow, right: MarketEventRow): number {
  const blockDelta = BigInt(right.blockNumber) - BigInt(left.blockNumber);

  if (blockDelta !== 0n) {
    return blockDelta > 0n ? 1 : -1;
  }

  return Number(BigInt(right.logIndex) - BigInt(left.logIndex));
}

function mapEvent(row: MarketEventRow, wallet: string): ActivityCandidate | null {
  const args = row.args as Record<string, unknown>;

  switch (row.eventName) {
    case 'DepositYT': {
      if (valueToAddress(args['user']) !== wallet) {
        return null;
      }

      const asSenior = valueToBoolean(args['asSenior']);
      const amount = valueToString(args['assets']);
      const value = valueToString(args['depositValue']) ?? amount;

      if (asSenior === null || amount === null || value === null) {
        return null;
      }

      return {
        row,
        type: asSenior ? 'buy_senior_token' : 'buy_junior_token',
        amount,
        value,
        status: 'success',
      };
    }
    case 'WithdrawYT': {
      const user = valueToAddress(args['user']);
      const receiver = valueToAddress(args['receiver']);

      if (user !== wallet && receiver !== wallet) {
        return null;
      }

      const fromSenior = valueToBoolean(args['fromSenior']);
      const amount = valueToString(args['assetsOut']);
      const value = valueToString(args['withdrawValue']) ?? amount;

      if (fromSenior === null || amount === null || value === null) {
        return null;
      }

      return {
        row,
        type: fromSenior ? 'sell_senior_token' : 'sell_junior_token',
        amount,
        value,
        status: 'success',
      };
    }
    case 'DepositRequested': {
      const user = valueToAddress(args['user']);
      const receiver = valueToAddress(args['receiver']);

      if (user !== wallet && receiver !== wallet) {
        return null;
      }

      const asSenior = valueToBoolean(args['asSenior']);
      const amount = valueToString(args['amountIn']);

      if (asSenior === null || amount === null) {
        return null;
      }

      return {
        row,
        type: asSenior ? 'buy_senior_token' : 'buy_junior_token',
        amount,
        value: amount,
        status: 'pending',
      };
    }
    case 'DepositSettled': {
      if (valueToAddress(args['receiver']) !== wallet) {
        return null;
      }

      const asSenior = valueToBoolean(args['asSenior']);
      const amount = valueToString(args['ytIn']);
      const value = valueToString(args['depositValue']) ?? amount;

      if (asSenior === null || amount === null || value === null) {
        return null;
      }

      return {
        row,
        type: asSenior ? 'buy_senior_token' : 'buy_junior_token',
        amount,
        value,
        status: 'success',
      };
    }
    default:
      return null;
  }
}

function toActivity(candidate: ActivityCandidate, marketSymbol: string): PortfolioActivityDto {
  return {
    id: `${candidate.row.txHash}:${candidate.row.logIndex}`,
    marketAddress: candidate.row.marketAddress,
    marketSymbol,
    date: candidate.row.blockTimestamp.toISOString(),
    type: candidate.type,
    amount: candidate.amount,
    value: candidate.value,
    status: candidate.status,
    txHash: candidate.row.txHash,
    source: 'db',
  };
}

@Injectable()
export class PortfolioActivityRepository {
  constructor(
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: ActivityDatabase,
  ) {}

  async findByWallet(address: string, marketSymbol: string): Promise<PortfolioActivityDto[]> {
    const wallet = normalizeAddress(address);
    const rows = await this.readEvents();

    return rows
      .filter((row) => ACTIVITY_EVENTS.has(row.eventName))
      .sort(sortEvents)
      .map((row) => mapEvent(row, wallet))
      .filter((candidate): candidate is ActivityCandidate => candidate !== null)
      .map((candidate) => toActivity(candidate, marketSymbol));
  }

  private async readEvents(): Promise<MarketEventRow[]> {
    if (isFixtureActivityDatabase(this.db)) {
      return this.db.marketEventRows;
    }

    if (!isActivityReadDatabase(this.db)) {
      return [];
    }

    try {
      return await this.db.select().from(marketEvents).orderBy(desc(marketEvents.blockNumber), desc(marketEvents.logIndex));
    } catch {
      return [];
    }
  }
}
