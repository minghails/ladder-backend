import { describe, it, expect, vi } from 'vitest';
import { HttpException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { StandardExceptionFilter } from './http-exception.filter';

describe('StandardExceptionFilter', () => {
  function createHost() {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
    const host = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: () => ({ url: '/test' }),
      }),
    } as unknown as ArgumentsHost;

    return { host, mockJson, mockStatus };
  }

  it('should transform HttpException to standard error shape', () => {
    const filter = new StandardExceptionFilter();
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
    const { host, mockJson, mockStatus } = createHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(404);
    const body = mockJson.mock.calls[0]?.[0] as unknown;
    expect(body).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: 'Not found',
      },
    });
  });

  it('preserves canonical error code, message, and details from structured exceptions', () => {
    const filter = new StandardExceptionFilter();
    const exception = new HttpException(
      {
        error: {
          code: 'INVALID_MARKET',
          message: 'Market not found',
          details: { address: '0x0000000000000000000000000000000000000999' },
        },
      },
      HttpStatus.NOT_FOUND,
    );
    const { host, mockJson, mockStatus } = createHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        code: 'INVALID_MARKET',
        message: 'Market not found',
        details: { address: '0x0000000000000000000000000000000000000999' },
      },
    });
  });
});
