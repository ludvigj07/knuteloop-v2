# ADR-0010: Feide authentication deferred to 2028 (or later)

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

**Feide** (Felles Elektronisk Identitet) is the national federated identity service for Norwegian education. Nearly every Norwegian student has a Feide account. For an education-targeted product like Knuteloop, "supports Feide" is a strong trust and ease-of-onboarding signal — students don't need to share school-specific credentials, and schools recognize the brand.

However, becoming a Feide service provider requires:
- A formal application to Sikt (the agency that operates Feide)
- Demonstrating GDPR compliance documentation (DPIA, processing register, etc.)
- Signing the Sikt data processor agreement
- Likely a security review
- In some cases, school district approval for student data flow

Timeline for Feide onboarding from initial application to production: realistically 3-9 months, partly outside our control (Sikt's review queue).

For the 2027 pilot (10 schools in Rogaland), the Entra ID + russenavn allowlist path (ADR-0006) works and is fast to implement.

## Decision

**Defer Feide integration to 2028 or later.** For 2026-2027, authenticate via Microsoft Entra ID per school + the russenavn allowlist. Sign in with Apple as a parallel path for App Store compliance.

Begin Feide application paperwork in Q4 2027 (during the school year, after the 10-school deployment is stable) to be ready for the 2028-2029 russ year (national expansion).

## Alternatives considered

- **Implement Feide for the 2027 pilot.** Rejected: timeline risk. If Feide approval drags into spring 2027 we'd miss the russetid 2027 window entirely.

- **Skip Feide entirely, rely on Entra forever.** Rejected: for national expansion, Feide is a major trust signal and onboarding accelerator. Worth the eventual investment.

- **Use Feide via a third-party identity broker.** Rejected: brokers add another vendor in the data path, complicate the EU compliance story, and most are US-owned.

## Consequences

### Good
- 2027 pilot can ship on schedule with proven, fast-to-implement auth.
- We have a full year of operational data to make the Feide application stronger ("here's what we built, here's our incident record, here's our DPIA").
- The Entra ID + allowlist code is also useful as a fallback for schools that don't use Feide (rare but possible).

### Bad / trade-offs accepted
- Schools that ask "do you support Feide?" get a "not yet, planned for 2028" answer in 2027. Some may decline to pilot because of this.
- Knutesjef has to manually paste the russenavn list each year. Feide could automate this if we had user-attribute access. Manual is fine at pilot scale.

### Neutral
- The auth layer must be designed to support adding Feide as a parallel path WITHOUT rearchitecting. The russenavn allowlist remains the source of truth — Feide would be a fourth identity provider feeding into the same allowlist lookup.

## Open questions

- Can we start the Feide application paperwork in late 2027 even while running the Entra pilot? Likely yes — application doesn't block other auth paths.
- Does Sikt require a specific data processing agreement template? Standard EU GDPR DPA should work, but we'll need to review their requirements when we apply.
