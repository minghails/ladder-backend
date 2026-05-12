// Base Sepolia ABI package sourced from BaseScan verified pages provided by the operator.
// Do not build production integration ABIs from contracts_audit.

import { MIDAS_ADAPTOR_ABI, MIDAS_ADAPTOR_ADDRESS } from './midas-adaptor.abi';
import { MARKET_ABI, MARKET_ADDRESS } from './market.abi';
import { ST_TRANCHE_ABI, ST_TRANCHE_ADDRESS } from './st-tranche.abi';
import { JT_TRANCHE_ABI, JT_TRANCHE_ADDRESS } from './jt-tranche.abi';

export * from './midas-adaptor.abi';
export * from './market.abi';
export * from './st-tranche.abi';
export * from './jt-tranche.abi';

export const ERC20_METADATA_ABI = [
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const BASE_SEPOLIA_CHAIN_ID = 84532 as const;

export const BASE_SEPOLIA_ADDRESSES = {
  midasAdaptor: MIDAS_ADAPTOR_ADDRESS,
  market: MARKET_ADDRESS,
  stTranche: ST_TRANCHE_ADDRESS,
  jtTranche: JT_TRANCHE_ADDRESS,
} as const;

export const BASE_SEPOLIA_CONTRACTS = {
  midasAdaptor: { address: MIDAS_ADAPTOR_ADDRESS, abi: MIDAS_ADAPTOR_ABI },
  market: { address: MARKET_ADDRESS, abi: MARKET_ABI },
  stTranche: { address: ST_TRANCHE_ADDRESS, abi: ST_TRANCHE_ABI },
  jtTranche: { address: JT_TRANCHE_ADDRESS, abi: JT_TRANCHE_ABI },
} as const;
