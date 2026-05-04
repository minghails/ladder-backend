import { Inject, Injectable } from '@nestjs/common';
import { ContractReaderService } from '@shared/blockchain/contract-reader.service';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { marketSnapshots, type marketEvents } from '@shared/database/schema';

type MarketEventRow = typeof marketEvents.$inferInsert;
type MarketSnapshotRow = typeof marketSnapshots.$inferSelect;
type MarketSnapshotInsert = typeof marketSnapshots.$inferInsert;

interface MarketSnapshotDatabase {
  query: {
    marketSnapshots: {
      findMany: (config: unknown) => Promise<MarketSnapshotRow[]>;
    };
  };
  insert: (table: unknown) => {
    values: (value: MarketSnapshotInsert[]) => {
      onConflictDoNothing: () => Promise<unknown>;
    };
  };
}

const SNAPSHOT_EVENT_NAMES = new Set([
  'PriceUpdated',
  'DepositYT',
  'WithdrawYT',
  'DepositSettled',
]);

@Injectable()
export class MarketSnapshotProjector {
  constructor(
    private readonly contractReader: ContractReaderService,
    @Inject(DRIZZLE_DB)
    private readonly db: MarketSnapshotDatabase,
  ) {}

  async projectEvents(events: MarketEventRow[]): Promise<void> {
    const snapshotEvents = events.filter((event) =>
      SNAPSHOT_EVENT_NAMES.has(event.eventName),
    );
    if (snapshotEvents.length === 0) {
      return;
    }

    const existingSnapshots = await this.db.query.marketSnapshots.findMany({});
    const projected: MarketSnapshotInsert[] = [];

    for (const event of snapshotEvents) {
      const snapshot = await this.snapshotFromEvent(event, [
        ...existingSnapshots,
        ...projected,
      ]);
      if (snapshot !== undefined) {
        projected.push(snapshot);
      }
    }

    if (projected.length === 0) {
      return;
    }

    await this.db.insert(marketSnapshots).values(projected).onConflictDoNothing();
  }

  private async snapshotFromEvent(
    event: MarketEventRow,
    candidates: Array<MarketSnapshotRow | MarketSnapshotInsert>,
  ): Promise<MarketSnapshotInsert | undefined> {
    const args = event.args as Record<string, unknown>;
    const nav = stringArg(args, 'navAfter');
    const navSt = stringArg(args, 'navStAfter');
    const navJt = stringArg(args, 'navJtAfter');
    const stJtRatio = stringArg(args, 'stJtRatioAfter');
    if (
      nav === undefined ||
      navSt === undefined ||
      navJt === undefined ||
      stJtRatio === undefined
    ) {
      return undefined;
    }

    const prior = latestPriorSnapshot(candidates, event);
    const liveFallback =
      event.eventName === 'PriceUpdated' || prior !== undefined
        ? undefined
        : await this.contractReader.getMarketState();
    const ytPrice =
      event.eventName === 'PriceUpdated'
        ? stringArg(args, 'newPrice')
        : prior?.ytPrice ?? liveFallback?.latestYtPrice;
    const halted =
      event.eventName === 'PriceUpdated'
        ? String(booleanArg(args, 'halted') ?? false)
        : prior?.halted ?? String(liveFallback?.halted ?? false);

    if (ytPrice === undefined) {
      return undefined;
    }

    return {
      chainId: event.chainId,
      marketAddress: event.marketAddress,
      nav,
      navSt,
      navJt,
      jtStRatio: stJtRatio,
      ytPrice,
      halted,
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      sourceTxHash: event.txHash,
      sourceLogIndex: event.logIndex,
      snapshotAt: event.blockTimestamp,
    };
  }
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

function latestPriorSnapshot(
  candidates: Array<MarketSnapshotRow | MarketSnapshotInsert>,
  event: MarketEventRow,
): MarketSnapshotRow | MarketSnapshotInsert | undefined {
  return candidates
    .filter(
      (candidate) =>
        candidate.chainId === event.chainId &&
        candidate.marketAddress === event.marketAddress &&
        isAtOrBefore(candidate, event),
    )
    .sort(compareSnapshotIdentityDesc)[0];
}

function isAtOrBefore(
  snapshot: MarketSnapshotRow | MarketSnapshotInsert,
  event: MarketEventRow,
): boolean {
  const snapshotBlock = BigInt(snapshot.blockNumber);
  const eventBlock = BigInt(event.blockNumber);
  if (snapshotBlock < eventBlock) {
    return true;
  }
  if (snapshotBlock > eventBlock) {
    return false;
  }
  return BigInt(snapshot.sourceLogIndex) <= BigInt(event.logIndex);
}

function compareSnapshotIdentityDesc(
  left: MarketSnapshotRow | MarketSnapshotInsert,
  right: MarketSnapshotRow | MarketSnapshotInsert,
): number {
  const leftBlock = BigInt(left.blockNumber);
  const rightBlock = BigInt(right.blockNumber);
  if (leftBlock !== rightBlock) {
    return leftBlock > rightBlock ? -1 : 1;
  }
  const leftLog = BigInt(left.sourceLogIndex);
  const rightLog = BigInt(right.sourceLogIndex);
  if (leftLog === rightLog) {
    return 0;
  }
  return leftLog > rightLog ? -1 : 1;
}
