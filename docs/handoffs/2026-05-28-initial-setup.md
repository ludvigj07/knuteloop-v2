# Handoff — 2026-05-28 (initial setup)

## Snapshot

- **Branch:** main (initial commit)
- **Last commit:** N/A (this is the first session's setup)
- **Uncommitted changes:** Yes — entire .claude/ and docs/ directories are new
- **Session length:** N/A (initial scaffold)
- **Claude model:** Claude

## What got done this session

This was the initial creation of the entire Claude Code documentation system. Specifically:

- Wrote `CLAUDE.md` rooted file (~240 lines, under the 300-line budget)
- Wrote `.claude/rules/{backend,database,security,frontend}.md` — full-depth rule files for each domain
- Wrote `.claude/settings.json` with permission deny/ask lists + hook registrations
- Wrote `.claude/hooks/{session-start,pre-edit-protect,pre-bash-validate,post-edit-quality}.sh` — shell scripts that enforce critical rules
- Wrote `.claude/skills/{backend-review,check-rls,migration-plan,comeback,handoff}/SKILL.md` — slash commands
- Wrote `docs/architecture.md` — system overview, request flow, scale ramp, deployment topology
- Wrote `docs/adr/README.md` + ADRs 0001-0010 — every major technical decision recorded
- Wrote `docs/glossary.md` — russ vocabulary for Claude and future Ludvig
- Wrote `docs/workflows.md` — playbooks for common engineering tasks
- Wrote `docs/anti-patterns.md` — ❌/✅ reference table
- Wrote `docs/learning-mode.md` — pedagogical guidance for Claude
- Wrote `docs/comeback-protocol.md` — long-form human-side procedure
- Wrote `docs/disaster-recovery.md` — runbooks for production incidents
- Wrote `docs/dpia.md` — GDPR Data Protection Impact Assessment draft
- Wrote `README.md` — overview + install instructions

## What's in progress

Nothing. The documentation set is complete as a v1 baseline. It will evolve as the codebase grows — that's expected.

## What's blocked / waiting

- Ludvig needs to: copy this whole directory into the actual `knuteloop` monorepo root
- Ludvig needs to: `chmod +x .claude/hooks/*.sh` after copy
- Ludvig should: review the ADRs and challenge any decisions he disagrees with NOW, while they're easy to change
- Ludvig should eventually: have a Norwegian lawyer review `docs/dpia.md`
- Ludvig should: make the first proper commit and push to a private GitHub repo

## What's next when you come back

In priority order:

1. **Set up the actual monorepo skeleton.** Create `apps/api`, `apps/mobile`, `packages/shared`. Initialize each with `pnpm init`, install minimal deps. Get `pnpm typecheck` passing on empty TypeScript files.
2. **Add the database schema files** — start with `schools`, `users`, `russenavn_allowlist`. Then submissions. Run `/check-rls` on each.
3. **Set up the API skeleton** — Hono app with middleware chain, no routes yet, just `/healthz`. Get it deploying to a Hetzner box.
4. **Begin the auth flow** — Entra ID validation + russenavn allowlist lookup. This is the riskiest piece, so do it early with full attention.

## Gotchas / things to remember

- The `.claude/hooks/*.sh` scripts MUST be executable (`chmod +x`) after copying into the real repo. The repo's git tracks the executable bit, so once they're chmod'd and committed once, it's set forever.
- The `apps/api/src/lib/aiven-ca.pem` referenced in the database rules is NOT created yet — it comes from the Aiven console once the Postgres service is provisioned.
- The `pre-bash-validate.sh` hook references `aivencloud.com` as the production-marker for blocking destructive ops. Update if Aiven's URL pattern changes.
- The settings.json permissions list `pnpm drizzle-kit migrate` as "ask" — Claude will pause before applying migrations. That's intentional.

## Files touched

Entire directory tree (initial creation):
- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/rules/*.md` (4 files)
- `.claude/hooks/*.sh` (4 files)
- `.claude/skills/*/SKILL.md` (5 files)
- `docs/architecture.md`
- `docs/glossary.md`
- `docs/workflows.md`
- `docs/anti-patterns.md`
- `docs/learning-mode.md`
- `docs/comeback-protocol.md`
- `docs/disaster-recovery.md`
- `docs/dpia.md`
- `docs/adr/README.md`
- `docs/adr/0001-0010-*.md` (10 ADRs)
- `README.md`

## Resume command

```bash
cd ~/code/knuteloop                # or wherever the monorepo is/will be
git init -b main                   # if not already a repo
cp -r ~/Downloads/knuteloop-claude-setup/. .
chmod +x .claude/hooks/*.sh
git add .
git commit -m "chore: initial Claude Code documentation system"
gh repo create knuteloop --private --source=. --remote=origin --push
# Now: claude /status to verify Claude Code picks up CLAUDE.md
```

## Open questions for Ludvig

- Brand colors in `frontend.md` (`primary: '#C8102E'` russ red) — confirm or update with actual brand colors
- Confirm `JetBrainsMono` is the desired monospace and `InstrumentSerif` the display font — these are placeholders that look right but should be Ludvig's call
- Confirm `app.knuteloop.no` and `api.knuteloop.no` subdomain plan (vs. `app.knuteloop.com` etc.)
- Confirm `personvern@knuteloop.no` is set up as a real monitored inbox

## Related ADRs

All ten of the foundational ADRs were written this session — ADR-0001 through ADR-0010 in `docs/adr/`. Read them in order before challenging anything; they reference each other.

## Tests status at session end

N/A — no code in the actual repo yet. This is a documentation-only delivery.
