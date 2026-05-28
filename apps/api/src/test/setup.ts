// Vitest setupFiles entry. Runs BEFORE the test file imports its modules,
// so env vars set here are visible to config.ts at module load.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://app_user:app_user_dev@localhost:5432/knuteloop_test'
process.env.JWT_DEV_SECRET =
  process.env.JWT_DEV_SECRET ?? 'test-secret-must-be-at-least-32-chars-long-for-hs256-please'
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'warn'
