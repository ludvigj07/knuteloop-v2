import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().url().optional(),

  // Dev-only HS256 secret for issuing/verifying test tokens.
  // Production uses RS256 with Entra-validated tokens — this var becomes unused.
  // Must be at least 32 chars for HS256.
  JWT_DEV_SECRET: z
    .string()
    .min(32, 'JWT_DEV_SECRET must be at least 32 chars')
    .default('dev-secret-do-not-use-in-production-32+chars-min'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // Fail fast on startup — server cannot run with invalid config.
  // We write to process.stderr directly here because the logger depends on this config.
  process.stderr.write('Invalid environment configuration:\n')
  process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
  process.stderr.write('\n')
  process.exit(1)
}

export const config = parsed.data
export type Config = typeof config
