export type CostBasisQuality = 'full' | 'partial';

export interface CostBasisState {
  openShares: string;
  openCostBasis: string;
  realizedPnl: string;
  depositedValue: string;
  withdrawnValue: string;
  dataQuality: CostBasisQuality;
}

export function applyDeposit(
  state: CostBasisState,
  deposit: { shares: string; value: string },
): CostBasisState {
  return {
    ...state,
    openShares: (BigInt(state.openShares) + BigInt(deposit.shares)).toString(),
    openCostBasis: (BigInt(state.openCostBasis) + BigInt(deposit.value)).toString(),
    depositedValue: (BigInt(state.depositedValue) + BigInt(deposit.value)).toString(),
  };
}

export function applyWithdrawal(
  state: CostBasisState,
  withdrawal: { shares: string; value: string },
): CostBasisState {
  const openShares = BigInt(state.openShares);
  const openCostBasis = BigInt(state.openCostBasis);
  const shares = BigInt(withdrawal.shares);
  const value = BigInt(withdrawal.value);

  if (openShares === 0n) {
    return {
      ...state,
      realizedPnl: (BigInt(state.realizedPnl) + value).toString(),
      withdrawnValue: (BigInt(state.withdrawnValue) + value).toString(),
      dataQuality: 'partial',
    };
  }

  const closesAll = shares >= openShares;
  const closedCostBasis = closesAll ? openCostBasis : (shares * openCostBasis) / openShares;
  const nextOpenShares = closesAll ? 0n : openShares - shares;
  const nextOpenCostBasis = closesAll ? 0n : openCostBasis - closedCostBasis;

  return {
    ...state,
    openShares: nextOpenShares.toString(),
    openCostBasis: nextOpenCostBasis.toString(),
    realizedPnl: (BigInt(state.realizedPnl) + value - closedCostBasis).toString(),
    withdrawnValue: (BigInt(state.withdrawnValue) + value).toString(),
    dataQuality: shares > openShares ? 'partial' : state.dataQuality,
  };
}
