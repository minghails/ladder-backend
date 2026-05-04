import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  publicApiUrl: process.env['PUBLIC_API_URL'],
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
  if (rpcUrl === undefined || rpcUrl === '') {
    throw new Error('RPC_URL is not set');
  }
  if (marketAddress === undefined || marketAddress === '') {
    throw new Error('MARKET_ADDRESS is not set');
  }
  return { rpcUrl, marketAddress };
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
