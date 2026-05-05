/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContractReaderService,
  type LiveMarketState,
} from '@shared/blockchain/contract-reader.service';
import {
  calculateJuniorWithdrawalCapacity,
  calculateSeniorDepositCapacity,
  isPriceStale,
} from '../market-state/market-calculations';

export type QuoteTranche = 'senior' | 'junior';

export interface DepositBaseQuoteRequest {
  market: string;
  tranche: QuoteTranche;
  amount: string;
  minYtOut?: string;
  receiver?: string;
  referrerId?: string;
  sender?: string;
  slippageBps?: number;
}

export interface DepositYtQuoteRequest {
  market: string;
  tranche: QuoteTranche;
  amountYt: string;
}

export interface WithdrawYtQuoteRequest {
  market: string;
  tranche: QuoteTranche;
  mode?: 'shares' | 'assets';
  amount?: string;
  receiver?: string;
  shares?: string;
  slippageBps?: number;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function statusWarnings(live: LiveMarketState): string[] {
  return [
    ...(live.halted ? ['MARKET_HALTED'] : []),
    ...(isPriceStale(live.lastUpdatedTime) ? ['STALE_PRICE'] : []),
  ];
}

function trancheToken(live: LiveMarketState, tranche: QuoteTranche): string {
  return tranche === 'senior' ? live.seniorTrancheAddress : live.juniorTrancheAddress;
}

function isZeroAddress(address: string): boolean {
  return normalizeAddress(address) === '0x0000000000000000000000000000000000000000';
}

@Injectable()
export class QuotesService {
  constructor(private readonly contractReader: ContractReaderService) {}

  async quoteDepositYt(request: DepositYtQuoteRequest) {
    const live = await this.getLiveMarket(request.market);
    const warnings = statusWarnings(live);
    const amountYt = BigInt(request.amountYt);
    const depositValue = (amountYt * BigInt(live.latestYtPrice)) / 10n ** 18n;
    const navStAfter = BigInt(live.navSt) + (request.tranche === 'senior' ? depositValue : 0n);
    const navJtAfter = BigInt(live.navJt) + (request.tranche === 'junior' ? depositValue : 0n);
    const navAfter = navStAfter + navJtAfter;
    const stJtRatioAfter =
      navJtAfter === 0n ? null : ((navStAfter * 10n ** 18n) / navJtAfter).toString();
    const ratioExceeded =
      request.tranche === 'senior' &&
      stJtRatioAfter !== null &&
      BigInt(stJtRatioAfter) > BigInt(live.maxStJtRatio);
    const firstDepositMustBeJunior = request.tranche === 'senior' && BigInt(live.navJt) === 0n;
    const unavailableReason = live.halted
      ? 'MARKET_HALTED'
      : amountYt === 0n
        ? 'ZERO_AMOUNT'
        : firstDepositMustBeJunior
          ? 'FIRST_DEPOSIT_MUST_BE_JUNIOR'
          : ratioExceeded
            ? 'SENIOR_CAPACITY_EXCEEDED'
            : null;

    if (ratioExceeded) {
      warnings.push('SENIOR_CAPACITY_EXCEEDED');
    }

    return {
      input: {
        market: live.address,
        tranche: request.tranche,
        amountYt: request.amountYt,
        token: live.ytTokenAddress,
      },
      estimate: {
        sharesOut: request.amountYt,
        depositValue: depositValue.toString(),
        navAfter: navAfter.toString(),
        navStAfter: navStAfter.toString(),
        navJtAfter: navJtAfter.toString(),
        stJtRatioAfter,
        estimateType: 'derived',
      },
      availability: {
        available: unavailableReason === null,
        reason: unavailableReason,
      },
      warnings,
      action: {
        contract: live.address,
        method: 'depositYT',
        args: {
          asSenior: request.tranche === 'senior',
          amount: request.amountYt,
        },
        calldataIncluded: false,
        approval: {
          required: true,
          token: live.ytTokenAddress,
          spender: live.address,
          amount: request.amountYt,
        },
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          estimate: 'derived',
          constraints: 'derived',
        },
      },
    };
  }

