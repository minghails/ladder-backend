import { describe, expect, it } from 'vitest';
import { normalizeEventArgs, REQUIRED_PORTFOLIO_EVENT_NAMES, SUPPORTED_MARKET_EVENT_NAMES } from './projector-events';

describe('projector events', () => {
  it('converts bigint args to decimal strings', () => {
    expect(
      normalizeEventArgs({
        amount: 1000000000000000000n,
        receiver: '0x1234567890123456789012345678901234567890',
        asSenior: true,
      }),
    ).toEqual({
      amount: '1000000000000000000',
      receiver: '0x1234567890123456789012345678901234567890',
      asSenior: true,
    });
  });

  it('aliases legacy jtStRatioAfter to semantic stJtRatioAfter', () => {
    expect(
      normalizeEventArgs({
        jtStRatioAfter: 1500000000000000000n,
      }),
    ).toEqual({
      jtStRatioAfter: '1500000000000000000',
      stJtRatioAfter: '1500000000000000000',
    });
  });

  it('stringifies unsupported primitive-like values predictably', () => {
    expect(
      normalizeEventArgs({
        index: 7,
        missing: null,
        bytes: new Uint8Array([1, 2, 3]),
      }),
    ).toEqual({
      index: 7,
      missing: null,
      bytes: '1,2,3',
    });
  });

  it('exports supported market event names', () => {
    expect(SUPPORTED_MARKET_EVENT_NAMES).toContain('DepositYT');
    expect(SUPPORTED_MARKET_EVENT_NAMES).toContain('DepositRefunded');
  });

  it('documents required portfolio projection event coverage', () => {
    expect(REQUIRED_PORTFOLIO_EVENT_NAMES).toEqual([
      'DepositYT',
      'WithdrawYT',
      'DepositRequested',
      'DepositBasePulled',
      'DepositRequestLinked',
      'DepositSettled',
      'DepositRejected',
      'DepositRefunded',
      'TrancheDeposit',
    ]);
  });
});
