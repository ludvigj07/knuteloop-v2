# ADR-0006: Microsoft Entra ID per school + russenavn allowlist for authentication

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

Auth has three hard requirements:

1. **Only students at the specific school can log in.** No outsiders pretending to be russ.
2. **Only Vg3 students can log in.** A Vg2 student must not be able to claim a russenavn that doesn't belong to them.
3. **Names are ASSIGNED, not self-chosen.** The russenavn is set by the knutesjef and the student claims it; the student cannot change it on registration.

The schools we're targeting (Norwegian high schools) all use Microsoft 365 for Education. Students have school-provided email accounts under their school's Entra ID (formerly Azure AD) tenant.

App Store Review Guideline 4.8 also requires Sign in with Apple if any third-party auth is offered (with carve-outs that are subject to reviewer interpretation).

## Decision

Two-factor authentication design:

1. **Identity proof:** student signs in via Microsoft Entra ID against THEIR SCHOOL'S TENANT. Knuteloop validates the ID token with `jose` against `https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys`. The tenant ID is looked up from the school record on the backend — never accepted from the client.

2. **Eligibility proof:** the email from the validated Entra token is looked up against a **russenavn allowlist table**, which the knutesjef has pre-populated for this year's Vg3 cohort. Only matches are allowed in.

3. **App Store compliance:** **Sign in with Apple** is offered as a parallel path. The Apple-provided email is matched against the same allowlist.

The russenavn is read from the allowlist row, NEVER from the client. After successful auth, Knuteloop issues its own JWT (RS256) with `userId`, `schoolId`, `russenavn`, `role`, `tokenVersion`, `deviceId`.

## Alternatives considered

- **Feide (national education SSO).** The "obvious" Norwegian choice. Rejected for v2: Feide vendor onboarding requires school administration approval, contracts, and (in some districts) Datatilsynet sign-off. For a 10-school pilot in 2027, the timeline doesn't work. Re-evaluate for 2028+ when we want national scale. (See ADR-0010.)

- **Per-school email/password.** Knutesjef creates accounts manually. Rejected: doesn't verify the student attends that school, doesn't enforce Vg3, knutesjef has too much admin burden.

- **Magic link to school email.** Send a one-time link to `name@school.no`. Rejected: still needs the allowlist for Vg3 enforcement; and many schools don't allow forwarding to personal devices easily.

- **Single Entra app multi-tenant.** Use one Entra app registration that any school's tenant can authorize, with allowlist still gating Vg3. Rejected: harder for knutesjefen at each school to understand what they're approving, and it makes the "this app accesses your tenant" prompt scarier than needed.

- **OAuth via Google Workspace for Education.** Some Norwegian schools use Google instead of Microsoft. Rejected for pilot: St. Olav uses Microsoft; we can add Google as a parallel path later if a target school requires it (single new middleware, well-isolated).

## Consequences

### Good
- Strong identity proof — only real students of the school can log in.
- Vg3 enforcement is automatic via the allowlist.
- Names are server-assigned (anti-fraud).
- Apple Sign In keeps App Store review smooth.
- Multi-device sessions work naturally via Knuteloop's own refresh tokens.

### Bad / trade-offs accepted
- Onboarding a new school requires the knutesjef to (a) ask their school admin for the Entra tenant ID and (b) paste the Vg3 russenavn list. There's friction here we should minimize with a great onboarding UX.
- Schools that don't use Microsoft 365 are blocked at pilot. Most major Norwegian VGS schools use Microsoft, so this isn't a hard limit at 10-school scale; could be at 100-school scale.
- We're issuing our own JWT — that means we have to manage signing keys, rotation, and revocation. Captured in `.claude/rules/security.md`.

### Neutral
- The allowlist becomes the source of truth for "who can use Knuteloop at school X this year." Importing/managing it well is critical onboarding UX.

## Open questions

- For schools that resist sharing their tenant ID with us, can we make the flow work with the multi-tenant Entra app registration (single common app, students consent for their org)? Worth implementing if it removes the school-admin friction.
- For the 5-10% of Norwegian schools without Microsoft 365, do we offer Google Workspace OAuth as a parallel path in v2.1? Probably yes when a target school requests it.
