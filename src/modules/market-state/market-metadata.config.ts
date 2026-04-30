export const BASE_SEPOLIA_MARKET_NETWORK = {
  chainId: 84532,
  name: 'Base Sepolia',
  icon: 'ethereum',
} as const;

export const MARKET_SETTLEMENT_LABELS = {
  depositBaseInstant: 'Instant when adaptor liquidity is available',
  depositBaseRequest: 'Async request/settlement flow',
  withdrawYt: 'Direct YT withdrawal through tranche vault',
} as const;

export const MARKET_FACTSHEET_ROWS = [
  { label: 'Underlying', value: 'mEDGE', source: 'config' },
  { label: 'Base Asset', value: 'USDC', source: 'config' },
  { label: 'Network', value: BASE_SEPOLIA_MARKET_NETWORK.name, source: 'config' },
  { label: 'Senior Claim', value: 'Benchmark yield, first claim', source: 'config' },
  { label: 'Junior Claim', value: 'First-loss, leveraged upside', source: 'config' },
  { label: 'Carry Fee', value: '20% of Junior leverage excess', source: 'config' },
] as const;

export type MarketChartMetric = 'yield' | 'tokenPrice' | 'tvl' | 'utilization' | 'ratio';
export type MarketChartRange = '30d';

export const MARKET_CHART_FIXTURES: Record<
  MarketChartMetric,
  {
    label: string;
    value: string;
    unit: string;
    values: string[];
  }
> = {
  yield: {
    label: 'Yield APY',
    value: '8.40',
    unit: '%',
    values: ['7.90', '8.05', '8.18', '8.22', '8.36', '8.40'],
  },
  tokenPrice: {
    label: 'Token Price',
    value: '1.00',
    unit: 'USD',
    values: ['0.998', '0.999', '1.000', '1.001', '1.000', '1.000'],
  },
  tvl: {
    label: 'TVL',
    value: '40000000',
    unit: 'USD',
    values: ['36000000', '37200000', '38100000', '38900000', '39500000', '40000000'],
  },
  utilization: {
    label: 'Utilization',
    value: '72.00',
    unit: '%',
    values: ['68.00', '69.50', '70.00', '71.00', '71.50', '72.00'],
  },
  ratio: {
    label: 'Senior/Junior Ratio',
    value: '3.00',
    unit: 'x',
    values: ['2.70', '2.80', '2.90', '3.00', '3.00', '3.00'],
  },
};
