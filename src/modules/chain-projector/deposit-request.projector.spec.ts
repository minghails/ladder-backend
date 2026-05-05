import { describe, expect, it, vi } from 'vitest';
import { depositRequests } from '@shared/database/schema';
import { DepositRequestProjector } from './deposit-request.projector';

const MARKET = '0x3ada769dc813e3376fcd40d05bea12263048a487';
const USER = '0x00000000000000000000000000000000000000a1';
const RECEIVER = '0x00000000000000000000000000000000000000b1';
const TOKEN = '0x00000000000000000000000000000000000000c1';
const TX_HASH =
  '0x0000000000000000000000000000000000000000000000000000000000000200';

function event(eventName: string, args: Record<string, unknown> = {}) {
  return {
    chainId: 84532,
    marketAddress: MARKET,
    eventName,
    blockNumber: '100',
    blockHash: '0x0000000000000000000000000000000000000000000000000000000000000100',
    blockTimestamp: new Date('2026-05-04T00:00:00.000Z'),
    txHash: TX_HASH,
    logIndex: '7',
    args: {
      requestId: '12',
      ...args,
    },
  };
}

function requestedEvent() {
  return event('DepositRequested', {
    user: USER,
    receiver: RECEIVER,
    asSenior: false,
    tokenIn: TOKEN,
    amountIn: '1000000',
    minYtOut: '900000',
  });
}

function createProjector(existingRequest = true) {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
  const set = vi.fn().mockReturnThis();
  const where = vi.fn().mockResolvedValue(existingRequest ? [{ requestId: '12' }] : []);
  const db = {
    insert: vi.fn((table) => {
      if (table === depositRequests) return { values };
      throw new Error('unexpected table');
    }),
    update: vi.fn((table) => {
      if (table === depositRequests) return { set };
      throw new Error('unexpected table');
    }),
    query: {
      depositRequests: {
        findFirst: vi.fn().mockResolvedValue(existingRequest ? { requestId: '12' } : undefined),
      },
    },
  };
  set.mockReturnValue({ where });

  return {
    projector: new DepositRequestProjector(
      db as unknown as ConstructorParameters<typeof DepositRequestProjector>[0],
    ),
    db,
    values,
    onConflictDoUpdate,
    set,
    where,
  };
}

describe('DepositRequestProjector', () => {
  it('inserts DepositRequested rows idempotently', async () => {
    const { projector, values, onConflictDoUpdate } = createProjector();

    await projector.projectEvents([requestedEvent()]);

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: '12',
        marketAddress: MARKET,
        user: USER,
        receiver: RECEIVER,
        asSenior: false,
        tokenIn: TOKEN,
        amountIn: '1000000',
        minYtOut: '900000',
        status: 'requested',
        txHash: TX_HASH,
      }),
    );
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ target: depositRequests.requestId }),
    );
  });

  it('updates DepositBasePulled status to pulled', async () => {
    const { projector, set } = createProjector();

    await projector.projectEvents([event('DepositBasePulled')]);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pulled', pulledTxHash: TX_HASH }),
    );
  });

  it('stores adaptorRequestId and linked status', async () => {
    const { projector, set } = createProjector();

    await projector.projectEvents([
      event('DepositRequestLinked', { adaptorRequestId: '77' }),
    ]);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'linked',
        adaptorRequestId: '77',
        linkedTxHash: TX_HASH,
      }),
    );
  });

  it('updates DepositSettled status and settled timestamp', async () => {
    const { projector, set } = createProjector();

    await projector.projectEvents([event('DepositSettled')]);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'settled',
        settledTxHash: TX_HASH,
        settledAt: new Date('2026-05-04T00:00:00.000Z'),
      }),
    );
  });

  it('stores DepositRejected reasonCode and rejected status', async () => {
    const { projector, set } = createProjector();

    await projector.projectEvents([event('DepositRejected', { reasonCode: '4' })]);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'rejected',
        reasonCode: '4',
        rejectedTxHash: TX_HASH,
        rejectedAt: new Date('2026-05-04T00:00:00.000Z'),
      }),
    );
  });

  it('updates DepositRefunded status and refunded timestamp', async () => {
    const { projector, set } = createProjector();

    await projector.projectEvents([event('DepositRefunded')]);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'refunded',
        refundedTxHash: TX_HASH,
        refundedAt: new Date('2026-05-04T00:00:00.000Z'),
      }),
    );
  });

  it('continues when lifecycle update arrives before request row', async () => {
    const { projector, set } = createProjector(false);

    await expect(projector.projectEvents([event('DepositBasePulled')])).resolves.toBeUndefined();

    expect(set).not.toHaveBeenCalled();
  });
});
