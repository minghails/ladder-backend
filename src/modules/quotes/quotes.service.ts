import { Injectable, NotFoundException } from '@nestjs/common';
import { ContractReaderService, type LiveMarketState } from '@shared/blockchain/contract-reader.service';
import { calculateSeniorDepositCapacity, isPriceStale } from '../market-state/market-calculations';

export type QuoteTranche = 'senior' | 'junior';

export interface DepositBaseQuoteRequest {
  market: string;
  tranche: QuoteTranche;
  amount: string;
  slippageBps?: number;
}

export interface WithdrawYtQuoteRequest {
  market: string;
  tranche: QuoteTranche;
  shares: string;
  slippageBps?: number;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function statusWarnings(live: LiveMarketState): string[] {
  return [...(live.halted ? ['MARKET_HALTED'] : []), ...(isPriceStale(live.lastUpdatedTime) ? ['STALE_PRICE'] : [])];
}

function trancheToken(live: LiveMarketState, tranche: QuoteTranche): string {
  return tranche === 'senior' ? live.seniorTrancheAddress : live.juniorTrancheAddress;
}

@Injectable()
export class QuotesService {
  constructor(private readonly contractReader: ContractReaderService) {}

  async quoteDepositBase(request: DepositBaseQuoteRequest) {
    const live = await this.getLiveMarket(request.market);
    const warnings = statusWarnings(live);
    const outputToken = trancheToken(live, request.tranche);
    const seniorCapacity = calculateSeniorDepositCapacity(live.navSt, live.navJt, live.maxStJtRatio);
    const capacityExceeded = request.tranche === 'senior' && BigInt(request.amount) > BigInt(seniorCapacity);
    const unavailableReason = live.halted
      ? 'MARKET_HALTED'
      : !live.capabilities.depositBaseInstant
        ? 'DEPOSIT_BASE_INSTANT_UNAVAILABLE'
        : capacityExceeded
          ? 'SENIOR_CAPACITY_EXCEEDED'
          : null;

    if (capacityExceeded) {
      warnings.push('SENIOR_CAPACITY_EXCEEDED');
    }

    return {
      input: {
        market: live.address,
        tranche: request.tranche,
        amount: request.amount,
        token: live.baseTokenAddress,
        slippageBps: request.slippageBps ?? null,
      },
      output: {
        token: outputToken,
        amount: request.amount,
        estimateType: 'placeholder',
      },
      availability: {
        available: unavailableReason === null,
        reason: unavailableReason,
      },
      warnings,
      action: {
        contract: live.address,
        method: 'depositInstant',
        approvalRequired: true,
        approvalToken: live.baseTokenAddress,
        calldataIncluded: false,
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          output: 'placeholder',
          constraints: 'derived',
        },
      },
    };
  }

  async quoteWithdrawYt(request: WithdrawYtQuoteRequest) {
    const live = await this.getLiveMarket(request.market);
    const warnings = statusWarnings(live);
    const token = trancheToken(live, request.tranche);

    return {
      input: {
        market: live.address,
        tranche: request.tranche,
        shares: request.shares,
        token,
        slippageBps: request.slippageBps ?? null,
      },
      output: {
        token: live.ytTokenAddress,
        amount: request.shares,
        estimateType: 'placeholder',
      },
      availability: {
        available: !live.halted,
        reason: live.halted ? 'MARKET_HALTED' : null,
      },
      warnings,
      action: {
        contract: token,
        method: 'redeem',
        approvalRequired: false,
        calldataIncluded: false,
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          output: 'placeholder',
          constraints: 'derived',
        },
      },
    };
  }

  private async getLiveMarket(address: string): Promise<LiveMarketState> {
    const live = await this.contractReader.getMarketState();

    if (normalizeAddress(live.address) !== normalizeAddress(address)) {
      throw new NotFoundException({
        error: {
          code: 'INVALID_MARKET',
          message: 'Market not found',
          details: { address },
        },
      });
    }

    return live;
  }
}
