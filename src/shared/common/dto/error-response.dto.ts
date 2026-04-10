import { z } from 'zod';

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return { error: { code, message, ...(details && { details }) } };
}
