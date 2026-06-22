# ADR-0016: Vipps Login + Sign in with Apple for authentication (supersedes 0006)

**Status:** Proposed
**Date:** 2026-06-19
**Deciders:** Ludvig (+ Claude as advisor)

> Supersedes **ADR-0006** (Microsoft Entra ID + russenavn allowlist). When this ADR is
> Accepted, flip 0006 to **Superseded** (via `/supersede-adr`) and rewrite the auth section of
> `.claude/rules/security.md` (Entra → Vipps). Do **not** edit 0006 before then.

## Context

The three hard requirements for auth are unchanged from ADR-0006:

1. **Only students at the specific school can log in.**
2. **Only this year's Vg3 russ can log in.**
3. **The russenavn is ASSIGNED, not self-chosen** — read from the school list, never from the client.

Since 0006 was accepted, three things changed the calculus:

- **ADR-0015 (Accepted) already chose Vipps for verified age.** `users.is_adult` is set from a
  Vipps-verified birthdate "when auth lands". Keeping **Entra for login AND Vipps for age** means
  two identity systems and two onboarding flows for one user. Vipps gives **verified identity
  (name + birthdate, Folkeregisteret-backed) in one flow** — it can serve identity, age, AND the
  roster match at once.
- **Entra's friction is real** (0006's own trade-offs): every school must hand us their Entra
  tenant ID, and only Microsoft-365 schools work at all. **Vipps is near-universal in Norway** and
  needs *no per-school IdP onboarding* — it works regardless of the school's email provider.
- **App Store Review Guideline 4.8** still requires **Sign in with Apple** when third-party login is
  offered, and the reviewer must see it as a *true equal* account — not a degraded "preview".

Important nuance: **Vipps Login is NOT an electronic ID (eID)**, even though the underlying account
is BankID-verified and can return a Folkeregisteret-verified name/birthdate. So we cannot lean on
any "eID carve-out" for Apple 4.8 — Sign in with Apple must be a genuine peer path.

Two gatekeepers stay distinct (as in ADR-0015): **Norwegian law / Datatilsynet** (Ludvig's lawyer +
GDPR specialist own this) and **Apple/Google store review** (separate, global). This ADR records the
*technical auth model*; the legal sign-off on processing Folkeregisteret-verified data for minors is
theirs.

## Decision

**Identity providers (who you are) — two peer paths:**

1. **Vipps Login (OIDC)** is the primary path. Knuteloop validates the Vipps ID token with `jose`
   against Vipps' published JWKS, requesting **minimal scopes only**: `openid`, `name`, `birthDate`.
   We deliberately do **NOT** request `nin` (fødselsnummer), `address`, `phoneNumber`, or `email`
   unless a concrete need appears — data minimisation, especially for minors (CLAUDE.md rule 12).
2. **Sign in with Apple** is the parallel path (App Store 4.8). The Apple identity token is validated
   server-side against Apple's JWKS; Apple provides a verified email.

**Eligibility (are you allowed) — the school roster, unchanged in spirit from 0006:**

3. The identity step proves *who you are*; it does **not** grant access. Access is granted only by a
   match against the **school roster/allowlist** the knutesjef imports for this year's Vg3 cohort.
   - Vipps path: match the Vipps-verified **name** (+ birthdate as tiebreaker) against the roster.
   - Apple path: match the Apple **email** against the roster (as in 0006).
   - No match → rejected. Match → the **russenavn is read from the roster row**, never the client.

