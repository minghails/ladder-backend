import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { depositRequests, type marketEvents } from '@shared/database/schema';

type MarketEventRow = typeof marketEvents.$inferInsert;
type DepositRequestInsert = typeof depositRequests.$inferInsert;
type DepositRequestUpdate = Partial<DepositRequestInsert>;

interface DepositRequestDatabase {
  insert: (table: unknown) => {
    values: (value: DepositRequestInsert) => {
      onConflictDoUpdate: (config: unknown) => Promise<unknown>;
    };
  };
  update: (table: unknown) => {
    set: (value: DepositRequestUpdate) => {
      where: (config: unknown) => Promise<unknown>;
    };
  };
  query: {
    depositRequests: {
      findFirst: (config: unknown) => Promise<{ requestId: string } | undefined>;
    };
  };
}

@Injectable()
export class DepositRequestProjector {
  private readonly logger = new Logger(DepositRequestProjector.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DepositRequestDatabase,
  ) {}

  async projectEvents(events: MarketEventRow[]): Promise<void> {
    for (const event of events) {
      if (event.eventName === 'DepositRequested') {
        const row = toRequestedRow(event);
        if (row !== undefined) {
          await this.upsertRequested(row);
        }
        continue;
      }

      const update = toLifecycleUpdate(event);
      if (update !== undefined) {
        await this.updateExistingRequest(event, update);
      }
    }
  }

  private async upsertRequested(row: DepositRequestInsert): Promise<void> {
    await this.db
      .insert(depositRequests)
      .values(row)
      .onConflictDoUpdate({
        target: depositRequests.requestId,
        set: {
          marketAddress: row.marketAddress,
          user: row.user,
          receiver: row.receiver,
          asSenior: row.asSenior,
          tokenIn: row.tokenIn,
          amountIn: row.amountIn,
          minYtOut: row.minYtOut,
          status: row.status,
          txHash: row.txHash,
          updatedAt: row.updatedAt,
        },
      });
  }

  private async updateExistingRequest(
    event: MarketEventRow,
    update: DepositRequestUpdate,
  ): Promise<void> {
    const requestId = stringArg(event.args as Record<string, unknown>, 'requestId');
    if (requestId === undefined) {
      return;
    }

    const existing = await this.db.query.depositRequests.findFirst({
      where: eq(depositRequests.requestId, requestId),
    });
    if (existing === undefined) {
      this.logger.warn(
        { requestId, eventName: event.eventName },
        'deposit request lifecycle event missing requested row',
      );
      return;
    }

    await this.db
      .update(depositRequests)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(depositRequests.requestId, requestId));
  }
}

function toRequestedRow(event: MarketEventRow): DepositRequestInsert | undefined {
  const args = event.args as Record<string, unknown>;
  const requestId = stringArg(args, 'requestId');
  const user = stringArg(args, 'user');
  const receiver = stringArg(args, 'receiver');
  const asSenior = booleanArg(args, 'asSenior');
  const tokenIn = stringArg(args, 'tokenIn');
  const amountIn = stringArg(args, 'amountIn');
  const minYtOut = stringArg(args, 'minYtOut');

  if (
    requestId === undefined ||
    user === undefined ||
    receiver === undefined ||
    asSenior === undefined ||
    tokenIn === undefined ||
    amountIn === undefined ||
    minYtOut === undefined
  ) {
    return undefined;
  }

  return {
    requestId,
    marketAddress: event.marketAddress,
    user,
    receiver,
    asSenior,
    tokenIn,
    amountIn,
    minYtOut,
    status: 'requested',
    txHash: event.txHash,
    updatedAt: new Date(),
  };
}

function toLifecycleUpdate(event: MarketEventRow): DepositRequestUpdate | undefined {
  const args = event.args as Record<string, unknown>;

  if (event.eventName === 'DepositBasePulled') {
    return { status: 'pulled', pulledTxHash: event.txHash };
  }

  if (event.eventName === 'DepositRequestLinked') {
    const adaptorRequestId = stringArg(args, 'adaptorRequestId');
    return adaptorRequestId === undefined
      ? undefined
      : { status: 'linked', adaptorRequestId, linkedTxHash: event.txHash };
  }

  if (event.eventName === 'DepositSettled') {
    return {
      status: 'settled',
      settledTxHash: event.txHash,
      settledAt: event.blockTimestamp,
    };
  }

  if (event.eventName === 'DepositRejected') {
    const reasonCode = stringArg(args, 'reasonCode');
    return reasonCode === undefined
      ? undefined
      : {
          status: 'rejected',
          reasonCode,
          rejectedTxHash: event.txHash,
          rejectedAt: event.blockTimestamp,
        };
  }

  if (event.eventName === 'DepositRefunded') {
    return {
      status: 'refunded',
      refundedTxHash: event.txHash,
      refundedAt: event.blockTimestamp,
    };
  }

  return undefined;
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
