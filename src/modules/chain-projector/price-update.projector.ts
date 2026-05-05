import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { priceUpdates, type marketEvents } from '@shared/database/schema';

type MarketEventRow = typeof marketEvents.$inferInsert;
type PriceUpdateInsert = typeof priceUpdates.$inferInsert;

interface PriceUpdateDatabase {
  insert: (table: unknown) => {
    values: (value: PriceUpdateInsert[]) => {
      onConflictDoNothing: () => Promise<unknown>;
    };
  };
}

@Injectable()
export class PriceUpdateProjector {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: PriceUpdateDatabase,
  ) {}

  async projectEvents(events: MarketEventRow[]): Promise<void> {
    const rows = events
      .filter((event) => event.eventName === 'PriceUpdated')
      .map(toPriceUpdateRow)
      .filter((row): row is PriceUpdateInsert => row !== undefined);

    if (rows.length === 0) {
      return;
    }

    await this.db.insert(priceUpdates).values(rows).onConflictDoNothing();
  }
}

function toPriceUpdateRow(event: MarketEventRow): PriceUpdateInsert | undefined {
  const args = event.args as Record<string, unknown>;
  const newPrice = stringArg(args, 'newPrice');
  const oracleTimestamp = stringArg(args, 'oracleTimestamp');
  const navAfter = stringArg(args, 'navAfter');
  const navStAfter = stringArg(args, 'navStAfter');
  const navJtAfter = stringArg(args, 'navJtAfter');
  const stJtRatioAfter = stringArg(args, 'stJtRatioAfter');
  const halted = booleanArg(args, 'halted');

  if (
    newPrice === undefined ||
    oracleTimestamp === undefined ||
    navAfter === undefined ||
    navStAfter === undefined ||
    navJtAfter === undefined ||
    stJtRatioAfter === undefined
  ) {
    return undefined;
  }

  return {
    marketAddress: event.marketAddress,
    newPrice,
    oracleTimestamp,
    navAfter,
    navStAfter,
    navJtAfter,
    jtStRatioAfter: stJtRatioAfter,
    halted: halted ?? false,
    txHash: event.txHash,
    logIndex: event.logIndex,
    blockNumber: event.blockNumber,
    blockHash: event.blockHash,
  };
}

function stringArg(
  args: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = args[name];
  return typeof value === 'string' ? value : undefined;
}

function booleanArg(
  args: Record<string, unknown>,
  name: string,
): boolean | undefined {
  const value = args[name];
  return typeof value === 'boolean' ? value : undefined;
}
