import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { DRIZZLE_DB } from '@shared/database/database.constants';
import { DepositRequestsService } from './deposit-requests.service';

const REQUEST_ROW = {
  requestId: '12',
  marketAddress: '0x3ada769dc813e3376fcd40d05bea12263048a487',
  user: '0x00000000000000000000000000000000000000a1',
  receiver: '0x00000000000000000000000000000000000000b1',
  asSenior: false,
  tokenIn: '0x00000000000000000000000000000000000000c1',
  amountIn: '1000000',
  minYtOut: '900000',
  status: 'linked',
  adaptorRequestId: '77',
  reasonCode: null,
  txHash: '0x0000000000000000000000000000000000000000000000000000000000000200',
  pulledTxHash: '0x0000000000000000000000000000000000000000000000000000000000000201',
  linkedTxHash: '0x0000000000000000000000000000000000000000000000000000000000000202',
  settledTxHash: null,
  rejectedTxHash: null,
  refundedTxHash: null,
  settledAt: null,
  rejectedAt: null,
  refundedAt: null,
  createdAt: new Date('2026-05-04T00:00:00.000Z'),
  updatedAt: new Date('2026-05-04T00:01:00.000Z'),
};

describe('DepositRequestsService', () => {
  async function createService(row: typeof REQUEST_ROW | undefined | null = REQUEST_ROW) {
    const db = {
      query: {
        depositRequests: {
          findFirst: vi.fn().mockResolvedValue(row === null ? undefined : row),
        },
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        DepositRequestsService,
        {
          provide: DRIZZLE_DB,
          useValue: db,
        },
      ],
    }).compile();

    return { service: module.get(DepositRequestsService), db };
  }

  it('should be defined', async () => {
    const { service } = await createService();

    expect(service).toBeDefined();
  });

  it('returns indexed request detail', async () => {
    const { service } = await createService();

    await expect(service.getRequest('12')).resolves.toEqual({
      requestId: '12',
      marketAddress: REQUEST_ROW.marketAddress,
      user: REQUEST_ROW.user,
      receiver: REQUEST_ROW.receiver,
      asSenior: false,
      tokenIn: REQUEST_ROW.tokenIn,
      amountIn: '1000000',
      minYtOut: '900000',
      status: 'linked',
      adaptorRequestId: '77',
      reasonCode: null,
      txHash: REQUEST_ROW.txHash,
      pulledTxHash: REQUEST_ROW.pulledTxHash,
      linkedTxHash: REQUEST_ROW.linkedTxHash,
      settledTxHash: null,
      rejectedTxHash: null,
      refundedTxHash: null,
      settledAt: null,
      rejectedAt: null,
      refundedAt: null,
      dataQuality: {
        sources: {
          request: 'indexed_events',
        },
      },
    });
  });

  it('throws NotFoundException when request is missing', async () => {
    const { service } = await createService(null);

    await expect(service.getRequest('404')).rejects.toBeInstanceOf(NotFoundException);
  });
});
