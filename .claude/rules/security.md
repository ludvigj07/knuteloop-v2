<!--
LOADING: Pulled in by apps/api/CLAUDE.md via @-import (Claude Code auto-loads that when
you work under apps/api/). The "globs" frontmatter is intent-documentation only — Claude
Code does not auto-load by glob; it's here for Cursor compatibility.
-->
---
description: Security and auth rules — Entra ID, JWT, GDPR, secrets, vulnerabilities.
globs:
  - apps/api/src/middleware/auth.ts
  - apps/api/src/routes/auth.ts
  - apps/api/src/lib/jose.ts
  - apps/api/src/lib/sentry.ts
---

# Security Rules — Knuteloop v2

This file covers authentication, authorization, secret management, GDPR compliance, and the security testing surface. Knuteloop handles personal data of potentially-minor users — security failures are not just bugs, they are regulatory incidents.

---

## 1. The auth model in one paragraph

A user authenticates via **Microsoft Entra ID** against their school's tenant. The backend validates the ID token using `jose` with the remote JWKS. The validated email is looked up against a **russenavn allowlist** that the school's knutesjef pasted in. Match → backend issues a Knuteloop JWT containing `userId`, `schoolId`, `russenavn`, `role`, `tokenVersion`, `deviceId`. The mobile app stores access + refresh tokens in `expo-secure-store`. Refresh rotates tokens server-side and tracks per-device sessions in `refresh_tokens` table.

This achieves the three hard requirements:
- **Only students at the specific school can log in:** the Entra tenant ID is matched against the school's registered tenant ID.
- **Only Vg3 can log in:** the russenavn allowlist contains only Vg3 students for the current russ year. The allowlist is the source of truth, not the IdP.
- **Names are assigned, not self-chosen:** the russenavn is read from the allowlist row, never accepted from the client.

Sign in with Apple is a fallback path required by App Store policy. It connects to the same russenavn allowlist via the Apple-provided email.

---

## 2. JWT issuance and validation

### Token shape

```ts
type AccessTokenClaims = {
  sub: string              // userId (uuid)
  school_id: string        // uuid
  russenavn: string
  role: 'student' | 'knutesjef' | 'admin'
  token_version: number    // for "log out everywhere"
  device_id: string        // links to refresh_tokens row
  iat: number
  exp: number              // 15 minutes
  iss: string              // 'https://api.knuteloop.no'
  aud: string              // 'knuteloop-app'
}

type RefreshTokenClaims = {
  sub: string              // userId
  jti: string              // refresh token row ID (uuid)
  token_version: number
  device_id: string
  iat: number
  exp: number              // 30 days
  iss: string
  aud: string
}
```

### Validating Entra ID tokens (login flow)

```ts
// apps/api/src/lib/entra.ts
import { jwtVerify, createRemoteJWKSet } from 'jose'

const JWKS_BY_TENANT = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwks(tenantId: string) {
  if (!JWKS_BY_TENANT.has(tenantId)) {
    JWKS_BY_TENANT.set(
      tenantId,
      createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`))
    )
  }
  return JWKS_BY_TENANT.get(tenantId)!
}

export async function verifyEntraToken(token: string, expectedTenantId: string) {
  const { payload } = await jwtVerify(token, getJwks(expectedTenantId), {
    issuer: `https://login.microsoftonline.com/${expectedTenantId}/v2.0`,
    audience: config.ENTRA_AUDIENCE,
  })

  if (typeof payload.email !== 'string') {
    throw new UnauthorizedError('Token missing email claim')
  }
  return { email: payload.email, sub: payload.sub as string }
}
```

**Critical:**
- Each school has its own tenant ID. Look up the tenant ID from the school record BEFORE validating.
- NEVER accept a tenant ID from the client request payload — derive it from the school identifier in the URL/path.
- `aud` must equal the Entra app registration's audience value.

### Validating Knuteloop's own access tokens (middleware)

```ts
// apps/api/src/middleware/auth.ts (already shown in backend.md, expanded here)
const KNUTELOOP_JWKS = createRemoteJWKSet(new URL(config.OIDC_JWKS_URL))

