import { describe, expect, it } from 'vitest';
import { MarketApyService, type MarketApySnapshot } from './market-apy.service';

function snapshot(overrides: Partial<MarketApySnapshot>): MarketApySnapshot {
  return {
    stSharePrice: '1000000000000000000',
    jtSharePrice: '1000000000000000000',
    snapshotAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('MarketApyService', () => {
  const service = new MarketApyService();

  it('returns unavailable when fewer than two valid snapshots exist', () => {
    expect(service.calculate([])).toEqual({
      senior: { apy: '0', source: 'unavailable' },
      junior: { apy: '0', source: 'unavailable' },
    });
    expect(service.calculate([snapshot({})])).toEqual({
      senior: { apy: '0', source: 'unavailable' },
      junior: { apy: '0', source: 'unavailable' },
    });
  });

  it('computes positive simple annualized APY from tranche share-price snapshots', () => {
    const result = service.calculate([
      snapshot({
        stSharePrice: '1000000000000000000',
        jtSharePrice: '1000000000000000000',
        snapshotAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
      snapshot({
        stSharePrice: '1010000000000000000',
        jtSharePrice: '1030000000000000000',
        snapshotAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
    ]);

    expect(result).toEqual({
      senior: { apy: '0.121666666666666666', source: 'indexed_snapshots' },
      junior: { apy: '0.365', source: 'indexed_snapshots' },
    });
  });

  it('computes negative simple annualized APY from tranche share-price snapshots', () => {
    const result = service.calculate([
      snapshot({
        stSharePrice: '1000000000000000000',
        jtSharePrice: '1000000000000000000',
        snapshotAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
      snapshot({
        stSharePrice: '990000000000000000',
        jtSharePrice: '970000000000000000',
        snapshotAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
    ]);

    expect(result).toEqual({
      senior: { apy: '-0.121666666666666666', source: 'indexed_snapshots' },
      junior: { apy: '-0.365', source: 'indexed_snapshots' },
    });
  });

  it('computes rolling junior APY points from adjacent valid snapshots', () => {
    const result = service.calculateRollingSeries([
      snapshot({
        stSharePrice: '1000000000000000000',
        jtSharePrice: '1000000000000000000',
        snapshotAt: new Date('2026-04-01T00:00:00.000Z'),
      }),
      snapshot({
        stSharePrice: '1010000000000000000',
        jtSharePrice: '1030000000000000000',
        snapshotAt: new Date('2026-05-01T00:00:00.000Z'),
      }),
      snapshot({
        stSharePrice: '1020000000000000000',
        jtSharePrice: '1060000000000000000',
        snapshotAt: new Date('2026-05-31T00:00:00.000Z'),
      }),
    ]);

    expect(result).toEqual([
      {
        timestamp: '2026-05-01T00:00:00.000Z',
        value: '0.365',
        source: 'indexed_snapshots',
      },
      {
        timestamp: '2026-05-31T00:00:00.000Z',
        value: '0.354368932038834951',
        source: 'indexed_snapshots',
      },
    ]);
  });
});
