import type { SchoolId, UserId } from './ids.js'
import { asSchoolId, asUserId } from './ids.js'

// Compile-time tests for the ID brands. The brand is invisible at runtime, so
// no vitest can defend it — if someone weakens `Brand` to a plain alias or
// unbrands a seam, every runtime test stays green while the PR's whole
// guarantee evaporates. These @ts-expect-error lines are the tripwire: they
// make `pnpm typecheck` FAIL if a forbidden assignment ever starts compiling
// (tsc errors on an unused @ts-expect-error). No runtime cost; never imported.

const schoolId: SchoolId = asSchoolId('00000000-0000-0000-0000-000000000001')
const userId: UserId = asUserId('00000000-0000-0000-0000-000000000002')

// @ts-expect-error a plain string must not be assignable to SchoolId
const s1: SchoolId = '00000000-0000-0000-0000-000000000001'

// @ts-expect-error a UserId must not be assignable to a SchoolId slot
const s2: SchoolId = userId

// @ts-expect-error a SchoolId must not be assignable to a UserId slot
const u1: UserId = schoolId

// The reverse direction MUST work: brands are strings wherever a string is
// expected (Drizzle params, logging, JSON).
const widened: string = schoolId

// Swapping arguments in an object literal with branded slots is a TS2322 —
// the ImportCtx shape from lib/library-import.ts, reduced to its brand core.
type CtxLike = { schoolId: SchoolId; userId: UserId }
// @ts-expect-error swapped ids in a branded object literal must not compile
const swapped: CtxLike = { schoolId: userId, userId: schoolId }

// Reference the values so no-unused-vars stays quiet without disabling it.
export const __typeTestTouched = [schoolId, userId, s1, s2, u1, widened, swapped] as const