export const auth = () => createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError()

  const token = header.slice(7)
  const { payload } = await jwtVerify(token, KNUTELOOP_JWKS, {
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
  })

  // Check token_version against current user state (for "log out everywhere")
  const [user] = await db.select({ tokenVersion: users.tokenVersion })
    .from(users)
    .where(eq(users.id, payload.sub as string))
    .limit(1)

  if (!user || user.tokenVersion !== payload.token_version) {
    throw new UnauthorizedError('Token revoked')
  }

  c.set('userId', payload.sub as string)
  c.set('schoolId', payload.school_id as string)
  c.set('russenavn', payload.russenavn as string)
  c.set('role', payload.role as 'student' | 'knutesjef' | 'admin')

  await next()
})
```

### Signing Knuteloop's tokens

Use RS256, NOT HS256. Asymmetric so mobile apps can verify offline if needed (we don't currently, but the option is preserved). Generate key pair once, store private key in env, expose public JWKS at `/.well-known/jwks.json`.

```ts
// apps/api/src/lib/sign.ts
import { SignJWT, importPKCS8 } from 'jose'
const privateKey = await importPKCS8(config.JWT_PRIVATE_KEY, 'RS256')

export async function signAccessToken(claims: Omit<AccessTokenClaims, 'iat' | 'exp' | 'iss' | 'aud'>) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: config.JWT_KID })
    .setIssuedAt()
    .setIssuer(config.JWT_ISSUER)
    .setAudience(config.JWT_AUDIENCE)
    .setExpirationTime('15m')
    .sign(privateKey)
}
```

Key rotation: maintain TWO key pairs (current + previous). New tokens signed with current, both keys served in JWKS. Rotate quarterly.

---

## 3. Refresh tokens — multi-device, revocable

Schema:

```ts
// apps/api/src/db/schema/refresh-tokens.ts
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schoolId: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull(),
  deviceLabel: text('device_label'), // "iPhone 15", set by client
  tokenHash: text('token_hash').notNull(), // sha256 of the actual token — never store raw
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  pgPolicy('refresh_tokens_tenant', {
    as: 'permissive',
    for: 'all',
    to: 'app_role',
    using: sql`school_id = current_setting('app.school_id', true)::uuid`,
    withCheck: sql`school_id = current_setting('app.school_id', true)::uuid`,
  }),
  index('refresh_tokens_user_idx').on(table.schoolId, table.userId),
  index('refresh_tokens_expires_idx').on(table.expiresAt),
]).enableRLS()
```

Flow:
1. Login → issue access (15min) + refresh (30 days). Store refresh as `sha256(token)` in DB.
2. Access token expires → mobile sends refresh to `/api/auth/refresh`.
3. Server hashes incoming refresh, looks up row. Must exist, not be revoked, not expired.
4. Server rotates: invalidate old row (`revokedAt = now`), issue new access + new refresh.
5. Mobile replaces both tokens in `expo-secure-store`.

**Reuse detection:** if a refresh token is presented that's already been rotated (revokedAt is set), this is suspicious — possibly a stolen token. Response: revoke ALL refresh tokens for that user, force re-login on all devices.

**Log out everywhere:** bump `users.token_version`. All currently-valid access tokens (still within 15min) become invalid on next request (auth middleware compares versions). All refresh tokens are also revoked.

---

## 4. The russenavn allowlist

The list pasted by the knutesjef. Format accepted: CSV/paste with rows `russenavn,email[,full_name]`.

```ts
// apps/api/src/db/schema/russenavn-allowlist.ts
export const russenavnAllowlist = pgTable('russenavn_allowlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  russenavn: text('russenavn').notNull(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  claimedByUserId: uuid('claimed_by_user_id').references(() => users.id),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('russenavn_allowlist_school_email').on(table.schoolId, table.email),
  pgPolicy('russenavn_allowlist_tenant', { /* ... */ }),
]).enableRLS()
```

Login lookup (after Entra validation):

```ts
const [row] = await db.select()
  .from(russenavnAllowlist)
  .where(and(
    eq(russenavnAllowlist.schoolId, schoolId),
    eq(russenavnAllowlist.email, entraEmail)
  ))
  .limit(1)

