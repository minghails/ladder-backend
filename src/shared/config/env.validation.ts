import { z } from 'zod';

const ethereumAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

/** Comma-separated origins from `CORS_ALLOWED_ORIGINS`; each entry must be a valid URL. */
export function parseCorsAllowedOrigins(raw: string | undefined): string[] {
  const parts = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return z.array(z.url()).parse(parts);
}

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    RPC_URL: z.url(),
    MARKET_ADDRESS: ethereumAddress,
    BASE_TOKEN_ADDRESS: ethereumAddress.optional(),
    MTOKEN_ADDRESS: ethereumAddress.optional(),
    MIDAS_PRICE_ORACLE_ADDRESS: ethereumAddress.optional(),
    MIDAS_ISSUANCE_VAULT_ADDRESS: ethereumAddress.optional(),
    MIDAS_REDEMPTION_VAULT_ADDRESS: ethereumAddress.optional(),
    PUBLIC_API_URL: z.url().optional(),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
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
    PROJECTOR_MARKET_REFRESH_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000),
    HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().default(1_000),
    HEALTH_PROJECTOR_MAX_LAG_BLOCKS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(20),
    HEALTH_PROJECTOR_LAG_CHECK_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    RPC_READ_CACHE_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15_000),
  })
  .superRefine((config, ctx) => {
    let corsAllowedOrigins: string[];
    try {
      corsAllowedOrigins = parseCorsAllowedOrigins(config.CORS_ALLOWED_ORIGINS);
    } catch {
      ctx.addIssue({
        code: 'custom',
        message:
          'CORS_ALLOWED_ORIGINS must be a comma-separated list of valid URLs',
        path: ['CORS_ALLOWED_ORIGINS'],
      });
      return;
    }
    if (config.NODE_ENV === 'production' && corsAllowedOrigins.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message:
          'CORS_ALLOWED_ORIGINS must include at least one URL when NODE_ENV is production',
        path: ['CORS_ALLOWED_ORIGINS'],
      });
    }

    for (const key of [
      'BASE_TOKEN_ADDRESS',
      'MTOKEN_ADDRESS',
      'MIDAS_PRICE_ORACLE_ADDRESS',
      'MIDAS_ISSUANCE_VAULT_ADDRESS',
      'MIDAS_REDEMPTION_VAULT_ADDRESS',
    ] as const) {
      if (config.CHAIN_ID !== 84532 && config[key] === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: `${key} is required when NODE_ENV is production`,
          path: [key],
        });
      }
    }
  })
  .refine(
    (config) => !config.PROJECTOR_ENABLED || config.DEPLOYMENT_BLOCK > 0,
    {
      message: 'DEPLOYMENT_BLOCK must be greater than 0 when projector is enabled',
      path: ['DEPLOYMENT_BLOCK'],
    },
  )
  .transform((config) => {
    const corsAllowedOrigins = parseCorsAllowedOrigins(
      config.CORS_ALLOWED_ORIGINS,
    );
    const rest = { ...config };
    delete rest.CORS_ALLOWED_ORIGINS;
    return { ...rest, corsAllowedOrigins };
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.parse(config);
  return parsed;
}
