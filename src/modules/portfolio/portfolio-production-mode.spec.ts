import { afterEach, describe, expect, it } from 'vitest';
import { portfolioMockEnabled } from './portfolio-production-mode';

const ORIGINAL_NODE_ENV = process.env['NODE_ENV'];
const ORIGINAL_MOCK_FALLBACK = process.env['PORTFOLIO_MOCK_FALLBACK'];

function restoreEnv() {
  if (ORIGINAL_NODE_ENV === undefined) {
    delete process.env['NODE_ENV'];
  } else {
    process.env['NODE_ENV'] = ORIGINAL_NODE_ENV;
  }

  if (ORIGINAL_MOCK_FALLBACK === undefined) {
    delete process.env['PORTFOLIO_MOCK_FALLBACK'];
  } else {
    process.env['PORTFOLIO_MOCK_FALLBACK'] = ORIGINAL_MOCK_FALLBACK;
  }
}

describe('portfolioMockEnabled', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('disables mock rows in production even when requested and fallback is enabled', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';

    expect(portfolioMockEnabled({ includeMock: true })).toBe(false);
  });

  it('disables mock rows by default when no query opt-in is provided', () => {
    delete process.env['NODE_ENV'];
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';

    expect(portfolioMockEnabled()).toBe(false);
  });

  it('disables mock rows when query opt-in is present but env fallback is not enabled', () => {
    delete process.env['NODE_ENV'];
    delete process.env['PORTFOLIO_MOCK_FALLBACK'];

    expect(portfolioMockEnabled({ includeMock: true })).toBe(false);
  });

  it('enables mock rows only for local sandbox when env fallback and query opt-in are both enabled', () => {
    process.env['NODE_ENV'] = 'test';
    process.env['PORTFOLIO_MOCK_FALLBACK'] = 'true';

    expect(portfolioMockEnabled({ includeMock: true })).toBe(true);
  });
});
