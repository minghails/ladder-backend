import { describe, expect, it } from 'vitest';
import { PortfolioAccountingRepository } from './portfolio-accounting.repository';

const MARKET_ADDRESS = '0x3aDa769dC813e3376fCD40d05bEA12263048A487';
const WALLET = '0xabcdef0000000000000000000000000000000001';

function createRepository() {
  return new PortfolioAccountingRepository({
    portfolioCashflowRows: [],
    portfolioCostBasisRows: [],
  });
}

describe('PortfolioAccountingRepository', () => {
  it('inserts cashflows idempotently by chain market transaction and log', async () => {
    const repository = createRepository();
    const event = {
      chainId: 84532,
      marketAddress: MARKET_ADDRESS,
      walletAddress: WALLET,
      tranche: 'senior' as const,
      shares: '100',
      assets: '90',
      value: '1000',
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
      logIndex: '5',
      blockNumber: '123',
      blockTimestamp: new Date('2026-05-06T00:00:00.000Z'),
      sourceEventName: 'DepositYT' as const,
    };

    await expect(repository.recordDepositCashflow(event)).resolves.toEqual({ inserted: true });
    await expect(repository.recordDepositCashflow(event)).resolves.toEqual({ inserted: false });

    expect(await repository.findCashflowsByWallet(WALLET)).toHaveLength(1);
  });

  it('stores withdrawals as negative cashflow deltas', async () => {
    const repository = createRepository();

    await repository.recordWithdrawalCashflow({
      chainId: 84532,
      marketAddress: MARKET_ADDRESS,
      walletAddress: WALLET,
      tranche: 'junior',
      shares: '40',
      assets: '35',
      value: '600',
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
      logIndex: '6',
      blockNumber: '124',
      blockTimestamp: new Date('2026-05-06T00:01:00.000Z'),
      sourceEventName: 'WithdrawYT',
    });

    expect(await repository.findCashflowsByWallet(WALLET)).toEqual([
      expect.objectContaining({
        tranche: 'junior',
        type: 'withdraw',
        sharesDelta: '-40',
        assetsDelta: '-35',
        valueDelta: '-600',
      }),
    ]);
  });

  it('upserts cost basis by wallet market and tranche', async () => {
    const repository = createRepository();

    await repository.upsertCostBasis({
      walletAddress: WALLET,
      marketAddress: MARKET_ADDRESS,
      tranche: 'senior',
      state: {
        openShares: '100',
        openCostBasis: '1000',
        realizedPnl: '0',
        depositedValue: '1000',
        withdrawnValue: '0',
        dataQuality: 'full',
      },
      lastProcessedBlock: '123',
    });
    await repository.upsertCostBasis({
      walletAddress: WALLET,
      marketAddress: MARKET_ADDRESS,
      tranche: 'senior',
      state: {
        openShares: '60',
        openCostBasis: '600',
        realizedPnl: '200',
        depositedValue: '1000',
        withdrawnValue: '600',
        dataQuality: 'full',
      },
      lastProcessedBlock: '124',
    });

    expect(await repository.findCostBasisByWallet(WALLET)).toEqual([
      expect.objectContaining({
        walletAddress: WALLET,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        tranche: 'senior',
        openShares: '60',
        openCostBasis: '600',
        realizedPnl: '200',
        withdrawnValue: '600',
        lastProcessedBlock: '124',
      }),
    ]);
  });
});
