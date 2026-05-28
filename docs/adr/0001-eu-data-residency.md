# ADR-0001: EU-only data residency

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

Knuteloop processes personal data of Norwegian high-school students, many under 18. Under GDPR and the supplementary guidance from Datatilsynet (the Norwegian Data Protection Authority), this triggers heightened scrutiny.

The 2020 Schrems II ruling invalidated the EU-US Privacy Shield. The 2023 EU-US Data Privacy Framework partly restored a basis for transfers, but legal scholars and Datatilsynet itself have consistently advised that minor data should NOT rely on it.

Beyond the regulatory question: the US CLOUD Act (2018) authorizes US authorities to compel US-domiciled companies to produce data regardless of where it's physically stored. This applies to AWS Frankfurt, Azure Stockholm, GCP Belgium — anything operated by a US-owned legal entity.

For a product whose user base is minors at Norwegian schools and whose competitive positioning includes "Norwegian, trustworthy, run by russ for russ," US-owned infrastructure is a brand and regulatory risk we don't need to take.

## Decision

All Knuteloop data — user records, submissions, photos, logs, analytics — is stored exclusively on infrastructure operated by EU/EEA-domiciled companies, in EU/EEA data centers.

Specifically: Aiven (Finnish/EU), Bunny.net (Slovenian/EU), Hetzner (German/EU), Sentry SaaS EU region, Plausible (EU-hosted).

This applies to ALL data, including logs, analytics events, and error reports. No exceptions.

## Alternatives considered

- **AWS Frankfurt / Azure Stockholm / GCP Belgium:** much larger feature surface, common in the industry, but US-owned → CLOUD Act applies. Rejected.

- **Supabase:** developer-friendly, common in YC-backed startups, but US-owned (Delaware C-corp). Same CLOUD Act exposure. Their EU regions are leased AWS infrastructure. Rejected.

- **Self-hosted Postgres on Hetzner:** ultimate control, but ops burden is high (backups, PITR, monitoring, patching, security updates) and Ludvig is solo with intermittent availability. Rejected as primary plan; reconsidered if Aiven costs become prohibitive at scale.

- **Cloudflare R2 + Workers:** good DX, EU regions exist, but Cloudflare is US-owned. Rejected.

- **Mixed: US for non-PII, EU for PII:** complexity isn't worth it for our scale. One rule (EU only) is easier to enforce than two. Rejected.

## Consequences

### Good
- Strong, defensible privacy story for marketing AND for Datatilsynet inquiries.
- Reduced legal exposure around US authority compulsion.
- Aligns with brand identity ("Norwegian, by russ").
- Forces simplicity — fewer vendor choices, less drift.

### Bad / trade-offs accepted
- Smaller ecosystem. No managed Vector DBs in EU-only land yet — if we want AI features later, options are limited.
- Some libraries assume AWS/Cloudflare conventions; we'll have to adapt.
- Aiven is more expensive per GB than DigitalOcean Managed Postgres, but DigitalOcean stores via AWS internally — not viable.
- We cannot use any popular tooling that relies on US-only services (Vercel, Netlify, Cloudflare Workers, Firebase, Supabase Edge Functions, AWS Lambda, etc.).

### Neutral
- This decision must be re-validated annually as the legal landscape changes. If a future legal framework genuinely resolves the issue, we reconsider — but the bar is HIGH.

## Open questions

- Sentry has EU and US regions; we must verify our DSN points to EU and confirm in writing that EU customer data does not transit US servers.
- For App Store / Play Store distribution, are there transit risks? Apple/Google operate in EU and have separate EU entities for app distribution, so we believe this is acceptable, but worth a periodic review.
