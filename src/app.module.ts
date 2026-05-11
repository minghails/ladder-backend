import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { BlockchainModule } from './shared/blockchain/blockchain.module';
import { HealthController } from './shared/common/health/health.controller';
import { DependencyHealthIndicator } from './shared/common/health/dependency-health.indicator';
import { ChainProjectorModule } from './modules/chain-projector/chain-projector.module';
import { MarketStateModule } from './modules/market-state/market-state.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { DepositRequestsModule } from './modules/deposit-requests/deposit-requests.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { RiskMonitoringModule } from './modules/risk-monitoring/risk-monitoring.module';
import { AdminOpsModule } from './modules/admin-ops/admin-ops.module';
import { TxStatusModule } from './modules/tx-status/tx-status.module';

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
    ChainProjectorModule,
    MarketStateModule,
    OracleModule,
    DepositRequestsModule,
    QuotesModule,
    PortfolioModule,
    RiskMonitoringModule,
    AdminOpsModule,
    TxStatusModule,
  ],
  controllers: [HealthController],
  providers: [DependencyHealthIndicator],
})
export class AppModule {}
