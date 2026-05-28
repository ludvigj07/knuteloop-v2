#!/usr/bin/env bash
# .claude/hooks/pre-bash-validate.sh
# Runs BEFORE every Bash tool use. Exit 2 blocks the command.

set -u

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/' | head -n 1)

if [ -z "$COMMAND" ]; then
  exit 0
fi

# 1. drizzle-kit push against non-local DB
if echo "$COMMAND" | grep -qE 'drizzle-kit.*push'; then
  if [ -n "${DATABASE_URL:-}" ]; then
    if echo "$DATABASE_URL" | grep -qE '(aivencloud\.com|prod|production|staging)'; then
      echo "🚫 BLOCKED: 'drizzle-kit push' on non-local DATABASE_URL."
      echo "   DATABASE_URL appears to point to: production-ish target."
      echo "   'push' bypasses migrations and can destroy data."
      echo "   Use 'drizzle-kit generate' + 'drizzle-kit migrate' instead."
      exit 2
    fi
  fi
fi

# 2. psql against production
if echo "$COMMAND" | grep -qE '^psql .*aivencloud'; then
  if ! echo "$COMMAND" | grep -qE -- '(--read-only|-c "SELECT)'; then
    echo "🚫 BLOCKED: psql to Aiven without --read-only flag."
    echo "   For read-only inspection: psql ... --readonly"
    echo "   For writes, use a migration, not direct psql."
    exit 2
  fi
fi

# 3. git operations on main
if echo "$COMMAND" | grep -qE 'git push.*origin.*main|git push.*-f|git push.*--force'; then
  echo "🚫 BLOCKED: Pushing to main or force-pushing is not allowed via Claude."
  echo "   PRs only. Ludvig merges via GitHub UI."
  exit 2
fi

# 4. Bulk destructive operations
if echo "$COMMAND" | grep -qE 'rm -rf (/|~|\.\./)'; then
  echo "🚫 BLOCKED: Suspicious rm -rf path."
  echo "   Command: $COMMAND"
  exit 2
fi

# 5. Network requests to unexpected hosts (LayerX defense — Claude shouldn't curl arbitrary URLs)
if echo "$COMMAND" | grep -qE '^(curl|wget) '; then
  # Only allow known-safe hosts in the command
  if ! echo "$COMMAND" | grep -qE '(localhost|127\.0\.0\.1|registry\.npmjs\.org|github\.com/anthropics)'; then
    echo "🚫 BLOCKED: curl/wget to non-allowlisted host."
    echo "   Command: $COMMAND"
    echo "   If you need an external resource, ask Ludvig to fetch it."
    exit 2
  fi
fi

# 6. Reading .env via cat/less/head/tail
if echo "$COMMAND" | grep -qE '^(cat|less|more|head|tail|bat) .*\.env'; then
  echo "🚫 BLOCKED: Reading .env files via shell is not allowed."
  echo "   Env vars should only be accessed through the typed config module."
  exit 2
fi

# 7. eas submit to production without confirmation
if echo "$COMMAND" | grep -qE 'eas submit.*--profile production'; then
  echo "⚠️  WARNING: 'eas submit --profile production' uploads to the App Store / Play Store."
  echo "   This costs money and triggers store review. Confirm with Ludvig before running."
  # Don't block — Ludvig may have asked for it. But warn loudly.
fi

exit 0
