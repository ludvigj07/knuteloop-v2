import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import type { SchoolId } from '../../lib/ids'

// NOT tenant-scoped — this table IS the tenant boundary.
// Only the admin role can write to it.
export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom().$type<SchoolId>(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
