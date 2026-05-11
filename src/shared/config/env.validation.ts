import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    RPC_URL: z.url(),
    MARKET_ADDRESS: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    PUBLIC_API_URL: z.url().optional(),
    CHAIN_ID: z.coerce.number().int().positive().default(84532),
    DEPLOYMENT_BLOCK: z.coerce.number().int().nonnegative().default(0),
    PROJECTOR_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    PROJECTOR_CONFIRMATIONS: z.coerce.number().int().nonnegative().default(3),
    PROJECTOR_BATCH_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .max(10_000)
      .default(2_000),
    PROJECTOR_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15_000),
    HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().default(1_000),
    HEALTH_PROJECTOR_MAX_LAG_BLOCKS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(20),
  })
  .refine(
    (config) => !config.PROJECTOR_ENABLED || config.DEPLOYMENT_BLOCK > 0,
    {
      message: 'DEPLOYMENT_BLOCK must be greater than 0 when projector is enabled',
      path: ['DEPLOYMENT_BLOCK'],
    },
  );

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.parse(config);
  return parsed;
}
