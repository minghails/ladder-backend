import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StandardExceptionFilter } from './shared/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new StandardExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ladder Markets API')
    .setDescription(
      [
        'Backend MVP FE-ready REST API documentation for Ladder markets.',
        '',
        'Current documented slice focuses on the endpoints in docs/2026-04-29-fe-api-integration-handoff.md.',
        'Public/read-only endpoints do not require authentication in this MVP slice.',
        'Monetary, TVL, NAV, token amount, and position value fields are returned as raw precision strings unless a field explicitly documents formatted semantics.',
        'Ratio fields are formatted decimal strings derived from 1e18-scaled contract values. APY/change/earning fields are currently explicit zero placeholders where documented.',
      ].join('\n'),
    )
    .setVersion('0.1.0')
    .addServer('http://localhost:3000', 'Local development')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

void bootstrap();
