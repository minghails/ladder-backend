import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StandardExceptionFilter } from './shared/common/filters/http-exception.filter';
import { buildSwaggerConfig } from './swagger.config';

/**
 * Always merged in development/test with `CORS_ALLOWED_ORIGINS` (Nest default port + Vite dev port).
 * Other dev ports: add them via `CORS_ALLOWED_ORIGINS` (comma-separated).
 */
const DEFAULT_LOCAL_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
] as const;

function configStringArray(config: ConfigService, key: string): string[] {
  const raw: unknown = config.get(key);
  return Array.isArray(raw) && raw.every((x): x is string => typeof x === 'string')
    ? raw
    : [];
}

function resolveCorsAllowedOrigins(
  nodeEnv: string,
  configured: readonly string[],
): string[] {
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    return [...new Set([...DEFAULT_LOCAL_DEV_CORS_ORIGINS, ...configured])];
  }
  return [...configured];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new StandardExceptionFilter());

  const config = app.get(ConfigService);
  const nodeEnv =
    config.get<string>('app.nodeEnv', { infer: true }) ?? 'development';
  const corsConfigured = configStringArray(config, 'app.corsAllowedOrigins');
  const allowedOrigins = resolveCorsAllowedOrigins(nodeEnv, corsConfigured);

  const originAllowlist: CustomOrigin = (origin, callback) => {
    if (origin === undefined || origin === '') {
      callback(null, true);
      return;
    }
    callback(null, allowedOrigins.includes(origin));
  };

  app.enableCors({
    origin: originAllowlist,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerConfig = buildSwaggerConfig({ publicUrl: process.env['PUBLIC_API_URL'] });
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

void bootstrap();
