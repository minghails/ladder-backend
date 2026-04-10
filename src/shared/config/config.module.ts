import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';
import { appConfig, databaseConfig, blockchainConfig } from './app.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: validateEnv,
      load: [appConfig, databaseConfig, blockchainConfig],
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
