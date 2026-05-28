# Knuteloop v2 — Claude Code setup

This repository contains the **Claude Code documentation system** for Knuteloop v2: the rules, hooks, skills, and architectural decisions that keep the project on track over its full 10-month build cycle.

## Structure

```
.
├── CLAUDE.md                       # Root instructions, loaded every session (~180 lines)
├── apps/
│   ├── api/CLAUDE.md               # Backend context — auto-loaded when editing apps/api/**
│   └── mobile/CLAUDE.md            # Frontend context — auto-loaded when editing apps/mobile/**
├── .claude/
│   ├── settings.json               # Permissions + hook registrations
│   ├── rules/                      # Full rule files (pulled in by apps/*/CLAUDE.md)
│   │   ├── backend.md              # Hono + middleware + error handling
│   │   ├── database.md             # Drizzle + RLS + migrations + queries
│   │   ├── security.md             # Auth + JWT + GDPR + secrets + Sentry
│   │   └── frontend.md             # Expo + RN + animations + a11y + design tokens
│   ├── hooks/                      # Shell scripts that enforce rules
│   │   ├── session-start.sh        # Comeback summary + integrity check
│   │   ├── pre-edit-protect.sh     # Blocks edits to migrations/.env/accepted ADRs
│   │   ├── pre-bash-validate.sh    # Blocks dangerous commands
│   │   └── post-edit-quality.sh    # Greps for known anti-patterns, runs typecheck
│   └── skills/                     # Slash commands
│       ├── backend-review/         # /backend-review — review diff against all rules
│       ├── check-rls/              # /check-rls <table> — verify multi-tenant safety
│       ├── migration-plan/         # /migration-plan — classify pending migrations
│       ├── comeback/               # /comeback — protocol when returning after a leave
│       └── handoff/                # /handoff — write session-end notes
├── docs/
│   ├── v1-spec.md                  # ⭐ The behavioural contract extracted from v1 (source of truth)
│   ├── v1-spec-extraction.md       # The prompt used to generate v1-spec.md (day-1 task)
│   ├── architecture.md             # System overview + request flow + scale ramp
│   ├── glossary.md                 # Russ vocabulary (russenavn, knute, knutesjef, ...)
│   ├── workflows.md                # Playbooks: add endpoint, onboard school, deploy
│   ├── anti-patterns.md            # Don't / Do reference table
│   ├── learning-mode.md            # When/how Claude teaches Ludvig new concepts
│   ├── comeback-protocol.md        # Long-form: the human-side comeback procedure
│   ├── disaster-recovery.md        # Runbooks: production down, DB slow, data leak, ...
│   ├── dpia.md                     # GDPR Data Protection Impact Assessment (draft)
│   ├── adr/                        # Architecture Decision Records
│   │   ├── README.md               # ADR index + template
│   │   ├── 0001-eu-data-residency.md
│   │   ├── 0002-postgres-rls-multitenancy.md
│   │   ├── 0003-hono-over-express.md
│   │   ├── 0004-drizzle-over-prisma.md
│   │   ├── 0005-aiven-helsinki.md
│   │   ├── 0006-entra-id-russenavn-allowlist.md
│   │   ├── 0007-expo-over-bare-rn.md
│   │   ├── 0008-bunny-over-cloudflare.md
│   │   ├── 0009-no-video-photos-only.md
│   │   └── 0010-feide-deferred-2028.md
│   └── handoffs/                   # Session handoffs go here (YYYY-MM-DD-HHMM.md)
└── README.md                       # This file
```

## How rule-loading actually works (important)

Claude Code loads context two ways, and this setup uses both:

1. **Root `CLAUDE.md`** — loaded every session. Contains the project overview, the 12 critical rules, and the global workflow. Kept lean.
2. **Subdirectory `CLAUDE.md`** — loaded automatically when Claude works inside that directory. `apps/api/CLAUDE.md` pulls in the backend rules; `apps/mobile/CLAUDE.md` pulls in the frontend rules. This is why touching backend gives you backend rules and touching frontend gives you frontend rules, without bloating every session.

The `globs:` frontmatter inside `.claude/rules/*.md` is **Cursor convention, not Claude Code** — it's kept for documentation and Cursor portability, but Claude Code ignores it. Loading happens via the `@`-imports in the `CLAUDE.md` files. (Hooks are the real enforcement layer — text rules get ~70% compliance, hooks get the critical 30%.)

## ⚠️ One manual step: paste the v1 spec

`docs/v1-spec.md` currently has only a header. Paste the full extracted spec
(the `V1-SPEC.md` artifact) below that header before first use. The path-scoped
`CLAUDE.md` files import it as the behavioural contract.

## Install

This directory is a drop-in. Unpack it into the root of your Knuteloop monorepo:

```bash
cd ~/code/knuteloop                       # your monorepo root
cp -r /path/to/knuteloop-claude-setup/. . # copies CLAUDE.md, .claude/, docs/

# Make hooks executable
chmod +x .claude/hooks/*.sh

# Verify Claude Code picks it up
claude /status
```

Then check that the hook scripts can find the right tools. If `pnpm` isn't on PATH, the `post-edit-quality.sh` will skip the typecheck step (acceptable). If you want full enforcement, ensure `pnpm` and `git` are on PATH where Claude Code runs.

## Update `.gitignore`

Add these lines if not already present:

```
# Local Claude Code overrides
.claude/settings.local.json
.claude/hooks/*.local.sh

# Env files (NEVER commit)
.env
.env.local
.env.*.local
apps/*/.env
apps/*/.env.local
```

## Daily workflow

| When | What you do |
|---|---|
| Start of any session | `claude` (session-start hook runs automatically) |
| After ≥24h gap | `/comeback` |
| Before any DB migration | `/migration-plan` |
| After any new tenant-scoped table | `/check-rls <table>` |
| Before declaring a backend PR done | `/backend-review` |
| End of every session | `/handoff` |

## The single most important rule

If anything in `.claude/` or `CLAUDE.md` was modified outside of normal git workflow — STOP. CLAUDE.md is an attack surface (LayerX disclosure, March 2026). Run `git diff CLAUDE.md` before trusting it. The session-start hook will warn you.

## Maintenance

This documentation system is itself code. It needs maintenance:

- **Quarterly:** review CLAUDE.md against actual practice. Drift happens.
- **Annually:** review DPIA, ADR-0001 (EU data residency), and disaster-recovery procedures.
- **After every incident:** add a runbook to `docs/disaster-recovery.md`.
- **After every major decision:** write an ADR. Better to over-document than under-document.

## Questions

Open an issue in the monorepo with the `docs/` label, or just edit and PR.
