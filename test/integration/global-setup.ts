import { PostgreSqlContainer } from '@testcontainers/postgresql';

export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  process.env['DATABASE_URL'] = container.getConnectionUri();

  return async function teardown() {
    await container.stop();
  };
}
