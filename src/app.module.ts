import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { BlockchainModule } from './shared/blockchain/blockchain.module';
import { HealthController } from './shared/common/health/health.controller';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    TerminusModule,
    DatabaseModule,
    BlockchainModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
