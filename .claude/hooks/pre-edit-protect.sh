#!/usr/bin/env bash
# .claude/hooks/pre-edit-protect.sh
# Runs BEFORE Edit/Write. Exit 2 blocks the action.

set -u

# Read the tool input from stdin (Claude Code passes JSON)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' | sed 's/.*"\([^"]*\)"$/\1/' || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0  # can't parse — let it through, the action will fail naturally
fi

# 1. Block edits to .env files (secrets)
case "$FILE_PATH" in
  *.env|*.env.*|*/.env|*/.env.*)
    echo "🚫 BLOCKED: Edits to .env files require explicit human action."
    echo "   File: $FILE_PATH"
    echo "   If you need to add a new env var:"
    echo "   1. Add it to .env.example (committed) with a placeholder."
    echo "   2. Add it to the Zod schema in apps/api/src/config.ts."
    echo "   3. Ludvig sets the actual value manually in .env."
    exit 2
    ;;
esac

# 2. Block edits to committed migrations (they are immutable once applied)
case "$FILE_PATH" in
  apps/api/src/db/migrations/*.sql|apps/api/src/db/migrations/*/*.sql)
    # Allow edits if the migration is uncommitted (just generated)
    if git ls-files --error-unmatch "$FILE_PATH" > /dev/null 2>&1; then
      echo "🚫 BLOCKED: This migration is already committed and likely applied."
      echo "   File: $FILE_PATH"
      echo "   Editing applied migrations breaks reproducibility."
      echo "   Instead: generate a NEW migration that does what you need."
      echo "   Run: pnpm drizzle-kit generate"
      exit 2
    fi
    ;;
esac

# 3. Block edits to accepted ADRs (immutable)
case "$FILE_PATH" in
  docs/adr/*.md)
    if [ -f "$FILE_PATH" ]; then
      # Check if the ADR has "Status: Accepted" or similar
      if grep -qiE "^\s*\*?\*?Status\*?\*?\s*:?\s*(Accepted|accepted|ACCEPTED)" "$FILE_PATH" 2>/dev/null; then
        echo "🚫 BLOCKED: This ADR is Accepted and immutable."
        echo "   File: $FILE_PATH"
        echo "   Instead: create a new ADR that supersedes this one."
        echo "   The old ADR's status can change to 'Superseded by ADR-NNNN' via /supersede-adr."
        exit 2
      fi
    fi
    ;;
esac

# 4. Warn (not block) on edits to critical config files
case "$FILE_PATH" in
  .claude/settings.json|CLAUDE.md|.claude/hooks/*.sh)
    echo "⚠️  Editing $FILE_PATH — these changes affect Claude Code's behavior. Make sure you intend this."
    # Not exit 2; Ludvig confirmed via 'ask' permission already
    ;;
esac

exit 0
