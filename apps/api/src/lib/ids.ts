// Branded ID types for the two identifiers whose mix-up is catastrophic:
// passing a userId where a schoolId belongs (or vice versa) is a cross-tenant
// bug waiting to happen. Both are plain UUID strings at runtime — the brand
// exists only in the type system, so this file costs nothing in production.
//
// How it works: `SchoolId` is a `string` plus a phantom marker the compiler
// tracks. A SchoolId is assignable anywhere a string is expected (Drizzle,
// logging, JSON), but a plain string — or a UserId — is NOT assignable to a
// SchoolId slot. Mixing them up becomes a compile error instead of a data leak.
//
// The ONLY way to create a branded value is through the as*-helpers below.
// They belong at trust boundaries — where an ID enters the system from
// outside (JWT claims in middleware/auth.ts, verified DB reads). Never call
// them deep inside handler logic to silence a type error: if the compiler
// complains there, it has found exactly the bug this file exists to catch.

declare const brandSymbol: unique symbol

type Brand<T, Name extends string> = T & { readonly [brandSymbol]: Name }

export type SchoolId = Brand<string, 'SchoolId'>
export type UserId = Brand<string, 'UserId'>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function assertUuid(value: string, kind: string): void {
  if (!UUID_RE.test(value)) {
    throw new TypeError(`Expected a UUID for ${kind}`)
  }
}

// Trust-boundary casts. Validate shape so a garbage claim can never become
// a "trusted" branded ID, and NORMALIZE to lowercase: Postgres emits UUIDs
// lowercase, and several handlers compare ids at the string level (e.g. the
// submission-visibility ownership check) — an uppercase-variant claim that
// only differs in case must not desync from DB values.
export function asSchoolId(value: string): SchoolId {
  assertUuid(value, 'SchoolId')
  return value.toLowerCase() as SchoolId
}

export function asUserId(value: string): UserId {
  assertUuid(value, 'UserId')
  return value.toLowerCase() as UserId
}
