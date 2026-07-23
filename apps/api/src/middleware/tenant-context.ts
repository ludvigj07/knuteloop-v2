import { createMiddleware } from 'hono/factory'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { ForbiddenError } from '../lib/errors.js'
import type { SchoolId } from '../lib/ids.js'

// Opens a transaction, sets `app.school_id` for that transaction, exposes
// the transaction as `c.var.tx` for handlers to use.
//
// Why a transaction: Aiven's PgBouncer runs in transaction-pool mode, so a
// SET at session level does not survive across queries. set_config(..., true)
// is local to the transaction and reliably scoped.
export const tenantContext = () =>
  createMiddleware<{
    Variables: {
      schoolId: SchoolId
      tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
    }
  }>(async (c, next) => {
    const schoolId = c.get('schoolId')
    if (!schoolId) throw new ForbiddenError('No tenant context')

    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolId}, true)`)
      c.set('tx', tx)
      await next()
    })
  })
