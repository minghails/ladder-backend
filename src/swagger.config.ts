import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

const SWAGGER_DESCRIPTION = [
  'Ladder is a perpetual on-chain yield tranching protocol for ERC-4626 assets, splitting yield token exposure into Senior and Junior tranches.',
  '',
  'This backend is the NestJS REST API for the current one-market MVP. Deployed contracts remain the execution source of truth. Backend responsibilities include projection, orchestration, observability, and REST read APIs for frontend and operator workflows.',
  'Public/read-only endpoints do not require authentication in this MVP. Admin endpoints are intended for operator workflows.',
  'Monetary, TVL, NAV, token amount, and position value fields are returned as raw precision strings unless a field explicitly documents formatted semantics.',
  'Ratio fields are formatted decimal strings derived from 1e18-scaled contract values.',
].join('\n');

export type SwaggerConfigOptions = {
  publicUrl?: string;
};

export function getSwaggerDescription(): string {
  return SWAGGER_DESCRIPTION;
}

function normalizePublicUrl(publicUrl: string): string {
  return publicUrl.replace(/\/+$/, '');
}

export function buildSwaggerConfig(options: SwaggerConfigOptions = {}): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle('Ladder Markets API')
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion('0.1.0');

  if (options.publicUrl !== undefined && options.publicUrl.trim() !== '') {
    builder.addServer(normalizePublicUrl(options.publicUrl.trim()), 'Configured public API URL');
  } else {
    builder.addServer('/', 'Current request origin');
  }

  return builder.build();
}
