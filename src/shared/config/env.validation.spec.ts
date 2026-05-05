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

  it('should validate projector config values', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
      RPC_URL: 'http://localhost:8545',
      MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
      CHAIN_ID: '84532',
      DEPLOYMENT_BLOCK: '123456',
      PROJECTOR_ENABLED: 'false',
      PROJECTOR_CONFIRMATIONS: '3',
      PROJECTOR_BATCH_SIZE: '2000',
      PROJECTOR_POLL_INTERVAL_MS: '15000',
    };

    const result = validateEnv(env);

    expect(result.CHAIN_ID).toBe(84532);
    expect(result.DEPLOYMENT_BLOCK).toBe(123456);
    expect(result.PROJECTOR_ENABLED).toBe(false);
    expect(result.PROJECTOR_CONFIRMATIONS).toBe(3);
    expect(result.PROJECTOR_BATCH_SIZE).toBe(2000);
    expect(result.PROJECTOR_POLL_INTERVAL_MS).toBe(15000);
  });

  it('should reject a negative deployment block', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
        RPC_URL: 'http://localhost:8545',
        MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
        DEPLOYMENT_BLOCK: '-1',
      }),
    ).toThrow();
  });

  it('should reject an invalid projector enabled value', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
        RPC_URL: 'http://localhost:8545',
        MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
        PROJECTOR_ENABLED: 'yes',
      }),
    ).toThrow();
  });

  it('should require a deployment block when projector is enabled', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/ladder_dev',
        RPC_URL: 'http://localhost:8545',
        MARKET_ADDRESS: '0x1234567890123456789012345678901234567890',
        DEPLOYMENT_BLOCK: '0',
        PROJECTOR_ENABLED: 'true',
      }),
    ).toThrow();
  });
});
