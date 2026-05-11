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

export const MARKET_FACTSHEET_CONFIG_ROWS = [
  { label: 'Senior Claim', value: 'Benchmark yield, first claim', source: 'config' },
  { label: 'Junior Claim', value: 'First-loss, leveraged upside', source: 'config' },
] as const;

export type MarketChartMetric = 'yield' | 'tokenPrice' | 'tvl' | 'utilization' | 'ratio';
export const MARKET_CHART_RANGES = ['7d', '30d', '90d', '1y'] as const;
export type MarketChartRange = (typeof MARKET_CHART_RANGES)[number];

export const MARKET_CHART_CONFIG: Record<
  MarketChartMetric,
  {
    label: string;
    unit: string;
  }
> = {
  yield: {
    label: 'Yield APY',
    unit: '%',
  },
  tokenPrice: {
    label: 'Token Price',
    unit: 'USD',
  },
  tvl: {
    label: 'TVL',
    unit: 'USD',
  },
  utilization: {
    label: 'Utilization',
    unit: '%',
  },
  ratio: {
    label: 'Senior/Junior Ratio',
    unit: 'x',
  },
};
