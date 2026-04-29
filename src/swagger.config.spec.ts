import { describe, expect, it } from 'vitest';
import { buildSwaggerConfig, getSwaggerDescription } from './swagger.config';

describe('Swagger global configuration', () => {
  it('describes Ladder and backend responsibilities without handoff doc references', () => {
    const description = getSwaggerDescription();

    expect(description).toContain('Ladder is a perpetual on-chain yield tranching protocol');
    expect(description).toContain('Backend responsibilities include projection, orchestration, observability, and REST read APIs');
    expect(description).not.toContain('docs/2026-04-29-fe-api-integration-handoff.md');
  });

  it('uses a configured public URL when provided', () => {
    const config = buildSwaggerConfig({ publicUrl: 'https://ladder-api.up.railway.app/' });

    expect(config.servers).toEqual([
      {
        url: 'https://ladder-api.up.railway.app',
        description: 'Configured public API URL',
      },
    ]);
  });

  it('uses a relative server URL when no public URL is configured', () => {
    const config = buildSwaggerConfig({});

    expect(config.servers).toEqual([
      {
        url: '/',
        description: 'Current request origin',
      },
    ]);
  });
});
