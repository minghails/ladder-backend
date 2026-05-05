import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { depositRequests } from '@shared/database/schema';

type DepositRequestRow = typeof depositRequests.$inferSelect;

export interface DepositRequestDetailResponse {
  requestId: string;
  marketAddress: string;
  user: string;
  receiver: string;
  asSenior: boolean;
  tokenIn: string;
  amountIn: string;
  minYtOut: string;
  status: string;
  adaptorRequestId: string | null;
  reasonCode: string | null;
  txHash: string | null;
  pulledTxHash: string | null;
  linkedTxHash: string | null;
  settledTxHash: string | null;
  rejectedTxHash: string | null;
  refundedTxHash: string | null;
  settledAt: Date | null;
  rejectedAt: Date | null;
  refundedAt: Date | null;
  dataQuality: {
    sources: {
      request: 'indexed_events';
    };
  };
}

interface DepositRequestsDatabase {
  query: {
    depositRequests: {
      findFirst: (config: unknown) => Promise<DepositRequestRow | undefined>;
    };
  };
}

@Injectable()
export class DepositRequestsService {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DepositRequestsDatabase,
  ) {}

  async getRequest(requestId: string): Promise<DepositRequestDetailResponse> {
    const request = await this.db.query.depositRequests.findFirst({
      where: eq(depositRequests.requestId, requestId),
    });

    if (request === undefined) {
      throw new NotFoundException('Deposit request not found');
    }

    return toDetailResponse(request);
  }
}

function toDetailResponse(request: DepositRequestRow): DepositRequestDetailResponse {
  return {
    requestId: request.requestId,
    marketAddress: request.marketAddress,
    user: request.user,
    receiver: request.receiver,
    asSenior: request.asSenior,
    tokenIn: request.tokenIn,
    amountIn: request.amountIn,
    minYtOut: request.minYtOut,
    status: request.status,
    adaptorRequestId: request.adaptorRequestId,
    reasonCode: request.reasonCode,
    txHash: request.txHash,
    pulledTxHash: request.pulledTxHash,
    linkedTxHash: request.linkedTxHash,
    settledTxHash: request.settledTxHash,
    rejectedTxHash: request.rejectedTxHash,
    refundedTxHash: request.refundedTxHash,
    settledAt: request.settledAt,
    rejectedAt: request.rejectedAt,
    refundedAt: request.refundedAt,
    dataQuality: {
      sources: {
        request: 'indexed_events',
      },
    },
  };
}
