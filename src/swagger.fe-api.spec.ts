import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it, vi } from 'vitest';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { MarketStateModule } from './modules/market-state/market-state.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { QuotesModule } from './modules/quotes/quotes.module';

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
  async function createDocument() {
    const module = await Test.createTestingModule({
      imports: [MarketStateModule, PortfolioModule, QuotesModule],
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

    const actionSchema = document.components?.schemas?.QuoteActionDto as SchemaObject | undefined;
    const calldataIncluded = actionSchema?.properties?.calldataIncluded as SchemaObject | undefined;
    expect(calldataIncluded?.description).toContain('Always false');
    expect(calldataIncluded?.example).toBe(false);
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
    expect(earnings?.description).toContain('lazy-loaded earnings table and chart data');
    expect(earnings?.responses['200']?.description).toContain('Portfolio earnings table and chart payload');
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
