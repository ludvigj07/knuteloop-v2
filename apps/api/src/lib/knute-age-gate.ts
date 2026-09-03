import { and, eq, lte, type SQL } from 'drizzle-orm'
import { knuter, users } from '../db/schema/index.js'
import type { SchoolId, UserId } from './ids.js'
import type { db } from '../db/client.js'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// The ADR-0015 age gate, in ONE place. Every read that hands knuter to a
// student — catalog, folder view, dagens, feed, profile grid, bookmarks — asks
// here whether the caller may see 18+ knuter. It used to be the same four
// lines copied into every route; seven copies that MUST stay identical is a
// leak waiting to happen.
//
// Fail-safe by construction: a missing viewer row is treated as a minor.

export async function viewerIsAdult(tx: Tx, schoolId: SchoolId, userId: UserId): Promise<boolean> {
  const [me] = await tx
    .select({ isAdult: users.isAdult })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
    .limit(1)
  return me?.isAdult === true
}

// The WHERE condition to add for this viewer — null for a verified adult
// (unfiltered), `min_age <= 17` for everyone else. Usage:
//   const ageGate = await knuteAgeGate(tx, schoolId, userId)
//   if (ageGate) conditions.push(ageGate)
export async function knuteAgeGate(
  tx: Tx,
  schoolId: SchoolId,
  userId: UserId,
): Promise<SQL | null> {
  return (await viewerIsAdult(tx, schoolId, userId)) ? null : lte(knuter.minAge, 17)
}
