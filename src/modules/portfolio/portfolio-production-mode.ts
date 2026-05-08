export interface PortfolioMockPolicyOptions {
  includeMock?: boolean;
}

export function portfolioMockEnabled(options?: PortfolioMockPolicyOptions): boolean {
  return options?.includeMock === true && process.env['NODE_ENV'] !== 'production' && process.env['PORTFOLIO_MOCK_FALLBACK'] === 'true';
}
