import { describe, expect, it } from 'vitest';
import { depositRequests } from '@shared/database/schema';
import { PortfolioClaimablesRepository } from './portfolio-claimables.repository';

const MARKET_ADDRESS = '0x3aDa769dC813e3376fCD40d05bEA12263048A487';
const WALLET = '0xabcdef0000000000000000000000000000000001';
const RECEIVER_ONLY = '0x2222222222222222222222222222222222222222';
const BASE_TOKEN = '0x00000000000000000000000000000000000000a0';

type DepositRequestRow = typeof depositRequests.$inferSelect;
type FixtureDb = { depositRequestRows: DepositRequestRow[] };

function request(overrides: Partial<DepositRequestRow>): DepositRequestRow {
  return {
    id: 1,
    requestId: '42',
    marketAddress: MARKET_ADDRESS.toLowerCase(),
    user: WALLET,
    receiver: WALLET,
    asSenior: true,
    tokenIn: BASE_TOKEN,
    amountIn: '99800',
    minYtOut: '99000',
    status: 'rejected',
    adaptorRequestId: '77',
    reasonCode: '1',
    txHash: '0xabc',
    pulledTxHash: null,
    linkedTxHash: null,
    settledTxHash: null,
    rejectedTxHash: '0xdef',
    refundedTxHash: null,
    settledAt: null,
    rejectedAt: new Date('2026-04-14T00:00:00.000Z'),
    refundedAt: null,
    createdAt: new Date('2026-04-13T00:00:00.000Z'),
    updatedAt: new Date('2026-04-14T00:00:00.000Z'),
    ...overrides,
  };
}

function createRepository(db: FixtureDb = { depositRequestRows: [request({})] }): PortfolioClaimablesRepository {
  return new PortfolioClaimablesRepository(db);
}

describe('PortfolioClaimablesRepository', () => {
  it('returns rejected unrefunded requests without pulled base as enabled refund claimables', async () => {
    const repository = createRepository();

    await expect(repository.findByWallet(WALLET.toUpperCase(), 'mEDGE')).resolves.toEqual([
      {
        id: 'refund-42',
        walletAddress: WALLET,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        marketSymbol: 'mEDGE',
        date: '2026-04-14T00:00:00.000Z',
        type: 'refund',
        amount: '99800',
        token: BASE_TOKEN,
        action: {
          label: 'Refund',
          enabled: true,
          reason: null,
        },
        source: 'db',
      },
    ]);
  });

  it('disables rejected refunds when base funds were pulled', async () => {
    const repository = createRepository({
      depositRequestRows: [request({ pulledTxHash: '0xpulled' })],
    });

    await expect(repository.findByWallet(WALLET, 'mEDGE')).resolves.toEqual([
      expect.objectContaining({
        action: {
          label: 'Refund',
          enabled: false,
          reason: 'REFUND_UNAVAILABLE_BASE_PULLED',
        },
      }),
    ]);
  });

  it('disables rejected refunds for wallets that are receiver but not requester', async () => {
    const repository = createRepository({
      depositRequestRows: [request({ user: WALLET, receiver: RECEIVER_ONLY })],
    });

    await expect(repository.findByWallet(RECEIVER_ONLY, 'mEDGE')).resolves.toEqual([
      expect.objectContaining({
        walletAddress: RECEIVER_ONLY,
        action: {
          label: 'Refund',
          enabled: false,
          reason: 'REFUND_ONLY_REQUESTER',
        },
      }),
    ]);
  });

  it('omits refunded and settled requests', async () => {
    const repository = createRepository({
      depositRequestRows: [
        request({ id: 1, requestId: '42', refundedTxHash: '0xrefunded' }),
        request({ id: 2, requestId: '43', status: 'settled' }),
      ],
    });

    await expect(repository.findByWallet(WALLET, 'mEDGE')).resolves.toEqual([]);
  });
});
