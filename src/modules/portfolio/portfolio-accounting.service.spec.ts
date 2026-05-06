import { describe, expect, it } from 'vitest';
import { applyDeposit, applyWithdrawal } from './portfolio-accounting.service';

describe('portfolio accounting math', () => {
  it('adds deposits to open shares and cost basis', () => {
    const state = applyDeposit(
      {
        openShares: '0',
        openCostBasis: '0',
        realizedPnl: '0',
        depositedValue: '0',
        withdrawnValue: '0',
        dataQuality: 'full',
      },
      { shares: '100', value: '1000' },
    );

    expect(state).toEqual({
      openShares: '100',
      openCostBasis: '1000',
      realizedPnl: '0',
      depositedValue: '1000',
      withdrawnValue: '0',
      dataQuality: 'full',
    });
  });

  it('realizes pnl using average cost on withdrawal', () => {
    const state = applyWithdrawal(
      {
        openShares: '100',
        openCostBasis: '1000',
        realizedPnl: '0',
        depositedValue: '1000',
        withdrawnValue: '0',
        dataQuality: 'full',
      },
      { shares: '40', value: '600' },
    );

    expect(state).toEqual({
      openShares: '60',
      openCostBasis: '600',
      realizedPnl: '200',
      depositedValue: '1000',
      withdrawnValue: '600',
      dataQuality: 'full',
    });
  });

  it('clears dust when withdrawal closes all shares', () => {
    const state = applyWithdrawal(
      {
        openShares: '3',
        openCostBasis: '10',
        realizedPnl: '0',
        depositedValue: '10',
        withdrawnValue: '0',
        dataQuality: 'full',
      },
      { shares: '3', value: '12' },
    );

    expect(state.openShares).toBe('0');
    expect(state.openCostBasis).toBe('0');
    expect(state.realizedPnl).toBe('2');
  });

  it('marks data partial when withdrawal exceeds open shares', () => {
    const state = applyWithdrawal(
      {
        openShares: '5',
        openCostBasis: '100',
        realizedPnl: '0',
        depositedValue: '100',
        withdrawnValue: '0',
        dataQuality: 'full',
      },
      { shares: '7', value: '140' },
    );

    expect(state).toEqual({
      openShares: '0',
      openCostBasis: '0',
      realizedPnl: '40',
      depositedValue: '100',
      withdrawnValue: '140',
      dataQuality: 'partial',
    });
  });
});
