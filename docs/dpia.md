# Data Protection Impact Assessment (DPIA) — Knuteloop v2

This is the draft DPIA following Datatilsynet's published template structure. It must be reviewed and finalized by Ludvig (and ideally a Norwegian lawyer specializing in personvern) before App Store submission and before the 2027 pilot launches.

**Status:** DRAFT (working document). Not legally binding until finalized.

---

## 1. Description of processing

### What we collect

| Data type | Source | Purpose | Retention |
|---|---|---|---|
| russenavn (russ nickname) | Imported by knutesjef from allowlist | Display in app, identify user within school | End of russ year + 30 days |
| Email address | Microsoft Entra ID or Apple Sign In | Identity verification, account recovery | End of russ year + 30 days |
| Full name (optional) | Allowlist import | Internal records, GDPR data export | End of russ year + 30 days |
| Submission photos | User upload | Display in feed, proof of knute completion | End of russ year + 30 days |
| Submission captions | User input | Display in feed | Same as above |
| Points and rank | Derived | Leaderboard, profile | Same |
| Device identifier (per-session UUID) | Generated on first login per device | Multi-device session management | Until device logout or russ year end |
| Login events / audit log (action, timestamp, actor, target) | API middleware | Security audit, GDPR Article 30 records | 1 year |
| Sentry errors (with PII scrubbed) | API runtime | Debugging | 90 days |
| Plausible analytics events (aggregated, no individual identification) | Mobile app | Product analytics | Indefinite, aggregate only |

### What we do NOT collect

