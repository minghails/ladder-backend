export type ProjectedEventName =
  | 'DepositYT'
  | 'WithdrawYT'
  | 'PriceUpdated'
  | 'MaxStJtRatioUpdated'
  | 'MarketHaltedEvent'
  | 'MarketHaltStatusUpdated'
  | 'CarryFeeAccrued'
  | 'CarryFeeCollected'
  | 'DepositRequested'
  | 'DepositBasePulled'
  | 'DepositRequestLinked'
  | 'DepositSettled'
  | 'DepositRejected'
  | 'DepositRefunded';

export interface ProjectorRange {
  fromBlock: bigint;
  toBlock: bigint;
}

export interface DecodedMarketEvent {
  chainId: number;
  marketAddress: string;
  eventName: ProjectedEventName;
  blockNumber: bigint;
  blockHash: string;
  blockTimestamp: bigint;
  txHash: string;
  logIndex: number;
  args: Record<string, string | boolean | number | null>;
}
