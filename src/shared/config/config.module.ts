import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';
import {
  appConfig,
  databaseConfig,
  blockchainConfig,
  projectorConfig,
} from './app.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: validateEnv,
      load: [appConfig, databaseConfig, blockchainConfig, projectorConfig],
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