if (!row) {
  // Not on allowlist — not a Vg3 student, or knutesjef hasn't added them yet
  throw new ForbiddenError('Not on this year\'s russ list')
}

if (row.claimedByUserId) {
  // Already claimed — this user logs in normally
  // Issue tokens for existing user
} else {
  // First time — create user, mark row as claimed
}
```

**The russenavn is ALWAYS read from the allowlist row, NEVER from the client.** Even if a malicious client sends a different russenavn in the request, the server ignores it.

---

## 5. Authorization (role checks)

After auth middleware sets `role`, gate sensitive endpoints:

```ts
// apps/api/src/middleware/require-role.ts
export const requireRole = (...allowed: ('student' | 'knutesjef' | 'admin')[]) =>
  createMiddleware(async (c, next) => {
    const role = c.get('role')
    if (!allowed.includes(role)) throw new ForbiddenError()
    await next()
  })

// Usage in routes
adminRoutes.use('*', auth(), tenantContext(), requireRole('admin', 'knutesjef'))
```

For "approve submission" — knutesjef OR admin can approve. Verify also that the submission belongs to a school the knutesjef is knutesjef for (not just any school — even though RLS limits to their own school anyway).

---

## 6. Sign in with Apple (App Store fallback)

App Store Review Guideline 4.8 requires Sign in with Apple if any third-party auth is offered, with carve-outs for education/enterprise. To eliminate any risk of a reviewer disputing the carve-out:

- Implement Sign in with Apple alongside Entra ID.
- Apple provides a verified email. The same russenavn-allowlist lookup applies.
- Use `expo-apple-authentication` for the client. Validate the identity token server-side using Apple's JWKS (similar to Entra).

Endpoint: `POST /api/auth/login-with-apple` accepts the Apple identity token, validates it, looks up the email in the allowlist, issues Knuteloop tokens just like Entra flow.

---

## 7. Secrets management

**Never commit secrets.** Period.

- `.env` is gitignored from commit 1.
- `.env.example` IS committed, contains placeholder values, documents what each var is.
- Production secrets stored in Hetzner Cloud's secret store, or as systemd EnvironmentFile, NOT in the repo.
- Sentry DSN, Bunny API key, Aiven password, JWT private key, Entra app secret — all env vars.

**If a secret is ever committed accidentally:**
1. Rotate the secret IMMEDIATELY at the source (Aiven console, Entra app registration, etc.).
2. Remove from git history: `git filter-repo --invert-paths --path .env` or use BFG.
3. Force-push (Ludvig must do this — hook blocks force push).
4. Notify any deployed environments to use new value.

**GitHub Secret Scanning is enabled** on the private repo. If a known secret format is committed, GitHub alerts immediately. Don't rely on it as a primary defense — but it's the last line.

---

## 8. Input handling at the edges

Beyond Zod validation on endpoint bodies:

- **File uploads (Bunny):** the mobile client requests a signed upload URL from the backend. Backend generates short-lived (15 min) presigned URL scoped to a specific key in a specific bucket. Client uploads directly to Bunny. The backend only stores the key, never receives the file.
- **Image type validation:** when the backend creates a submission referencing an image key, the backend MUST verify the actual MIME type by reading the first few bytes via Bunny's API. Don't trust the file extension.
- **Image size cap:** Bunny side enforces 10MB. Backend also rejects submissions with images that didn't successfully upload.

---

## 9. GDPR + Datatilsynet compliance for minors

Some users will be 17. Norwegian Datatilsynet treats apps targeting minors with extra scrutiny.

**Hard rules:**
- **Privacy notice in plain Norwegian** displayed on first login. Must explain: what data is collected, who sees it (knutesjef, sponsors only aggregated, no third parties), how long it's retained.
- **Retention:** russetid data is retained until end of russ year + 30 days. After that, soft-delete users (anonymize PII, keep aggregated stats). A scheduled job in `apps/api/src/jobs/data-retention.ts` runs this annually.
- **Right to deletion:** every user can delete their account from settings. Triggers: revoke all tokens, soft-delete user row (set `deleted_at`, null out `russenavn`/`email`/`full_name`), keep audit trail of WHO deleted (just user ID, not PII).
- **Right to access:** every user can download their data as JSON from settings. Endpoint: `GET /api/me/export` returns submissions, comments, profile.
- **No marketing profiling.** No behavioral analytics on individual users. Plausible is fine (aggregate only). NEVER add Mixpanel, Amplitude, PostHog cloud, etc.
- **No third-party trackers** in the mobile app or any web page.

**Sponsored knuter and GDPR:** sponsored challenge analytics are AGGREGATE only ("X submissions for sponsor Y across Z schools"). Sponsors NEVER receive per-user data. This is a contract term in sponsor agreements AND enforced in the sponsor-report endpoint.

**DPIA (Data Protection Impact Assessment):** required for processing minor data. Template in `docs/dpia.md` (Ludvig fills this out with Datatilsynet's published template before publishing to App Store).

---

## 10. Sentry configuration — never leak PII

```ts
// apps/api/src/lib/sentry.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: config.SENTRY_DSN,
  environment: config.NODE_ENV,
  // EU region must be in the DSN URL
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Strip PII before send
    if (event.user) {
      // Only keep userId, never email/russenavn/name
      event.user = { id: event.user.id }
    }
    if (event.request?.headers) {
      delete event.request.headers.authorization
      delete event.request.headers.cookie
    }
    // Scrub known PII fields from any captured data
    const scrub = (obj: any) => {
      if (!obj || typeof obj !== 'object') return
      for (const key of Object.keys(obj)) {
        if (['email', 'russenavn', 'fullName', 'password', 'token'].includes(key)) {
          obj[key] = '[REDACTED]'
        } else if (typeof obj[key] === 'object') {
          scrub(obj[key])
        }
      }
    }
    scrub(event.extra)
    scrub(event.contexts)
    return event
  },
})
```

---

## 11. The OWASP-relevant checklist (apply to every endpoint)

- [ ] **A01 Broken Access Control:** auth middleware + role check + tenant context all present?
- [ ] **A02 Cryptographic Failures:** TLS for all connections (HTTPS, Postgres SSL), passwords/secrets never logged
- [ ] **A03 Injection:** Drizzle typed queries only, Zod validation on all input, no string concat into SQL or shell
- [ ] **A04 Insecure Design:** does this endpoint expose more than it needs? (e.g. listing all users vs. just the current user's friends)
- [ ] **A05 Security Misconfiguration:** secureHeaders middleware on, CORS allowlist not `*`, error responses don't leak stack traces
- [ ] **A06 Vulnerable Components:** Dependabot enabled, `pnpm audit` clean
- [ ] **A07 Authentication Failures:** rate limit login, token version check, refresh token rotation
- [ ] **A08 Data Integrity Failures:** SRI on any web pages, signed JWTs (RS256), CSP headers
- [ ] **A09 Logging Failures:** structured logs, request IDs traceable, PII redacted
- [ ] **A10 SSRF:** never fetch URLs provided by users; if you must, validate against allowlist

---

## 12. CLAUDE.md as attack surface (the LayerX finding)

In March 2026, LayerX Security disclosed that an attacker who can modify CLAUDE.md can convince Claude Code to ignore safety rails and exfiltrate data. The defense:

- The `SessionStart` hook checks `CLAUDE.md` and `.claude/rules/*.md` against last committed version. Warns on diff.
- NEVER include external CLAUDE.md fragments (e.g. from a third-party package).
- NEVER let untrusted code into the repo without review.
- `permissions.deny` in settings.json blocks `Bash(curl:*)`, `Read(.env)` regardless of what Claude tries.

---

## 13. Definition of done (security)

A change touching auth, sessions, or PII is NOT done until:

- [ ] Tokens validated against JWKS, not local secret
- [ ] Token version check in auth middleware
- [ ] Role check on the endpoint
- [ ] Tenant context middleware
- [ ] Zod validation on all input
- [ ] No PII in logs (redact list updated if new fields)
- [ ] No PII in Sentry events (beforeSend handles it)
- [ ] Rate limit configured for new endpoint
- [ ] Tests for: missing token, expired token, wrong tenant, wrong role
- [ ] If touching GDPR-relevant data: docs/dpia.md updated
