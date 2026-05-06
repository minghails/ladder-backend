import { describe, expect, it } from 'vitest';
import { PortfolioEarningsRepository } from './portfolio-earnings.repository';

const MARKET_ADDRESS = '0x3aDa769dC813e3376fCD40d05bEA12263048A487';
const WALLET = '0xabcdef0000000000000000000000000000000001';
const OTHER = '0x2222222222222222222222222222222222222222';

function createRepository() {
  return new PortfolioEarningsRepository({
    portfolioCashflowRows: [
      {
        id: 1,
        chainId: 84532,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        walletAddress: WALLET,
        tranche: 'senior',
        type: 'deposit',
        sharesDelta: '100',
        assetsDelta: '90',
        valueDelta: '1000',
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
        logIndex: '5',
        blockNumber: '123',
        blockTimestamp: new Date('2026-05-06T00:00:00.000Z'),
        sourceEventName: 'DepositYT',
        createdAt: new Date('2026-05-06T00:00:01.000Z'),
      },
      {
        id: 2,
        chainId: 84532,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        walletAddress: WALLET,
        tranche: 'senior',
        type: 'withdraw',
        sharesDelta: '-40',
        assetsDelta: '-35',
        valueDelta: '-600',
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
        logIndex: '6',
        blockNumber: '124',
        blockTimestamp: new Date('2026-05-07T00:00:00.000Z'),
        sourceEventName: 'WithdrawYT',
        createdAt: new Date('2026-05-07T00:00:01.000Z'),
      },
      {
        id: 3,
        chainId: 84532,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        walletAddress: OTHER,
        tranche: 'junior',
        type: 'deposit',
        sharesDelta: '999',
        assetsDelta: '999',
        valueDelta: '999',
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000003',
        logIndex: '7',
        blockNumber: '125',
        blockTimestamp: new Date('2026-05-08T00:00:00.000Z'),
        sourceEventName: 'DepositYT',
        createdAt: new Date('2026-05-08T00:00:01.000Z'),
      },
    ],
    portfolioCostBasisRows: [
      {
        id: 1,
        walletAddress: WALLET,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        tranche: 'senior',
        openShares: '100',
        openCostBasis: '1000',
        realizedPnl: '200',
        depositedValue: '1000',
        withdrawnValue: '600',
        lastProcessedBlock: '124',
        dataQuality: 'full',
        updatedAt: new Date('2026-05-07T00:00:02.000Z'),
      },
      {
        id: 2,
        walletAddress: OTHER,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        tranche: 'junior',
        openShares: '999',
        openCostBasis: '999',
        realizedPnl: '0',
        depositedValue: '999',
        withdrawnValue: '0',
        lastProcessedBlock: '125',
        dataQuality: 'full',
        updatedAt: new Date('2026-05-08T00:00:02.000Z'),
      },
    ],
  });
}

describe('PortfolioEarningsRepository', () => {
  it('returns cost-basis rows for a wallet mapped by wallet market and tranche', async () => {
    const repository = createRepository();

    await expect(repository.findCostBasis(WALLET.toUpperCase())).resolves.toEqual([
      {
        walletAddress: WALLET,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        tranche: 'senior',
        openShares: '100',
        openCostBasis: '1000',
        realizedPnl: '200',
        depositedValue: '1000',
        withdrawnValue: '600',
        dataQuality: 'full',
      },
    ]);
  });

  it('returns wallet cashflows since the requested timestamp', async () => {
    const repository = createRepository();

    await expect(repository.findCashflowsSince(WALLET.toUpperCase(), new Date('2026-05-06T12:00:00.000Z'))).resolves.toEqual([
      expect.objectContaining({
        walletAddress: WALLET,
        marketAddress: MARKET_ADDRESS.toLowerCase(),
        tranche: 'senior',
        type: 'withdraw',
        valueDelta: '-600',
      }),
    ]);
  });
});
