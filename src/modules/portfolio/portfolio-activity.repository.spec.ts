import { describe, expect, it } from 'vitest';
import { PortfolioActivityRepository } from './portfolio-activity.repository';

const MARKET_ADDRESS = '0x3aDa769dC813e3376fCD40d05bEA12263048A487';
const WALLET = '0xabcdef0000000000000000000000000000000001';
const OTHER = '0x2222222222222222222222222222222222222222';

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
    blockTimestamp: overrides.blockTimestamp ?? new Date('2026-05-04T00:00:00.000Z'),
    txHash: overrides.txHash ?? '0xtx',
    logIndex: overrides.logIndex ?? '0',
    args: overrides.args ?? {},
    processedAt: new Date('2026-05-04T00:00:01.000Z'),
  };
}

describe('PortfolioActivityRepository', () => {
  it('maps indexed direct and async market events into wallet activities', async () => {
    const repository = new PortfolioActivityRepository({
      marketEventRows: [
        eventRow({ id: 1, eventName: 'DepositYT', blockNumber: '101', txHash: '0x01', logIndex: '0', args: { user: WALLET, asSenior: true, assets: 100n, depositValue: 90n } }),
        eventRow({ id: 2, eventName: 'DepositYT', blockNumber: '102', txHash: '0x02', logIndex: '0', args: { user: WALLET, asSenior: false, assets: '200', depositValue: '180' } }),
        eventRow({ id: 3, eventName: 'WithdrawYT', blockNumber: '103', txHash: '0x03', logIndex: '0', args: { user: WALLET, fromSenior: true, assetsOut: '50', withdrawValue: '45' } }),
        eventRow({ id: 4, eventName: 'WithdrawYT', blockNumber: '104', txHash: '0x04', logIndex: '0', args: { user: WALLET, fromSenior: false, assetsOut: '60', withdrawValue: '55' } }),
        eventRow({ id: 5, eventName: 'DepositRequested', blockNumber: '105', txHash: '0x05', logIndex: '0', args: { requestId: '12', user: WALLET, receiver: OTHER, asSenior: true, amountIn: '70' } }),
        eventRow({ id: 6, eventName: 'DepositSettled', blockNumber: '106', txHash: '0x06', logIndex: '0', args: { requestId: '12', receiver: WALLET, asSenior: false, ytIn: '80', depositValue: '75' } }),
        eventRow({ id: 7, eventName: 'DepositYT', blockNumber: '107', txHash: '0x07', logIndex: '0', args: { user: OTHER, asSenior: true, assets: '999', depositValue: '999' } }),
      ],
    });

    const activities = await repository.findByWallet(WALLET, 'mEDGE');

    expect(activities.map((activity) => activity.type)).toEqual([
      'buy_junior_token',
      'buy_senior_token',
      'sell_junior_token',
      'sell_senior_token',
      'buy_junior_token',
      'buy_senior_token',
    ]);
    expect(activities.map((activity) => activity.status)).toEqual([
      'success',
      'pending',
      'success',
      'success',
      'success',
      'success',
    ]);
    expect(activities[0]).toMatchObject({ id: '0x06:0', amount: '80', value: '75', txHash: '0x06', source: 'db' });
    expect(activities.at(-1)).toMatchObject({ id: '0x01:0', amount: '100', value: '90' });
  });
});
