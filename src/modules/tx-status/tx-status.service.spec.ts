import { describe, expect, it } from 'vitest';
import { TxStatusService } from './tx-status.service';

const MARKET_ADDRESS = '0x3aDa769dC813e3376fCD40d05bEA12263048A487';
const TX_HASH = '0xABCDEF0000000000000000000000000000000000000000000000000000000001';

type MarketEventRow = {
  id: number;
  chainId: number;
  marketAddress: string;
  eventName: string;
  blockNumber: string;
  blockHash: string;
  blockTimestamp: Date;
  txHash: string;
  logIndex: string;
  args: Record<string, unknown>;
  processedAt: Date;
};

function eventRow(overrides: Partial<MarketEventRow>): MarketEventRow {
  return {
    id: overrides.id ?? 1,
    chainId: 84532,
    marketAddress: MARKET_ADDRESS,
    eventName: overrides.eventName ?? 'DepositYT',
    blockNumber: overrides.blockNumber ?? '100',
    blockHash: '0xblock',
    blockTimestamp: overrides.blockTimestamp ?? new Date('2026-05-05T00:00:00.000Z'),
    txHash: overrides.txHash ?? TX_HASH,
    logIndex: overrides.logIndex ?? '0',
    args: overrides.args ?? {},
    processedAt: new Date('2026-05-05T00:00:01.000Z'),
  };
}

describe('TxStatusService', () => {
  it('returns not_indexed for unknown tx hash', async () => {
    const service = new TxStatusService({ marketEventRows: [] });

    await expect(service.getByHash(TX_HASH)).resolves.toEqual({
      txHash: TX_HASH.toLowerCase(),
      status: 'not_indexed',
      confirmationsSource: 'indexed_events',
      events: [],
      dataQuality: {
        sources: {
          tx: 'indexed_events',
        },
      },
    });
  });

  it('returns indexed events ordered by block number and log index', async () => {
    const service = new TxStatusService({
      marketEventRows: [
        eventRow({ id: 3, blockNumber: '102', logIndex: '1', eventName: 'WithdrawYT', args: { user: '0xuser', assetsOut: '5' } }),
        eventRow({ id: 1, blockNumber: '101', logIndex: '4', eventName: 'DepositYT', args: { user: '0xuser', assets: '10' } }),
        eventRow({ id: 2, blockNumber: '102', logIndex: '0', eventName: 'NavUpdated', args: { nav: '20' } }),
        eventRow({ id: 4, txHash: '0x9999000000000000000000000000000000000000000000000000000000000000' }),
      ],
    });

    const result = await service.getByHash(TX_HASH);

    expect(result.status).toBe('indexed');
    expect(result.events.map((event) => `${event.blockNumber}:${event.logIndex}`)).toEqual(['101:4', '102:0', '102:1']);
    expect(result.events[0]).toEqual({
      eventName: 'DepositYT',
      marketAddress: MARKET_ADDRESS,
      blockNumber: '101',
      logIndex: '4',
      args: { user: '0xuser', assets: '10' },
    });
  });

  it('normalizes tx hash case', async () => {
    const service = new TxStatusService({ marketEventRows: [eventRow({ txHash: TX_HASH.toLowerCase() })] });

    const result = await service.getByHash(TX_HASH);

    expect(result.txHash).toBe(TX_HASH.toLowerCase());
    expect(result.status).toBe('indexed');
  });
});
