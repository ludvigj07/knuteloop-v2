import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { config } from '../config.js'

// HS256 dev token helper. Production uses RS256 + JWKS via the real auth flow
// (see security.md §2). This file is the swap-out point — when Entra ID is
// wired up, this module is deleted and the auth middleware imports from
// lib/jose.ts instead. Keep the surface small so the swap is one-line.

const ISSUER = 'knuteloop-dev'
const AUDIENCE = 'knuteloop-app'
const ALG = 'HS256' as const

function getSecret(): Uint8Array {
  return new TextEncoder().encode(config.JWT_DEV_SECRET)
}

export type DevTokenClaims = {
  sub: string // userId
  school_id: string
  role: 'student' | 'knutesjef' | 'admin'
}

export async function signDevToken(claims: DevTokenClaims, ttl = '15m'): Promise<string> {
  return new SignJWT({ ...claims } as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ttl)
    .sign(getSecret())
}

export async function verifyDevToken(token: string): Promise<DevTokenClaims> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  })

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.school_id !== 'string' ||
    (payload.role !== 'student' && payload.role !== 'knutesjef' && payload.role !== 'admin')
  ) {
    throw new Error('Token missing required claims')
  }

  return {
    sub: payload.sub,
    school_id: payload.school_id,
    role: payload.role,
  }
}