- Behavioral profiling
- Location data
- Contacts, calendars, photos beyond submissions
- Microphone, biometrics (FaceID/TouchID is local-only via OS, we don't see it)
- Health, sexual orientation, religion, political views, ethnicity, or any other special-category data under GDPR Article 9

### Who has access

- The user themselves
- The knutesjef of their school (for approval workflow and roster management)
- Ludvig as the data controller, for support and operations (logged in audit log)
- Aiven's Postgres infrastructure team in the abstract (data processor)
- Bunny.net for image hosting (data processor)
- No sponsors, ever, beyond aggregate analytics
- No third parties for advertising or analytics

---

## 2. Legal basis (GDPR Article 6)

Primary basis: **consent** (Article 6(1)(a)) for processing of personal data for the app's core function.

For users under 16, parental consent is required under GDPR (some EU member states set this at 13-16; Norway is 13).

For sensitive operations (data export, deletion), basis is **legitimate interests** (Article 6(1)(f)) AND the user's GDPR rights (Articles 15, 17).

For audit logs and security, basis is **legitimate interests** (security and compliance).

---

## 3. Special considerations for minors (Article 8)

Some users will be 17 (the standard Vg3 age range is 17-19). Datatilsynet's guidance for processing minor data:

- **Transparency:** the privacy notice in the app uses plain Norwegian language, age-appropriate.
- **Minimization:** we collect only what's needed for the app's function. We do NOT collect data for marketing or profiling.
- **Children's rights:** the user can export and delete their data from settings, no friction.
- **No automated decision-making with legal effect:** the knutesjef approves submissions manually; nothing automated affects the user's legal or contractual status.

---

## 4. Data protection principles

| Principle | How we comply |
|---|---|
| Lawfulness, fairness, transparency | Plain-language privacy notice. No hidden uses. Consent flow on first login. |
| Purpose limitation | Each data category has one stated purpose. No purpose creep. |
| Data minimization | Collect only what's needed. No cookies, trackers, behavioral profiles. |
| Accuracy | User can edit profile fields. Errors corrected within 30 days of report. |
| Storage limitation | Retention table above. Annual scheduled deletion job. |
| Integrity and confidentiality | TLS for all transit. Postgres SSL. RLS for tenant isolation. Logs PII-redacted. Sentry PII-scrubbed. |
| Accountability | This DPIA, audit logs, Article 30 records of processing. |

---

## 5. Data flow

```
User device (mobile app, iOS/Android)
    │
    ├──> HTTPS, validated JWT
    ▼
API in Hetzner Helsinki (DE/FI, EU)
    │
    ├──> Postgres in Aiven Helsinki (FI, EU) — primary storage
    ├──> Bunny Storage in Frankfurt (DE, EU) — images
    ├──> Sentry EU (DE) — errors, PII-scrubbed
    └──> Plausible EU (DE) — analytics, aggregate only
```

All data stays within the EU/EEA. No US-domiciled service is in the data path.

---

## 6. Risks identified

| Risk | Likelihood | Impact | Mitigations |
|---|---|---|---|
| Cross-tenant data leak (school A sees school B) | Low (with RLS + tests) | Very high (regulatory + brand) | RLS + FORCE + integration test suite + `/check-rls` + `/backend-review`. See ADR-0002. |
| Unauthorized account access (credential stuffing) | Medium | Medium | Rate limiting on auth endpoints. Multi-factor via Entra. Token rotation. |
| Account-takeover via leaked refresh token | Low | Medium | Tokens hashed in DB. Refresh rotation. Reuse detection revokes all sessions. |
| PII in logs reaching log aggregator | Low | Medium | Pino redact paths cover known PII fields. Sentry beforeSend scrubs. |
| Sponsor receives per-user data inappropriately | Low | High (regulatory) | Endpoint-level aggregation only. Tested. Contractually forbidden. |
| Loss of access to Aiven account | Low | High (operational) | 2FA on Aiven. Backup admin credentials in physical safe + 1Password. |
| Data subject request not responded to in 30 days | Low | Medium (regulatory) | Email forwarding to Ludvig's monitored inbox. Self-service export/delete in app. |
| Unauthorized physical access to operator devices | Low | Medium | Full-disk encryption on dev machines. 1Password for credentials. |

---

## 7. Data subject rights — operational procedures

### Right to access (Article 15)
- Self-service: settings → "Last ned mine data" — returns a JSON of all the user's records.
- Email request: `personvern@knuteloop.no` — Ludvig responds within 30 days (target: 7).

### Right to rectification (Article 16)
- Self-service: settings → "Rediger profil" — for editable fields.
- For russenavn (immutable from user side): contact the knutesjef.

### Right to erasure (Article 17)
- Self-service: settings → "Slett min konto" — confirms, then soft-deletes.
- Soft delete: anonymize PII (russenavn → "[slettet]", email → null, fullName → null), keep audit-relevant aggregates.
- Hard delete after 30 days via scheduled job.

### Right to data portability (Article 20)
- Same as right to access — JSON export is structured.

### Right to object (Article 21)
- For the app's core function, refusal of processing means no service. The user can delete the account.
- No marketing or profiling exists, so there's nothing else to object to.

---

## 8. International transfers (Article 44+)

None. All data stays within the EU/EEA. See ADR-0001.

Push notifications via Expo: payload contains no PII (only references like submission IDs). The Expo Push service routes payloads through their infrastructure, which spans regions. We have verified (TODO: confirm with Expo's docs and signed) that no PII transits.

---

## 9. Security measures (Article 32)

### Technical
- TLS 1.2+ for all client/server connections, Postgres SSL.
- JWT RS256 with key rotation.
- Refresh tokens hashed (sha256) in DB.
- Postgres RLS with FORCE for tenant isolation.
- Rate limiting (10/15min for auth, 100/min for mutations).
- Input validation via Zod on every endpoint.
- Pino structured logs with PII redaction.
- Sentry errors with PII scrubbing in `beforeSend`.
- Hetzner host firewall + Aiven VPC ACL.

### Organizational
- Aiven 2FA enabled.
- 1Password for all credentials, no shared passwords.
- GitHub secret scanning enabled.
- Dependabot for vulnerability scanning.
- Annual review of this DPIA.
- Monthly backup verification (see disaster-recovery.md §10).

---

## 10. Data Processing Agreements (DPAs)

The following processors require signed DPAs:

- [x] Aiven (Postgres, EU) — DPA on file
- [x] Bunny.net (storage + CDN, EU) — DPA on file
- [x] Hetzner Cloud (compute, EU) — DPA on file
- [x] Sentry (errors, EU region) — DPA on file
- [x] Plausible (analytics, EU) — DPA on file
- [ ] Expo (push notifications) — DPA TODO; confirm scope
- [ ] Microsoft Entra ID (identity provider) — relationship is between school and Microsoft; we as service consumer don't have a direct DPA with Microsoft, but each school has its own M365 agreement
- [ ] Apple (Sign In with Apple) — covered under standard developer agreement

---

## 11. Article 30 register of processing activities

Maintained separately at `docs/article-30-register.md` (TODO: create as separate file).

Should list, for each processing purpose:
- Name and contact of controller (Ludvig)
- Purposes of processing
- Categories of data subjects (Vg3 russ, knutesjef, admin)
- Categories of personal data
- Categories of recipients (data processors above)
- Transfers (none outside EU)
- Retention periods
- Description of security measures (summarized from §9)

---

## 12. Contact

- **Data controller:** Ludvig [last name], CEO/founder, Knuteloop
- **Privacy contact:** personvern@knuteloop.no
- **Datatilsynet** is the supervisory authority.

---

## 13. Review schedule

This DPIA is reviewed:
- Before App Store submission for v2 (mandatory before launch)
- Annually thereafter, on the anniversary of the previous review
- Upon any major change to data processing (new processor, new data type, new transfer)
- After any data incident

---

## 14. Sign-off

Once reviewed by a Norwegian personvern lawyer:
- [ ] Lawyer name + date
- [ ] Ludvig name + date
- [ ] Filed with Datatilsynet (if their guidance requires it — verify)
