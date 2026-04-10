import { describe, it, expect, vi } from 'vitest';
import { HttpException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { StandardExceptionFilter } from './http-exception.filter';

describe('StandardExceptionFilter', () => {
  it('should transform HttpException to standard error shape', () => {
    const filter = new StandardExceptionFilter();
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
    const host = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: () => ({ url: '/test' }),
      }),
    } as unknown as ArgumentsHost;

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
});
