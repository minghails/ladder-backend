import { registerAs } from '@nestjs/config';
import { parseCorsAllowedOrigins } from './env.validation';

const BASE_SEPOLIA_EXTERNAL_ADDRESSES = {
  baseTokenAddress: '0x9bB1435C8891D29bE80a014801e94c4Ff09c43C4',
  mTokenAddress: '0x7060176d148D07834050473C8a9123244c0B44CD',
  midasPriceOracleAddress: '0xBC63EdD2939fc399f4B8Fcc7658D0b71883c4168',
  midasIssuanceVaultAddress: '0x9cA9EEd250A23ce04Cac9632930fe360cF84dF04',
  midasRedemptionVaultAddress: '0x28Cc6C6e7C0c92Fa45DaCa66752F2B0eD5B9910d',
} as const;

function externalAddress(envKey: string, defaultValue?: string): string | undefined {
  return process.env[envKey] ?? defaultValue;
}

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  publicApiUrl: process.env['PUBLIC_API_URL'],
  corsAllowedOrigins: parseCorsAllowedOrigins(
    process.env['CORS_ALLOWED_ORIGINS'],
  ),
}));

export const databaseConfig = registerAs('database', () => {
  const url = process.env['DATABASE_URL'];
  if (url === undefined || url === '') {
    throw new Error('DATABASE_URL is not set');
  }
  return { url };
});

export const blockchainConfig = registerAs('blockchain', () => {
  const rpcUrl = process.env['RPC_URL'];
  const marketAddress = process.env['MARKET_ADDRESS'];
  const chainId = parseInt(process.env['CHAIN_ID'] ?? '84532', 10);
  const defaults = chainId === 84532 ? BASE_SEPOLIA_EXTERNAL_ADDRESSES : undefined;
  const baseTokenAddress = externalAddress('BASE_TOKEN_ADDRESS', defaults?.baseTokenAddress);
  const mTokenAddress = externalAddress('MTOKEN_ADDRESS', defaults?.mTokenAddress);
  const midasPriceOracleAddress = externalAddress('MIDAS_PRICE_ORACLE_ADDRESS', defaults?.midasPriceOracleAddress);
  const midasIssuanceVaultAddress = externalAddress('MIDAS_ISSUANCE_VAULT_ADDRESS', defaults?.midasIssuanceVaultAddress);
  const midasRedemptionVaultAddress = externalAddress('MIDAS_REDEMPTION_VAULT_ADDRESS', defaults?.midasRedemptionVaultAddress);
  if (rpcUrl === undefined || rpcUrl === '') {
    throw new Error('RPC_URL is not set');
  }
  if (marketAddress === undefined || marketAddress === '') {
    throw new Error('MARKET_ADDRESS is not set');
  }
  if (baseTokenAddress === undefined || baseTokenAddress === '') {
    throw new Error('BASE_TOKEN_ADDRESS is not set');
  }
  return {
    rpcUrl,
    marketAddress,
    baseTokenAddress,
    mTokenAddress,
    midasPriceOracleAddress,
    midasIssuanceVaultAddress,
    midasRedemptionVaultAddress,
    readCacheTtlMs: parseInt(
      process.env['RPC_READ_CACHE_TTL_MS'] ?? '15000',
      10,
    ),
  };
});

export const projectorConfig = registerAs('projector', () => ({
  chainId: parseInt(process.env['CHAIN_ID'] ?? '84532', 10),
  deploymentBlock: parseInt(process.env['DEPLOYMENT_BLOCK'] ?? '0', 10),
  enabled: process.env['PROJECTOR_ENABLED'] === 'true',
  confirmations: parseInt(process.env['PROJECTOR_CONFIRMATIONS'] ?? '3', 10),
  batchSize: parseInt(process.env['PROJECTOR_BATCH_SIZE'] ?? '2000', 10),
  pollIntervalMs: parseInt(
    process.env['PROJECTOR_POLL_INTERVAL_MS'] ?? '15000',
    10,
  ),
}));

export const healthConfig = registerAs('health', () => ({
  timeoutMs: parseInt(process.env['HEALTH_CHECK_TIMEOUT_MS'] ?? '1000', 10),
  projectorMaxLagBlocks: parseInt(
    process.env['HEALTH_PROJECTOR_MAX_LAG_BLOCKS'] ?? '20',
    10,
  ),
  projectorLagCheckEnabled:
    process.env['HEALTH_PROJECTOR_LAG_CHECK_ENABLED'] !== 'false',
}));
