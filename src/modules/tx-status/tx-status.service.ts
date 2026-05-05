import { Inject, Injectable, Optional } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketEvents } from '@shared/database/schema';

type MarketEventRow = typeof marketEvents.$inferSelect;

type FixtureTxStatusDatabase = {
  marketEventRows: MarketEventRow[];
};

type MarketEventWhereQuery = {
  orderBy(...columns: unknown[]): Promise<MarketEventRow[]>;
};

type MarketEventQuery = {
  where(condition: unknown): MarketEventWhereQuery;
};

type MarketEventQueryBuilder = {
  from(table: typeof marketEvents): MarketEventQuery;
};

type TxStatusReadDatabase = {
  select(): MarketEventQueryBuilder;
};

type TxStatusDatabase = TxStatusReadDatabase | FixtureTxStatusDatabase;

export type TxStatus = 'indexed' | 'not_indexed';

export type TxStatusEventDto = {
  eventName: string;
  marketAddress: string;
  blockNumber: string;
  logIndex: string;
  args: Record<string, unknown>;
};

export type TxStatusResponseDto = {
  txHash: string;
  status: TxStatus;
  confirmationsSource: 'indexed_events';
  events: TxStatusEventDto[];
  dataQuality: {
    sources: {
      tx: 'indexed_events';
    };
  };
};

function isFixtureTxStatusDatabase(db: TxStatusDatabase | undefined): db is FixtureTxStatusDatabase {
  return Boolean(db && 'marketEventRows' in db);
}

function isTxStatusReadDatabase(db: TxStatusDatabase | undefined): db is TxStatusReadDatabase {
  return Boolean(db && 'select' in db && typeof db.select === 'function');
}

function normalizeTxHash(txHash: string): string {
  return txHash.toLowerCase();
}

function sortEvents(left: MarketEventRow, right: MarketEventRow): number {
  const blockDelta = BigInt(left.blockNumber) - BigInt(right.blockNumber);

  if (blockDelta !== 0n) {
    return blockDelta > 0n ? 1 : -1;
  }

  return Number(BigInt(left.logIndex) - BigInt(right.logIndex));
}

function toEvent(row: MarketEventRow): TxStatusEventDto {
  return {
    eventName: row.eventName,
    marketAddress: row.marketAddress,
    blockNumber: row.blockNumber,
    logIndex: row.logIndex,
    args: row.args as Record<string, unknown>,
  };
}

function response(txHash: string, events: TxStatusEventDto[]): TxStatusResponseDto {
  return {
    txHash,
    status: events.length > 0 ? 'indexed' : 'not_indexed',
    confirmationsSource: 'indexed_events',
    events,
    dataQuality: {
      sources: {
        tx: 'indexed_events',
      },
    },
  };
}

@Injectable()
export class TxStatusService {
  constructor(
    @Optional()
    @Inject(DRIZZLE_DB)
    private readonly db?: TxStatusDatabase,
  ) {}

  async getByHash(txHash: string): Promise<TxStatusResponseDto> {
    const normalizedTxHash = normalizeTxHash(txHash);
    const rows = await this.readEvents(normalizedTxHash);
    return response(normalizedTxHash, rows.sort(sortEvents).map(toEvent));
  }

  private async readEvents(txHash: string): Promise<MarketEventRow[]> {
    if (isFixtureTxStatusDatabase(this.db)) {
      return this.db.marketEventRows.filter((row) => normalizeTxHash(row.txHash) === txHash);
    }

    if (!isTxStatusReadDatabase(this.db)) {
      return [];
    }

    return this.db
      .select()
      .from(marketEvents)
      .where(eq(sql`lower(${marketEvents.txHash})`, txHash))
      .orderBy(asc(marketEvents.blockNumber), asc(marketEvents.logIndex));
  }
}
