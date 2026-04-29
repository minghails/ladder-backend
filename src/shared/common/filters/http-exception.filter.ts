import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { createErrorResponse } from '../dto/error-response.dto';

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStructuredError(value: unknown): value is {
  error: { code: string; message: string; details?: Record<string, unknown> };
} {
  if (!isRecord(value) || !isRecord(value['error'])) {
    return false;
  }

  const error = value['error'];
  return typeof error['code'] === 'string' && typeof error['message'] === 'string';
}

@Catch()
export class StandardExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (hasStructuredError(exceptionResponse)) {
        const structuredError = exceptionResponse.error;
        response
          .status(status)
          .json(createErrorResponse(structuredError.code, structuredError.message, structuredError.details));
        return;
      } else if (isRecord(exceptionResponse)) {
        const msg = exceptionResponse['message'];
        if (typeof msg === 'string') {
          message = msg;
        } else if (Array.isArray(msg)) {
          message = msg.join(', ');
        } else {
          message = exception.message;
        }
        const rest = { ...exceptionResponse };
        delete rest['message'];
        delete rest['statusCode'];
        delete rest['error'];
        if (Object.keys(rest).length > 0) {
          details = rest;
        }
      }
    }

    const code = STATUS_CODE_MAP[status] ?? 'INTERNAL_SERVER_ERROR';
    response.status(status).json(createErrorResponse(code, message, details));
  }
}
