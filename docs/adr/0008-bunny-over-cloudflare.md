# ADR-0008: Bunny.net over Cloudflare R2 for image storage and delivery

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

Knuteloop stores user-uploaded submission photos plus a small set of static assets (sponsor logos, badge images, app assets). At pilot scale (1 school, 14 days): 1900+ submissions → ~2GB storage. At 10 schools annually: ~25GB. At 250 schools: ~700GB.

Bandwidth is the bigger cost driver — every feed view fetches thumbnails. At 250 schools with active engagement, we're looking at multiple TB/month egress.

Requirements:
- EU-domiciled (ADR-0001)
- Cheap egress (we'll have a lot of it)
- Image transformations (multiple sizes, format conversion to WebP/AVIF)
- Signed upload URLs (so mobile can upload directly without going through our backend)
- Acceptable latency from Norway

## Decision

Use **Bunny.net** for both object storage (Bunny Storage) and CDN (Bunny CDN), with the **Bunny Optimizer** for image transformations.

Storage zone in **Frankfurt** (closest EU region to Norway). CDN PoPs are global, with strong EU coverage including a Stockholm node.

## Alternatives considered

- **Cloudflare R2 + Cloudflare Images.** Excellent DX, free egress is famous. Rejected: Cloudflare is US-owned (CLOUD Act). EU users' data routes through Cloudflare's global network with no firm EU-only routing guarantee.

- **AWS S3 + CloudFront.** Industry standard. Rejected: US-owned.

- **Backblaze B2 + Bunny CDN.** Cheap storage at Backblaze, EU region available. Backblaze is US-owned, though. Rejected.

- **Hetzner Object Storage.** Native EU. Rejected: as of 2026 it's still relatively new with limited tooling and no built-in CDN; we'd be cobbling pieces together.

- **Scaleway Object Storage + their CDN.** French/EU-owned. Rejected vs. Bunny: pricing is higher, CDN PoP count smaller, less optimized for our specific image use case.

- **OVH Object Storage.** Rejected: lower-quality developer experience than Bunny, fewer CDN PoPs.

## Consequences

### Good
- Bunny is Slovenian (EU-owned), data centers in EU. CLOUD Act-safe.
- Aggressive pricing: ~€0.005/GB storage, ~€0.005-0.01/GB egress. Order of magnitude cheaper than S3+CloudFront.
- Bunny Optimizer URL parameters (`?width=400&format=webp&quality=80`) handle on-the-fly resizing — no need for pre-generated thumbnails or a separate image service.
- Signed upload URLs (called "tokens" in Bunny terminology) work for client-direct uploads.
- Excellent uptime track record, responsive support.

### Bad / trade-offs accepted
- Smaller than Cloudflare/AWS — less ecosystem tooling, fewer Stack Overflow answers. We rely on Bunny's documentation more.
- The "free egress" advantage of R2 is real and tempting — at our scale, Bunny's egress is still cheap, but we should monitor.
- Storage zones are region-specific; we don't get free multi-region replication. At our scale this is fine; at international scale we'd add zones.

### Neutral
- We MUST verify image MIME type server-side before creating a submission record (don't trust file extension). Captured in `.claude/rules/security.md`.
- Submission flow: mobile uploads to Bunny via signed URL → mobile POSTs to our API with the imageKey → API verifies the upload exists and is a valid image → API inserts the submission row.

## Open questions

- Do we need a separate Bunny pull zone or storage zone for sponsor logos vs. submissions? Probably yes — different access patterns, different cache TTLs, easier to revoke if a sponsor relationship ends.
- At what scale (if ever) does it make sense to add an EU-East PoP / second storage zone? Not until we expand outside Norway.
