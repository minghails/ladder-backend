import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),
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
