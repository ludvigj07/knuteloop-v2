# ADR-0020: Tiered school price + sponsor-driven revenue model

**Status:** Proposed
**Date:** 2026-07-07
**Deciders:** Ludvig (+ Claude as advisor)

## Context

ADR-0011 (scale target) recorded the revenue model as "schools pay ~3500 kr flat,
≈ 23 kr/user → ~460,000 kr at 20,000 users." Since then the pricing thinking has moved on,
and the written record no longer matches the actual decisions:

- Flat 3500 was a one-off pilot cost-recovery + effort figure, not the go-forward model.
- The real model is **tiered** school pricing plus a **sponsor-driven** revenue thesis.
- 2027 has been reframed as a *foundation-building* year, not a revenue-maximisation year.

Leaving ADR-0011's revenue math as the only written record creates a self-contradiction
(0011 implies ~460k from schools; the tiered model implies ~90k from schools at 100 schools).
This ADR records the current revenue model. Detailed, living numbers live in
`docs/pricing-strategy.md`; the cost basis lives in `docs/cost-model.md`.

## Decision

**1. School payment — tiered, billed on submissions.**
0–500 submissions = free, 501–1500 = 500 kr, 1501–3000 = 1000 kr, 3000+ = 1500 kr per season.
Billed on submissions (≈ approved; 99.4 % approval on the pilot). School revenue is modest
(~90k kr at 100 schools) and functions as an **adoption driver**, not the profit centre — the
near-zero marginal cost per submission makes the tiers value-pricing, not cost-recovery.

**2. Sponsors are the primary revenue engine — brand/cultural sponsorship, not advertising.**
Regional, category-exclusive sponsorship (a business woven into russetid + word-of-mouth),
reported aggregate-only (no PII, per `security.md` §9). A "region" = a social catchment
(friend network), not geography. Regional price is reach-based (russ × rate) plus an
exclusivity premium, and is *discovered* via founding-partner deals, not calculated.
Regional is the 2027 focus; national is deferred (needs proof + luck).

**3. 2027 optimises for foundation, not profit:** installed base + cultural position + proof.
Go-to-market: **density before breadth**, home region (Stor-Stavanger) first, "sell wide,
deliver deep."

**This supersedes the revenue assumptions of ADR-0011.** ADR-0011's scale target
(100+ schools for 2027) and its infrastructure/scaling decisions stand unchanged.

## Alternatives considered

- **Flat per-school price (ADR-0011's 3500).** Rejected: leaves money on the table for engaged
  schools, higher friction to sell, and doesn't match the value delivered (which varies with usage).
- **Per-completion (CPA) sponsor billing.** Rejected as the primary meter: undercounts the real
  value (word-of-mouth + cultural embedding are invisible to a completion counter) and revenue is
  unpredictable. Kept as *proof/renewal* evidence in the sponsor report instead.
- **Per-impression (CPM) sponsor billing.** Rejected: sells the wrong metric (eyeballs, not action)
  and forces competition with cheap programmatic ad inventory where we lose.
- **Breadth-first national rollout.** Rejected: a sponsor buys a *region*, so scattered schools
  across many regions are not sellable. Density in a home region first is what makes a region sellable.

## Consequences

### Good
- Margin ~95 % once sponsor revenue is included (sponsor is near-pure margin; infra < 5 % of revenue).
- Free/low school tiers maximise adoption → feed the feed/handoff growth loop → build the audience
  that sponsors pay for.
- Matches the seasonal + intermittent-availability (military service) reality: build compounding
  assets in 2027 while Ludvig is available; the machine runs semi-autonomously afterwards.

### Bad / trade-offs accepted
- School payment alone does not cover much — the model depends on landing the first sponsor.
- Sponsor revenue is unvalidated: no paid sponsors in v1 (the ice-cream knute — 65+ purchases from
  one challenge — is a conversion proxy, not a paid datapoint). The first founding deal is the
  pivotal unknown.
- Region russ-counts and the rate per russ are still unquantified (see `pricing-strategy.md`).

### Neutral
- `cost-model.md`'s Vipps framing updated to seasonal (~3750 kr/season max, all-in) — Vipps is a
  small seasonal post, not the dominant year-round cost the earlier draft implied.
- `docs/pricing-strategy.md` is the living detail document; this ADR is the decision of record.

## Open questions

- Russ per social region (drives the reach-based price directly).
- Rate per russ (kr/russ) — anchored ~10–15 kr from the Stavanger signal; Oslo premium on top.
- The first real founding-sponsor datapoint — beats every assumption in the model.
