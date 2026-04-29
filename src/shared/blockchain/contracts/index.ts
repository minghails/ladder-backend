// Base Sepolia ABI package sourced from BaseScan verified pages provided by the operator.
// Do not build production integration ABIs from contracts_audit.

import { MOCK_USDC_ABI, MOCK_USDC_ADDRESS } from './mock-usdc.abi';
import { MOCK_MTOKEN_ABI, MOCK_MTOKEN_ADDRESS } from './mock-mtoken.abi';
import {
  MOCK_MIDAS_PRICE_ORACLE_ABI,
  MOCK_MIDAS_PRICE_ORACLE_ADDRESS,
} from './mock-midas-price-oracle.abi';
import {
  MOCK_MIDAS_ISSUANCE_VAULT_ABI,
  MOCK_MIDAS_ISSUANCE_VAULT_ADDRESS,
} from './mock-midas-issuance-vault.abi';
import {
  MOCK_MIDAS_REDEMPTION_VAULT_ABI,
  MOCK_MIDAS_REDEMPTION_VAULT_ADDRESS,
} from './mock-midas-redemption-vault.abi';
import { MIDAS_ADAPTOR_ABI, MIDAS_ADAPTOR_ADDRESS } from './midas-adaptor.abi';
import { MARKET_ABI, MARKET_ADDRESS } from './market.abi';
import { ST_TRANCHE_ABI, ST_TRANCHE_ADDRESS } from './st-tranche.abi';
import { JT_TRANCHE_ABI, JT_TRANCHE_ADDRESS } from './jt-tranche.abi';

export * from './mock-usdc.abi';
export * from './mock-mtoken.abi';
export * from './mock-midas-price-oracle.abi';
export * from './mock-midas-issuance-vault.abi';
export * from './mock-midas-redemption-vault.abi';
export * from './midas-adaptor.abi';
export * from './market.abi';
export * from './st-tranche.abi';
export * from './jt-tranche.abi';

export const BASE_SEPOLIA_CHAIN_ID = 84532 as const;

export const BASE_SEPOLIA_ADDRESSES = {
  mockUSDC: MOCK_USDC_ADDRESS,
  mockMToken: MOCK_MTOKEN_ADDRESS,
  mockMidasPriceOracle: MOCK_MIDAS_PRICE_ORACLE_ADDRESS,
  mockMidasIssuanceVault: MOCK_MIDAS_ISSUANCE_VAULT_ADDRESS,
  mockMidasRedemptionVault: MOCK_MIDAS_REDEMPTION_VAULT_ADDRESS,
  midasAdaptor: MIDAS_ADAPTOR_ADDRESS,
  market: MARKET_ADDRESS,
  stTranche: ST_TRANCHE_ADDRESS,
  jtTranche: JT_TRANCHE_ADDRESS,
} as const;

export const BASE_SEPOLIA_CONTRACTS = {
  mockUSDC: { address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI },
  mockMToken: { address: MOCK_MTOKEN_ADDRESS, abi: MOCK_MTOKEN_ABI },
  mockMidasPriceOracle: {
    address: MOCK_MIDAS_PRICE_ORACLE_ADDRESS,
    abi: MOCK_MIDAS_PRICE_ORACLE_ABI,
  },
  mockMidasIssuanceVault: {
    address: MOCK_MIDAS_ISSUANCE_VAULT_ADDRESS,
    abi: MOCK_MIDAS_ISSUANCE_VAULT_ABI,
  },
  mockMidasRedemptionVault: {
    address: MOCK_MIDAS_REDEMPTION_VAULT_ADDRESS,
    abi: MOCK_MIDAS_REDEMPTION_VAULT_ABI,
  },
  midasAdaptor: { address: MIDAS_ADAPTOR_ADDRESS, abi: MIDAS_ADAPTOR_ABI },
  market: { address: MARKET_ADDRESS, abi: MARKET_ABI },
  stTranche: { address: ST_TRANCHE_ADDRESS, abi: ST_TRANCHE_ABI },
  jtTranche: { address: JT_TRANCHE_ADDRESS, abi: JT_TRANCHE_ABI },
} as const;
