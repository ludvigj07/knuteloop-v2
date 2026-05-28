import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { config } from '../config.js'
import * as schema from './schema/index.js'

if (!config.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required for database access. Set it in apps/api/.env.',
  )
}

const client = postgres(config.DATABASE_URL, {
  // CRITICAL for Aiven PgBouncer transaction-pool mode — and harmless on local Postgres.
  prepare: false,
  ssl: config.NODE_ENV === 'production' ? 'require' : false,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 5,
})

export const db = drizzle(client, { schema })
export type Db = typeof db
