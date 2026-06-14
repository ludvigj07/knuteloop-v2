import { z } from 'zod'

// The committed throwaway secret used to sign HS256 dev tokens locally. It is
// PUBLIC by definition (it lives in source), so it must NEVER be the secret a
// production server runs on — productionConfigError() below refuses to boot if
// it ever is. When real auth (Vipps/Entra, RS256/JWKS) lands, this whole
// dev-token path is deleted (see lib/auth-dev.ts).
export const DEFAULT_DEV_SECRET = 'dev-secret-do-not-use-in-production-32+chars-min'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().url().optional(),

  // Dev-only HS256 secret for issuing/verifying test tokens.
  // Production uses RS256 with Entra/Vipps-validated tokens — this var becomes unused.
  // Must be at least 32 chars for HS256.
  JWT_DEV_SECRET: z
    .string()
    .min(32, 'JWT_DEV_SECRET must be at least 32 chars')
    .default(DEFAULT_DEV_SECRET),

  // Image storage. 'local' (default) stores uploads on disk under apps/api/var/
  // and serves them from the API itself — for local development only. 'bunny' is
  // the production driver (Bunny Storage + CDN, EU; ADR-0008). The BUNNY_* vars
  // are only required when STORAGE_DRIVER=bunny (validated at use, not boot).
  STORAGE_DRIVER: z.enum(['local', 'bunny']).default('local'),
  BUNNY_STORAGE_ZONE: z.string().optional(),
  BUNNY_STORAGE_KEY: z.string().optional(),
  BUNNY_CDN_HOSTNAME: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

// Fail-fast guard for the one catastrophic misconfiguration the dev-auth
// placeholder allows: a production server running on the committed default
// secret would let anyone who has read the source forge an admin token for any
// school. Pure function so it can be unit-tested without re-importing config.
export function productionConfigError(env: Env): string | null {
  if (env.NODE_ENV === 'production' && env.JWT_DEV_SECRET === DEFAULT_DEV_SECRET) {
    return 'JWT_DEV_SECRET is the committed default in production — refusing to boot. Set a real secret, and replace the HS256 dev-auth path with real auth (RS256/JWKS) before launch.'
  }
  return null
}

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // Fail fast on startup — server cannot run with invalid config.
  // We write to process.stderr directly here because the logger depends on this config.
  process.stderr.write('Invalid environment configuration:\n')
  process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
  process.stderr.write('\n')
  process.exit(1)
}

const prodErr = productionConfigError(parsed.data)
if (prodErr) {
  process.stderr.write(`FATAL: ${prodErr}\n`)
  process.exit(1)
}

export const config = parsed.data
export type Config = typeof config
