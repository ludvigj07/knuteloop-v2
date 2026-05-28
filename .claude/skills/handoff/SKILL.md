---
name: handoff
description: Write a session-end handoff note to docs/handoffs/YYYY-MM-DD-HHMM.md. Run at the end of every Claude Code session so future Ludvig (after weeks away) can pick up.
allowed-tools:
  - Read
  - Write
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(date:*)
---

# /handoff

Write a handoff note for this session. The audience is **future Ludvig, after a 2-week military leave**, who has forgotten everything that happened in this session. The note must let him resume without re-reading the entire codebase.

## Procedure

### 1. Gather the session state

```bash
# Current state
git status
git branch --show-current
git diff --stat
git log -5 --pretty=format:"%h %ad %s" --date=short

# What changed in this session specifically
# (Ask Ludvig: "What time did this session start?" if unclear,
# or use the timestamp of the previous handoff as the starting point.)
```

### 2. Determine the filename

Format: `docs/handoffs/YYYY-MM-DD-HHMM.md`

Get the current timestamp:

```bash
date +%Y-%m-%d-%H%M
```

### 3. Write the handoff content

Use this template exactly. Fill in every section. If a section is empty, write "None" — don't delete the heading.

```markdown
# Handoff — <YYYY-MM-DD HH:MM>

## Snapshot

- **Branch:** <branch name>
- **Last commit:** <hash> <message>
- **Uncommitted changes:** <yes/no — list files>
- **Session length:** ~X hours
- **Claude model:** <model name if known>

## What got done this session

- <Concrete, specific bullet>
- <Concrete, specific bullet>
- <...>

Be specific. Not "worked on auth" — instead "implemented the Entra ID verification flow in `apps/api/src/lib/entra.ts`, including JWKS caching per tenant; added integration test for token signature validation."

## What's in progress

What was being worked on but not finished? Be brutally honest about state:
- File: <path>
- What's done in this file: <brief>
- What's not done: <brief>
- What state is it in: <compiles / broken / has TODO markers>

## What's blocked / waiting

- <External dependency Ludvig needs to handle: e.g., "Need Aiven password rotated — Ludvig must do this in console">
- <Decision pending: e.g., "Awaiting Ludvig's answer on whether to use per-school subdomains">

## What's next when you come back

In priority order:
1. <Most important thing to do>
2. <Next>
3. <Next>

If unclear, write: "Discuss with Ludvig before resuming — priorities may have shifted."

## Gotchas / things to remember

- <Subtle bug encountered: "When using Drizzle with Aiven pgbouncer, must set `prepare: false`">
- <Convention worth noting: "We decided to use kebab-case for route file names this session">
- <Anything that would bite future Ludvig if he forgot>

## Files touched

<List from `git diff --stat`>

## Resume command

When you come back, run this first:

```
<exact command to get into the right state>
# e.g.:
git checkout feat/entra-id-auth
pnpm install
pnpm --filter @knuteloop/api dev
```

## Open questions for Ludvig

- <Anything Claude needs clarified before continuing>
- <Anything Ludvig should think about while away>

## Related ADRs

- <Link to any ADRs created or modified this session>

## Tests status at session end

- Typecheck: <pass / fail>
- Lint: <pass / fail>
- Unit tests: <pass / fail>
- RLS integration tests: <pass / fail>
- Notes on test failures: <if any>
```

### 4. Write the file

Use the `Write` tool to create the file at the path determined in step 2. Then echo the path back so Ludvig knows where it went.

### 5. (Optional) Stage and commit the handoff

If Ludvig wants:

```bash
git add docs/handoffs/<filename>.md
git commit -m "chore: handoff <YYYY-MM-DD-HHMM>"
```

Ask first — don't auto-commit.

## When the session was trivial

If the session was just reading or planning with no code changes, still write a handoff. It should be short, but it captures "we discussed X, decided Y, will do Z next time."

## When the session was disastrous

If the session ended in a broken state (tests failing, build broken, half-finished refactor), the handoff is MORE important, not less. Be EXPLICIT about what's broken so future Ludvig doesn't think things are working.

Use the phrase **"CAUTION: REPO IS IN BROKEN STATE"** at the top if applicable, so the session-start hook surfaces it.

## Output

After writing the file, summarize back to Ludvig:

```
Handoff written: docs/handoffs/2026-06-15-1842.md

Key takeaways for future you:
1. <Top thing>
2. <Top thing>
3. <Top thing>

Want me to commit this?
```
