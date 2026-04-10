import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string(),
    amount: z.coerce.number().positive(),
  });

  const meta = { type: 'body' } as ArgumentMetadata;

  it('should pass valid data through', () => {
    const pipe = new ZodValidationPipe(schema);
    const result = pipe.transform({ name: 'test', amount: '100' }, meta);
    expect(result).toEqual({ name: 'test', amount: 100 });
  });

  it('should throw BadRequestException for invalid data', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() => pipe.transform({ name: 123 }, meta)).toThrow(BadRequestException);
  });
});
