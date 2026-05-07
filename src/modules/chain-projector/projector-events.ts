import type { ProjectedEventName } from './projector.types';

export const REQUIRED_PORTFOLIO_EVENT_NAMES = [
  'DepositYT',
  'WithdrawYT',
  'DepositRequested',
  'DepositBasePulled',
  'DepositRequestLinked',
  'DepositSettled',
  'DepositRejected',
  'DepositRefunded',
  'TrancheDeposit',
] as const;

export const SUPPORTED_MARKET_EVENT_NAMES = [
  'DepositYT',
  'WithdrawYT',
  'PriceUpdated',
  'MarketHaltedEvent',
  'MarketHaltStatusUpdated',
  'CarryFeeAccrued',
  'CarryFeeCollected',
  'DepositRequested',
  'DepositBasePulled',
  'DepositRequestLinked',
  'DepositSettled',
  'DepositRejected',
  'DepositRefunded',
] as const satisfies readonly ProjectedEventName[];

type NormalizedArgValue = string | boolean | number | null;

function normalizeArgValue(value: unknown): NormalizedArgValue {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    value === null
  ) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Array.from(value).join(',');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return value.name === '' ? 'function' : value.name;
  }
  return 'undefined';
}

export function normalizeEventArgs(args: Record<string, unknown>): Record<string, NormalizedArgValue> {
  const normalized = Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, normalizeArgValue(value)]),
  );

  if ('jtStRatioAfter' in normalized) {
    normalized['stJtRatioAfter'] = normalized['jtStRatioAfter'];
  }

  return normalized;
}
