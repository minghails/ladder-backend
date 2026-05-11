import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it, vi } from 'vitest';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './shared/common/health/health.controller';
import { DependencyHealthIndicator } from './shared/common/health/dependency-health.indicator';
import { MarketStateModule } from './modules/market-state/market-state.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { TxStatusModule } from './modules/tx-status/tx-status.module';

function createFeApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Ladder Markets API')
    .setDescription('Backend MVP FE-ready REST API documentation')
    .setVersion('0.1.0')
    .build();

  return SwaggerModule.createDocument(app, config);
}

const LIVE_MARKET: LiveMarketState = {
  address: '0x3aDa769dC813e3376fCD40d05bEA12263048A487',
  ytTokenAddress: '0x00000000000000000000000000000000000000b1',
  baseTokenAddress: '0x00000000000000000000000000000000000000a0',
  seniorTrancheAddress: '0x00000000000000000000000000000000000000c1',
  juniorTrancheAddress: '0x00000000000000000000000000000000000000d1',
  seniorSymbol: 'st-mEDGE',
  juniorSymbol: 'jt-mEDGE',
  nav: '40000000000000000000000000',
  navSt: '30000000000000000000000000',
  navJt: '10000000000000000000000000',
  currentStJtRatio: '3000000000000000000',
  maxStJtRatio: '6000000000000000000',
  latestYtPrice: '1000000000000000000',
  lastUpdatedTime: '1777392000',
  halted: false,
  capabilities: {
    depositBaseInstant: true,
    depositBaseRequest: true,
    withdrawBaseAsync: false,
    withdrawBaseInstant: false,
  },
};

