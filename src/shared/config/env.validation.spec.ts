import { describe, it, expect } from 'vitest';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('should validate a complete valid env', () => {
    const env = {
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
      RPC_URL: 'http://localhost:8545',
      MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
    };

    const result = validateEnv(env);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should throw on missing required fields', () => {
    expect(() => validateEnv({})).toThrow();
  });

  it('should apply defaults for optional fields', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
      RPC_URL: 'http://localhost:8545',
      MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
    };

    const result = validateEnv(env);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should allow an optional public API URL for deployed Swagger docs', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
      RPC_URL: 'http://localhost:8545',
      MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
      PUBLIC_API_URL: 'https://ladder-api.up.railway.app',
    };

    const result = validateEnv(env);
    expect(result.PUBLIC_API_URL).toBe('https://ladder-api.up.railway.app');
  });
});