  async quoteDepositBase(request: DepositBaseQuoteRequest) {
    const live = await this.getLiveMarket(request.market);
    const warnings = statusWarnings(live);
    const sender = request.sender ?? '0x0000000000000000000000000000000000000000';
    const minYtOut = request.minYtOut ?? '0';
    const receiver = request.receiver ?? sender;
    const referrerId =
      request.referrerId ?? '0x0000000000000000000000000000000000000000000000000000000000000000';
    const token = trancheToken(live, request.tranche);
    const seniorCapacity = calculateSeniorDepositCapacity(
      live.navSt,
      live.navJt,
      live.maxStJtRatio,
    );
    const capacityExceeded =
      request.tranche === 'senior' && BigInt(request.amount) > BigInt(seniorCapacity);
    const unavailableReason = live.halted
      ? 'MARKET_HALTED'
      : !live.capabilities.depositBaseInstant
        ? 'DEPOSIT_BASE_INSTANT_UNAVAILABLE'
        : capacityExceeded
          ? 'SENIOR_CAPACITY_EXCEEDED'
          : null;
    const missingSender = isZeroAddress(sender);
    const baseUnavailableReason = unavailableReason ?? (missingSender ? 'SENDER_REQUIRED' : null);
    const simulation = baseUnavailableReason
      ? null
      : await this.contractReader.simulateDepositBaseInstant({
          market: live.address,
          asSenior: request.tranche === 'senior',
          tokenIn: live.baseTokenAddress,
          amountIn: request.amount,
          minYtOut,
          receiver,
          referrerId,
          sender,
          trancheToken: token,
        });
    const simulationReason = simulation?.ok === false ? simulation.reason : null;
    const finalUnavailableReason = baseUnavailableReason ?? simulationReason;

    if (capacityExceeded) {
      warnings.push('SENIOR_CAPACITY_EXCEEDED');
    }

    if (missingSender) {
      warnings.push('SENDER_REQUIRED');
    }

    if (simulation?.ok === false) {
      warnings.push(simulation.reason);
    }

    return {
      input: {
        market: live.address,
        tranche: request.tranche,
        amount: request.amount,
        token: live.baseTokenAddress,
        slippageBps: request.slippageBps ?? null,
      },
      estimate: {
        estimatedYtOut: simulation?.ok === true ? simulation.ytOut : null,
        minYtOut,
        sharesOut: simulation?.ok === true ? simulation.sharesOut : null,
        estimateType:
          simulation?.ok === true
            ? 'simulated_onchain'
            : simulation?.ok === false
              ? 'simulation_reverted'
              : 'unavailable',
      },
      availability: {
        available: finalUnavailableReason === null,
        reason: finalUnavailableReason,
      },
      warnings,
      action: {
        contract: live.address,
        method: 'depositInstant',
        args: {
          asSenior: request.tranche === 'senior',
          tokenIn: live.baseTokenAddress,
          amountIn: request.amount,
          minYtOut,
          receiver,
          referrerId,
        },
        calldataIncluded: false,
        approval: {
          required: true,
          token: live.baseTokenAddress,
          spender: live.address,
          amount: request.amount,
        },
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          estimate:
            simulation?.ok === true
              ? 'simulated_onchain'
              : simulation?.ok === false
                ? 'simulation_reverted'
                : 'unavailable',
          constraints: 'derived',
        },
      },
    };
  }

  async quoteWithdrawYt(request: WithdrawYtQuoteRequest) {
    const live = await this.getLiveMarket(request.market);
    const warnings = statusWarnings(live);
    const token = trancheToken(live, request.tranche);
    const mode = request.mode ?? 'shares';
    const amount = request.amount ?? request.shares ?? '0';
    const receiver = request.receiver ?? '0x0000000000000000000000000000000000000000';
    const amountValue = BigInt(amount);
    const juniorCapacityExceeded =
      request.tranche === 'junior' &&
      amountValue >
        BigInt(calculateJuniorWithdrawalCapacity(live.navSt, live.navJt, live.maxStJtRatio));
    const unavailableReason = live.halted
      ? 'MARKET_HALTED'
      : amountValue === 0n
        ? 'ZERO_AMOUNT'
        : isZeroAddress(receiver)
          ? 'ZERO_RECEIVER'
          : juniorCapacityExceeded
            ? 'JUNIOR_WITHDRAWAL_CAPACITY_EXCEEDED'
            : null;
    const outputEstimateType = mode === 'assets' ? 'derived' : 'derived_identity';

    if (juniorCapacityExceeded) {
      warnings.push('JUNIOR_WITHDRAWAL_CAPACITY_EXCEEDED');
    }

    return {
      input: {
        market: live.address,
        tranche: request.tranche,
        mode,
        amount,
        receiver,
        shares: request.shares ?? null,
        token,
        slippageBps: request.slippageBps ?? null,
      },
      output: {
        token: live.ytTokenAddress,
        amount,
        estimateType: outputEstimateType,
      },
      availability: {
        available: unavailableReason === null,
        reason: unavailableReason,
      },
      warnings,
      action: {
        contract: live.address,
        method: 'withdraw',
        args: {
          fromSenior: request.tranche === 'senior',
          byShares: mode === 'shares',
          amount,
          receiver,
        },
        calldataIncluded: false,
        approval: {
          required: true,
          token,
          spender: live.address,
          amount,
        },
      },
      dataQuality: {
        sources: {
          marketState: 'live_contract',
          output: outputEstimateType,
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
