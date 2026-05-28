# ADR-0003: Hono over Express for the API framework

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

We need an HTTP server framework for the API. Constraints:

- TypeScript-first (we want types end-to-end, including request/response inference)
- Small, well-documented surface (Ludvig is learning)
- Active maintenance (we're going to live with this for years)
- Good middleware composition story (auth, tenant, rate-limit, validation are all middleware)
- Compatible with Node 22 LTS (we're not running on Edge/Workers)

## Decision

Use **Hono** v4+ as the API framework, running on Node 22 LTS via `@hono/node-server`.

## Alternatives considered

- **Express 5.** The default, ubiquitous. Rejected: TypeScript types are bolted on (`@types/express`), middleware composition is loose, validation libraries are second-class. Maintained but not actively innovated.

- **Fastify.** Better perf than Express, decent TypeScript support, plugin ecosystem. Rejected: heavier API surface, plugin pattern is more ceremony than we need for a small team, and Hono's request/response typing is cleaner.

- **NestJS.** Full framework with DI, decorators, modules. Rejected: way too much framework for a solo founder. Decorators-everywhere style obscures what's happening; learning curve is steep.

- **Bun + Bun.serve.** Native Bun. Rejected: Bun is fast-moving and we don't want to debug runtime issues during military leaves. Node 22 LTS is boring and reliable.

- **tRPC.** End-to-end typesafe RPC. Tempting because it would give us types from server to mobile. Rejected: tRPC is a great fit when client and server ship together; we have a mobile app that needs to support older app versions, so a stable REST contract is actually preferable. We can still type the API responses via shared types in `packages/shared`.

## Consequences

### Good
- First-class TypeScript inference (Hono infers route response types).
- Tiny core (~14KB), easy to read source if needed.
- `@hono/zod-validator` integrates Zod validation natively.
- Standards-compliant Web API style (`Request`/`Response`), easy to test (just call `app.request()`).
- Middleware composition is clean (`app.use('*', middleware)` chains predictably).
- The Hono community is small but active and responsive.

### Bad / trade-offs accepted
- Smaller ecosystem than Express — fewer pre-built middleware. We may have to write our own for some things (rate-limit, etc. — though `hono-rate-limiter` exists).
- Newer than Express; less Stack Overflow content. We rely more on official docs.
- If Hono dies or stagnates, we'd need to migrate. Risk feels low at adoption trajectory in 2026, but real.

### Neutral
- We'll need a small `hono-utils` module in `apps/api/src/lib/` for project-specific patterns (typed error responses, request ID propagation, etc.).

## Open questions

- Hono supports running on Cloudflare Workers, Deno, Bun, etc. We're on Node — should we keep the code portable to allow future migration? Generally yes, but we won't bend the architecture for it.
