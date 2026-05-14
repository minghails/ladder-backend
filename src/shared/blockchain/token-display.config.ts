export const PRODUCT_TOKEN_DISPLAY_SYMBOLS_BY_ADDRESS: Record<string, string> = {
  '0x7060176d148d07834050473c8a9123244c0b44cd': 'mEDGE',
};

export interface MarketDisplayTokenInput {
  ytTokenAddress: string;
  seniorSymbol: string;
}

export function stripTranchePrefix(symbol: string): string {
  return symbol.replace(/^(st|jt)-/i, '') || symbol;
}

export function ytDisplaySymbol(token: MarketDisplayTokenInput): string {
  return PRODUCT_TOKEN_DISPLAY_SYMBOLS_BY_ADDRESS[token.ytTokenAddress.toLowerCase()] ?? stripTranchePrefix(token.seniorSymbol);
}

export function marketDisplaySymbol(token: MarketDisplayTokenInput): string {
  return ytDisplaySymbol(token);
}
