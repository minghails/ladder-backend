import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StandardExceptionFilter } from './shared/common/filters/http-exception.filter';
import { buildSwaggerConfig } from './swagger.config';

const LOCAL_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
] as const;

function resolveCorsAllowedOrigins(
  nodeEnv: string,
  configured: readonly string[],
): string[] {
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    return [...new Set([...LOCAL_DEV_CORS_ORIGINS, ...configured])];
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
  const corsConfigured =
    config.get<string[]>('app.corsAllowedOrigins', { infer: true }) ?? [];
  const allowedOrigins = resolveCorsAllowedOrigins(nodeEnv, corsConfigured);

  app.enableCors({
    origin: (origin, callback) => {
      if (origin === undefined || origin === '') {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
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
