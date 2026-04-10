import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodType, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formatted = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formatted,
      });
    }
    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!formatted[path]) formatted[path] = [];
      formatted[path].push(issue.message);
    }
    return formatted;
  }
}
