import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('railway deploy config', () => {
  it('runs database migrations before starting the app', () => {
    const filePath = join(process.cwd(), 'railway.json');
    const config = JSON.parse(readFileSync(filePath, 'utf8')) as {
      deploy?: { preDeployCommand?: string[] };
    };

    expect(config.deploy?.preDeployCommand).toEqual(['pnpm db:migrate']);
  });
});
