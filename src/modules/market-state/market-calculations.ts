export const MARKET_SCALE = 10n ** 18n;
export const PRICE_STALE_SECONDS = 24 * 60 * 60;

export function formatScaledRatio(value: string): string {
  const ratio = BigInt(value);
  const integer = ratio / MARKET_SCALE;
  const fraction = ratio % MARKET_SCALE;

  if (fraction === 0n) {
    return integer.toString();
  }

  return `${integer.toString()}.${fraction.toString().padStart(18, '0').replace(/0+$/, '')}`;
}

export function calculateSeniorDepositCapacity(navSt: string, navJt: string, maxStJtRatio: string): string {
  const capacity = (BigInt(navJt) * BigInt(maxStJtRatio)) / MARKET_SCALE - BigInt(navSt);
  return capacity > 0n ? capacity.toString() : '0';
}

export function calculateJuniorWithdrawalCapacity(navSt: string, navJt: string, maxStJtRatio: string): string {
  if (BigInt(maxStJtRatio) === 0n) {
    return '0';
  }

  const requiredJuniorNav = (BigInt(navSt) * MARKET_SCALE) / BigInt(maxStJtRatio);
  const capacity = BigInt(navJt) - requiredJuniorNav;
  return capacity > 0n ? capacity.toString() : '0';
}

export function isPriceStale(lastUpdatedTime: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const lastUpdatedSeconds = Number(lastUpdatedTime);
  if (!Number.isFinite(lastUpdatedSeconds) || lastUpdatedSeconds <= 0) {
    return true;
  }

  return nowSeconds - lastUpdatedSeconds > PRICE_STALE_SECONDS;
}

export function unixSecondsToIso(value: string): string {
  return new Date(Number(value) * 1000).toISOString();
}
