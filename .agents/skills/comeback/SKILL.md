---
name: comeback
description: Run this at the start of any session after being away from the project for ≥ 24 hours. Reads handoff notes, summarizes recent commits, checks for new ADRs, and brings you back up to speed.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(git log:*)
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(ls:*)
  - Bash(pnpm test:*)
  - Bash(pnpm typecheck:*)
---

# /comeback

The comeback protocol. Run at the start of any session after a leave. Ludvig's biggest risk on this project is coming back from a 2-week military stretch, diving in, and breaking something he doesn't remember the shape of. This protocol prevents that.

## Procedure

### 1. Establish the gap

Determine how long it's been since the last session:

```bash
# Get the timestamp of the latest handoff file
ls -lt docs/handoffs/*.md 2>/dev/null | head -n 1

# Get the timestamp of the latest commit
git log -1 --format="%ad" --date=iso
```

Report: "You've been away for approximately X days/weeks."

### 2. Read the most recent handoff

Find the latest file in `docs/handoffs/` and read it in full. Summarize:
- Branch we were on
- What was done
- What was in progress
- What's pending
- Any gotchas noted
- The "resume command" if specified

### 3. Recent commit activity

```bash
git log --since="<gap>" --pretty=format:"%h %ad %s%n%b%n---" --date=short
```

For each commit, give a 1-line plain-English summary of what changed. Highlight anything that affected:
- Database schema
- Auth flow
- Critical rules in AGENTS.md
- Settings, hooks, or skills
- Anything in `apps/api/src/middleware/`

### 4. New or modified ADRs

```bash
# List ADRs sorted by modification time
ls -lt docs/adr/*.md
```

Report any ADRs created or modified during the gap. Read the title and status of each.

### 5. Check for uncommitted work

```bash
git status
```

If there are uncommitted changes — read the diff. Report:
- Which files are modified
- Whether they look incomplete (e.g., functions with empty bodies, TODO comments)
- Whether they're safe to leave or whether they need finishing

### 6. Verify the project still builds

```bash
pnpm typecheck
pnpm lint
```

Report any failures. If something doesn't build, that's the FIRST priority before any new work.

### 7. Verify the test suite still passes

```bash
pnpm test
```

Pay particular attention to:
- RLS integration tests (`apps/api/src/test/integration/rls.test.ts`)
- Auth tests
- Any test files that appeared in the recent commits

If tests are failing, that's the second priority.

### 8. Check infrastructure status (advisory)

Ask Ludvig to glance at:
- Aiven console — any incidents during the gap? PostgreSQL service healthy?
- Sentry EU — any new error patterns in the gap period?
- Hetzner status — server still up?
- Bunny.net — storage zone still active?

You can't check these from inside Codex, but remind him to.

### 9. Check for new dependencies / Dependabot PRs

```bash
git log --since="<gap>" --grep="bump\|deps\|upgrade" --oneline
```

If Dependabot has merged updates, mention them. If there are pending Dependabot PRs (Ludvig can check GitHub), recommend reviewing them before starting new work.

### 10. Surface "what's most important right now"

Based on everything above, propose:

```
# Comeback summary

**Gap:** X days/weeks since last session
**Last branch:** <branch> (current: <current branch>)
**Last handoff:** <date> — <one-line gist>
**Status:** <green: ready to code | yellow: minor issues | red: must fix before coding>

## What changed while you were away

- N commits across <list of areas>
- M new/modified ADRs: <list>
- <Any critical changes>

## What's in progress

- Uncommitted: <files>
- Incomplete: <yes/no — with detail>

## What's blocking new work

- [ ] Tests passing? <yes/no — failures listed>
- [ ] Typecheck passing? <yes/no>
- [ ] Lint passing? <yes/no>

## Recommended next actions

1. <Most important thing — usually "review uncommitted changes" or "fix failing tests">
2. <Next>
3. <Next>

## Last handoff verbatim (relevant excerpt)

<quoted from the handoff file>
```

### 11. Ask Ludvig what he wants to do

End with:

> What's the goal for this session? I'll plan based on the state above.

DO NOT start writing code based on assumptions about what he wants. After a leave, the most common mistake is to dive into "what was being worked on" without confirming whether that's still the priority.

## When NOT to run /comeback

- If the gap is less than 24 hours, skip it. The session-start hook already shows handoff + commits.
- If Ludvig says "I know what I'm doing, just start coding" — respect that. /comeback is a tool, not a gate.

## Output verbosity

Keep this output structured but COMPACT. Ludvig has dyslexia; walls of text are worse than bullets. Use the format above; don't ramble.
