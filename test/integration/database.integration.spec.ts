import { describe, it, expect } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

describe('Database Integration', () => {
  it('should connect to PostgreSQL via testcontainers', async () => {
       const databaseUrl = process.env['DATABASE_URL'];
    if (databaseUrl === undefined || databaseUrl === '') {
      throw new Error('DATABASE_URL is not set (globalSetup should set it)');
    }
    const client = postgres(databaseUrl);
    const db = drizzle(client);

    const result = await db.execute(sql`SELECT 1 as value`);
    const row = result[0] as { value: number } | undefined;
    expect(row?.value).toBe(1);

    await client.end();
  });
});
