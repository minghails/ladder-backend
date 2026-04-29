import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it, vi } from 'vitest';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { MarketStateModule } from './modules/market-state/market-state.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';

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
      imports: [MarketStateModule, PortfolioModule],
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
  });

  it('documents portfolio endpoints with wallet parameters and data-quality notes', async () => {
    const document = await createDocument();

    const portfolio = document.paths['/portfolio/{address}']?.get;
    expect(portfolio?.summary).toBe('Get FE-ready portfolio overview');
    expect(portfolio?.description).toContain('Portfolio and Activities page');
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

    const requests = document.paths['/portfolio/{address}/requests']?.get;
    expect(requests?.summary).toBe('List portfolio deposit requests');
    expect(requests?.description).toContain('Pending/In Queue');
    expect(requests?.responses['200']?.description).toContain('Deposit request history');
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
    expect(earningsEstimatedProperty?.description).toContain('zero placeholders');
  });
});