describe('FE-ready Swagger documentation', () => {
  function readCanonicalDoc(path: string) {
    return readFileSync(resolve(__dirname, '..', '..', path), 'utf8');
  }

  async function createDocument() {
    const module = await Test.createTestingModule({
      imports: [MarketStateModule, PortfolioModule, QuotesModule, TxStatusModule],
    })
      .overrideProvider(ContractReaderService)
      .useValue({
        getMarketState: vi.fn().mockResolvedValue(LIVE_MARKET),
        getPortfolioPositions: vi.fn().mockResolvedValue([]),
      })
      .compile();

    const app = module.createNestApplication();
    const document = createFeApiDocument(app);
    await app.close();

    return document;
  }

  async function createHealthDocument() {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: vi.fn() },
        },
        {
          provide: DependencyHealthIndicator,
          useValue: { isHealthy: vi.fn() },
        },
      ],
    }).compile();

    const app = module.createNestApplication();
    const document = createFeApiDocument(app);
    await app.close();

    return document;
  }

  it('documents operational health endpoints for deploy probes', async () => {
    const document = await createHealthDocument();

    const health = document.paths['/health']?.get;
    expect(health?.summary).toBe('Run readiness health checks');
    expect(health?.description).toContain('PostgreSQL');
    expect(health?.description).toContain('projector cursor freshness');
    expect(health?.responses['200']?.description).toContain('Health Check is successful');
    expect(health?.responses['503']?.description).toContain('Health Check is not successful');

    const ready = document.paths['/health/ready']?.get;
    expect(ready?.summary).toBe('Run dependency readiness checks');
    expect(ready?.description).toContain('Railway');
    expect(ready?.description).toContain('HEALTH_PROJECTOR_MAX_LAG_BLOCKS');
    expect(ready?.responses['503']?.description).toContain('Health Check is not successful');

    const live = document.paths['/health/live']?.get;
    expect(live?.summary).toBe('Run process liveness check');
    expect(live?.description).toContain('Does not check PostgreSQL, RPC, or projector freshness');
  });

  it('documents market endpoints with FE-facing descriptions and schemas', async () => {
    const document = await createDocument();

    expect(document.paths['/markets']?.get?.summary).toBe('List FE-ready markets');
    expect(document.paths['/markets']?.get?.description).toContain('Explore Markets table');
    expect(document.paths['/markets']?.get?.responses['200']?.description).toContain(
      'Markets available for Explore screens',
    );

    const marketDetail = document.paths['/markets/{address}']?.get;
    expect(marketDetail?.summary).toBe('Get FE-ready market detail');
    expect(marketDetail?.description).toContain('market card');
    const marketAddressParam = marketDetail?.parameters?.find(
      (parameter) => 'name' in parameter && parameter.name === 'address',
    );
    expect(marketAddressParam).toBeDefined();
    expect(marketAddressParam).toBeDefined();
    if (!marketAddressParam || !('name' in marketAddressParam)) {
      throw new Error('Expected market address path parameter');
    }
    expect(marketAddressParam.name).toBe('address');
    expect(marketAddressParam.in).toBe('path');
    expect(marketAddressParam.description).toContain('Market contract');
    expect(marketAddressParam.schema).toMatchObject({
      example: '0x0000000000000000000000000000000000000001',
      type: 'string',
    });
    expect(marketDetail?.responses['404']?.description).toContain('Market not found');

    expect(document.paths['/markets/{address}/trade-constraints']?.get?.summary).toBe('Get FE trade constraints');
    expect(document.paths['/markets/{address}/deposit-limits']?.get?.summary).toBe('Get market deposit limits');
    expect(document.paths['/markets/{address}/price-status']?.get?.summary).toBe('Get market price freshness status');
    expect(document.paths['/markets/{address}/factsheet']?.get?.summary).toBe('Get market factsheet');
    expect(document.paths['/markets/{address}/history']?.get?.summary).toBe('Get indexed market history');
    const charts = document.paths['/markets/{address}/charts']?.get;
    expect(charts?.summary).toBe('Get market chart payload');
    expect(charts?.parameters?.some((parameter) => 'name' in parameter && parameter.name === 'metric')).toBe(true);
  });

  it('documents quote endpoints as action hints without calldata', async () => {
    const document = await createDocument();

    const depositBase = document.paths['/quotes/deposit-base']?.post;
    expect(depositBase?.summary).toBe('Quote base-token deposit');
    expect(depositBase?.description).toContain('never includes raw calldata');

    const withdrawYt = document.paths['/quotes/withdraw-yt']?.post;
    expect(withdrawYt?.summary).toBe('Quote YT withdrawal');
    expect(withdrawYt?.description).toContain('never includes raw calldata');

    const depositYt = document.paths['/quotes/deposit-yt']?.post;
    expect(depositYt?.summary).toBe('Quote direct YT deposit');
    expect(depositYt?.description).toContain('never includes raw calldata');

    const depositBaseRequestSchema = document.components?.schemas?.DepositBaseQuoteRequestDto as SchemaObject | undefined;
    const senderProperty = depositBaseRequestSchema?.properties?.sender as SchemaObject | undefined;
    expect(senderProperty).toBeDefined();
    expect(senderProperty?.description).toContain('wallet address used as eth_call sender');

    const actionSchema = document.components?.schemas?.QuoteActionDto as SchemaObject | undefined;
    const calldataIncluded = actionSchema?.properties?.calldataIncluded as SchemaObject | undefined;
    expect(calldataIncluded?.description).toContain('Always false');
    expect(calldataIncluded?.example).toBe(false);

    const apiContract = readCanonicalDoc('docs/canonical/api-contract.md');
    expect(apiContract).toContain('estimateType = "simulated_onchain"');
    expect(apiContract).toContain('sender is required for exact current-block simulation');
    expect(apiContract).toContain('calldataIncluded = false');
  });

  it('documents tx status endpoint backed by indexed events', async () => {
    const document = await createDocument();

    const txStatus = document.paths['/tx/{hash}']?.get;
    expect(txStatus?.summary).toBe('Get indexed transaction status');
    expect(txStatus?.description).toContain('indexed market events');
    expect(txStatus?.description).toContain('does not sign, submit, or generate transaction calldata');
    expect(txStatus?.parameters?.some((parameter) => 'name' in parameter && parameter.name === 'hash')).toBe(true);
  });

  it('documents FE wagmi demo smoke checklist in canonical API and integration rules', () => {
    const apiContract = readCanonicalDoc('docs/canonical/api-contract.md');
    const integrationRules = readCanonicalDoc('docs/canonical/integration-rules.md');

    expect(apiContract).toContain('## FE wagmi demo smoke checklist');
    expect(apiContract).toContain('GET /markets/:address/trade-constraints');
    expect(apiContract).toContain('POST /quotes/deposit-yt');
    expect(apiContract).toContain('POST /quotes/deposit-base');
    expect(apiContract).toContain('POST /quotes/withdraw-yt');
    expect(apiContract).toContain('GET /tx/:hash');
    expect(apiContract).toContain('calldataIncluded = false');
    expect(integrationRules).toContain('## FE wagmi transaction flow');
    expect(integrationRules).toContain('Backend never signs transactions, stores private keys, submits wallet transactions, or returns mandatory calldata');
  });

  it('documents portfolio endpoints with wallet parameters, mock controls, pagination, and split response schemas', async () => {
    const document = await createDocument();

    const portfolio = document.paths['/portfolio/{address}']?.get;
    expect(portfolio?.summary).toBe('Get lightweight FE-ready portfolio overview');
    expect(portfolio?.description).toContain('lightweight initial-render data');
    expect(portfolio?.description).toContain('lazy-load split endpoints');
    expect(portfolio?.responses['200']?.description).toContain('lightweight');
    const walletAddressParam = portfolio?.parameters?.find(
      (parameter) => 'name' in parameter && parameter.name === 'address',
    );
    expect(walletAddressParam).toBeDefined();
    if (!walletAddressParam || !('name' in walletAddressParam)) {
      throw new Error('Expected wallet address path parameter');
    }
    expect(walletAddressParam.name).toBe('address');
    expect(walletAddressParam.in).toBe('path');
    expect(walletAddressParam.description).toContain('Wallet address');
    const overviewIncludeMock = portfolio?.parameters?.find(
      (parameter) => 'name' in parameter && parameter.name === 'includeMock',
    );
    expect(overviewIncludeMock).toBeDefined();

    const requests = document.paths['/portfolio/{address}/requests']?.get;
    expect(requests?.summary).toBe('List portfolio deposit requests');
    expect(requests?.description).toContain('paginated deposit request history');
    expect(requests?.responses['200']?.description).toContain('Paginated deposit request history');
    expect(requests?.parameters?.some((parameter) => 'name' in parameter && parameter.name === 'limit')).toBe(true);
    expect(requests?.parameters?.some((parameter) => 'name' in parameter && parameter.name === 'cursor')).toBe(true);

    const earnings = document.paths['/portfolio/{address}/earnings']?.get;
    expect(earnings?.summary).toBe('Get portfolio earnings section');
    expect(earnings?.description).toContain('lazy-loaded earnings table and history data');
    expect(earnings?.responses['200']?.description).toContain('Portfolio earnings table and history payload');
    expect(earnings?.parameters?.some((parameter) => 'name' in parameter && parameter.name === 'range')).toBe(true);

    const claimables = document.paths['/portfolio/{address}/claimables']?.get;
    expect(claimables?.summary).toBe('Get portfolio claimable rows');
    expect(claimables?.responses['200']?.description).toContain('Paginated claimable rows');
    expect(claimables?.parameters?.some((parameter) => 'name' in parameter && parameter.name === 'limit')).toBe(true);

    const activities = document.paths['/portfolio/{address}/activities']?.get;
    expect(activities?.summary).toBe('Get portfolio activity rows');
    expect(activities?.responses['200']?.description).toContain('Paginated portfolio activity rows');
    expect(activities?.parameters?.some((parameter) => 'name' in parameter && parameter.name === 'cursor')).toBe(true);
  });

  it('includes nested schemas with field-level FE semantics', async () => {
    const document = await createDocument();

    const marketRatioSchema = document.components?.schemas?.MarketRatioDto as SchemaObject | undefined;
    expect(marketRatioSchema).toBeDefined();
    const marketRatioProperties = marketRatioSchema?.properties;
    const stJtRatioProperty = marketRatioProperties?.stJtRatio as SchemaObject | undefined;
    const maxStJtRatioProperty = marketRatioProperties?.maxStJtRatio as SchemaObject | undefined;
    expect(stJtRatioProperty?.description).toContain('1e18-scaled contract value');
    expect(stJtRatioProperty?.example).toBe('3');
    expect(maxStJtRatioProperty?.description).toContain('1e18-scaled contract value');
    expect(maxStJtRatioProperty?.example).toBe('6');

    const marketTrancheSchema = document.components?.schemas?.MarketTrancheDto as SchemaObject | undefined;
    const trancheTvlProperty = marketTrancheSchema?.properties?.tvl as SchemaObject | undefined;
    expect(trancheTvlProperty?.description).toContain('raw token precision');
    expect(trancheTvlProperty?.example).toBe('30000000000000000000000000');

    const portfolioDataQualitySchema = document.components?.schemas?.PortfolioDataQualityDto as SchemaObject | undefined;
    expect(portfolioDataQualitySchema).toBeDefined();
    const earningsEstimatedProperty = portfolioDataQualitySchema?.properties?.earningsEstimated as SchemaObject | undefined;
    const mockEnabledProperty = portfolioDataQualitySchema?.properties?.mockEnabled as SchemaObject | undefined;
    const sourcesProperty = portfolioDataQualitySchema?.properties?.sources as SchemaObject | undefined;
    expect(earningsEstimatedProperty?.description).toContain('mock-derived');
    expect(mockEnabledProperty?.description).toContain('mock fallback data');
    expect(sourcesProperty?.description).toContain('Per-section data source');

    const portfolioLinksSchema = document.components?.schemas?.PortfolioLinksDto as SchemaObject | undefined;
    expect(portfolioLinksSchema).toBeDefined();
    expect(portfolioLinksSchema?.properties?.earnings).toBeDefined();
    expect(portfolioLinksSchema?.properties?.activities).toBeDefined();

    const pageSchema = document.components?.schemas?.PageDto as SchemaObject | undefined;
    expect(pageSchema).toBeDefined();
    expect(pageSchema?.properties?.nextCursor).toBeDefined();

    const claimActionSchema = document.components?.schemas?.PortfolioClaimActionDto as SchemaObject | undefined;
    const enabledProperty = claimActionSchema?.properties?.enabled as SchemaObject | undefined;
    expect(enabledProperty?.description).toContain('Mock rows are disabled');
  });
});