4. **Matching is exact/controlled, not loose fuzzy.** Ambiguous matches go to a **knutesjef manual-
   review** queue rather than auto-approving. (Per the pre-App-Store audit's roster recommendation.)

**Verified age (completes ADR-0015):**

5. `users.is_adult` is set from the **Vipps-verified birthdate**. Apple-only users (no Vipps) default
   to `is_adult = false` (minor — the safe default) until they also verify with Vipps.

**Sessions (unchanged from 0006 / security.md):**

6. After a successful identity + roster match, Knuteloop issues its **own RS256 JWT**
   (`userId`, `schoolId`, `russenavn`, `role`, `tokenVersion`, `deviceId`), with a short-lived
   access token + rotating refresh token and `token_version` for revocation (logout-everywhere,
   ban, role change — fixes audit finding H-3).

## Alternatives considered

- **Keep Entra ID (ADR-0006).** Rejected: redundant with Vipps-for-age (0015), per-school tenant
  onboarding friction, and Microsoft-365-only excludes some schools at scale. Vipps removes all three.
- **Vipps only (no Sign in with Apple).** Rejected: fails App Store 4.8. Apple must have a peer path.
- **Sign in with Apple only.** Rejected: gives a verified email but no verified age or
  Folkeregisteret-name, so it can't drive the 18+ gate (0015) or strong roster matching on its own,
  and it's iOS-centric (weak on Android).
- **Feide (national education SSO).** Rejected for now — deferred to 2028+ per ADR-0010 (vendor
  onboarding + school-admin + Datatilsynet timeline doesn't fit the pilot).
- **BankID directly.** Rejected: heavier integration and a stronger eID than we need; Vipps Login
  already rides on BankID-grade verification with a much simpler integration and a UX russ know.
- **Request `nin` (fødselsnummer) from Vipps for exact matching.** Rejected: storing minors'
  fødselsnummer is a serious data-minimisation/GDPR red flag for marginal matching benefit. Accept
  name-based matching + manual review instead.

## Consequences

### Good
- **One flow** gives verified identity, verified age (0015), and the roster match — no second IdP.
- **No per-school IdP onboarding** (no tenant IDs); works regardless of the school's email provider.
- Vipps is **near-universal in Norway** and a UX russ already trust.
- Verified `is_adult` "for free" makes the per-knute age gate (0015) defensible to lawyer + Apple.
- Sign in with Apple keeps App Store review smooth; sessions/revocation model is already specced.

### Bad / trade-offs accepted
- **Vipps merchant onboarding** (org number, agreement, cost, calendar time) is a real prerequisite —
  start the paperwork early; it gates the integration.
- **Name-based matching is fuzzy** (name variants, two students sharing a name) → needs a manual-
  review UX and careful normalisation; some onboarding friction for the knutesjef.
- **Vipps Login is not eID** → no eID carve-outs; Sign in with Apple must be a true peer (4.8 risk if
  Apple sees it as degraded).
- **Platform matrix:** Vipps strong on both; Sign in with Apple strong on iOS, weaker on Android.
- New dependency on Vipps availability for login + age.
- Processing Folkeregisteret-verified name/birthdate for minors needs explicit lawyer/GDPR sign-off.

### Neutral
- The **roster becomes even more central** than in 0006 — it's the single source of "who may use
  Knuteloop at school X this year". Needs the `school_roster_imports` / `school_roster_entries` model
  (per the audit) and great import/match UX.
- `.claude/rules/security.md` auth section must be rewritten (Entra → Vipps) on acceptance.

## Open questions

- **Apple ↔ Vipps coexistence for the same user.** Proposed model: Sign in with Apple opens/holds the
  account; Vipps adds verified identity + age. Do we *link* the two to one user, and what's the UX?
- **Matching algorithm + manual-review UX** — exact-name + birthdate tiebreaker; how the knutesjef
  resolves ambiguous/unmatched cases.
- **Exact Vipps Login capabilities + scopes** — confirm against current Vipps MobilePay Login docs
  (scope names, whether birthDate needs a specific agreement tier, token/JWKS endpoints).
- **Does Apple accept Vipps as the "real" account** given Vipps isn't eID, or must Apple be able to do
  everything Vipps can? (Drives whether an Apple-only user is a full or limited account.)
- **Russ without Vipps** (rare) — fallback path, or required?
- **Cost** of the Vipps Login agreement at pilot vs national scale.
