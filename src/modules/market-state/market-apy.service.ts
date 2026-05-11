export type MarketApySource = 'indexed_snapshots' | 'unavailable';

export interface MarketApySnapshot {
  stSharePrice: string;
  jtSharePrice: string;
  snapshotAt: Date;
}

export interface MarketApyValue {
  apy: string;
  source: MarketApySource;
}

export interface MarketApyResult {
  senior: MarketApyValue;
  junior: MarketApyValue;
}

export interface MarketApySeriesPoint {
  timestamp: string;
  value: string;
  source: 'indexed_snapshots';
}

const SCALE = 10n ** 18n;
const SECONDS_PER_DAY = 24n * 60n * 60n;
const DAYS_PER_YEAR = 365n;

export function calculateRollingApySeries(snapshots: MarketApySnapshot[]): MarketApySeriesPoint[] {
  const ordered = snapshots
    .filter(isValidSnapshot)
    .sort((left, right) => left.snapshotAt.getTime() - right.snapshotAt.getTime());
  const series: MarketApySeriesPoint[] = [];

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous === undefined || current === undefined) {
      continue;
    }

    const daysElapsed = BigInt(Math.floor((current.snapshotAt.getTime() - previous.snapshotAt.getTime()) / 1000)) / SECONDS_PER_DAY;
    if (daysElapsed <= 0n) {
      continue;
    }

    series.push({
      timestamp: current.snapshotAt.toISOString(),
      value: annualizedApy(previous.jtSharePrice, current.jtSharePrice, daysElapsed).apy,
      source: 'indexed_snapshots',
    });
  }

  return series;
}

export class MarketApyService {
  calculate(snapshots: MarketApySnapshot[]): MarketApyResult {
    const ordered = snapshots
      .filter(isValidSnapshot)
      .sort((left, right) => left.snapshotAt.getTime() - right.snapshotAt.getTime());

    if (ordered.length < 2) {
      return unavailableApy();
    }

    const first = ordered[0];
    const latest = ordered.at(-1);

    if (!first || !latest) {
      return unavailableApy();
    }

    const daysElapsed = BigInt(Math.floor((latest.snapshotAt.getTime() - first.snapshotAt.getTime()) / 1000)) / SECONDS_PER_DAY;

    if (daysElapsed <= 0n) {
      return unavailableApy();
    }

    return {
      senior: annualizedApy(first.stSharePrice, latest.stSharePrice, daysElapsed),
      junior: annualizedApy(first.jtSharePrice, latest.jtSharePrice, daysElapsed),
    };
  }

  calculateRollingSeries(snapshots: MarketApySnapshot[]): MarketApySeriesPoint[] {
    return calculateRollingApySeries(snapshots);
  }
}

function isValidSnapshot(snapshot: MarketApySnapshot): boolean {
  return BigInt(snapshot.stSharePrice) > 0n && BigInt(snapshot.jtSharePrice) > 0n;
}

function unavailableApy(): MarketApyResult {
  return {
    senior: { apy: '0', source: 'unavailable' },
    junior: { apy: '0', source: 'unavailable' },
  };
}

function annualizedApy(firstPrice: string, latestPrice: string, daysElapsed: bigint): MarketApyValue {
  const first = BigInt(firstPrice);
  const latest = BigInt(latestPrice);
  const delta = latest - first;
  const scaled = (delta * DAYS_PER_YEAR * SCALE) / (first * daysElapsed);

  return {
    apy: formatScaledDecimal(scaled),
    source: 'indexed_snapshots',
  };
}

function formatScaledDecimal(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const integer = absolute / SCALE;
  const fraction = absolute % SCALE;

  if (fraction === 0n) {
    return `${negative ? '-' : ''}${integer.toString()}`;
  }

  return `${negative ? '-' : ''}${integer.toString()}.${fraction.toString().padStart(18, '0').replace(/0+$/, '')}`;
}
