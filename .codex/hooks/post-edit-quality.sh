#!/usr/bin/env bash
# .claude/hooks/post-edit-quality.sh
# Runs AFTER Edit/Write. Reports issues to Claude as stderr; exit 2 signals "problems found, ask Claude to fix."
# Non-blocking by default (exit 0) for most checks — we report but don't refuse.

set -u

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || exit 0

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' | sed 's/.*"\([^"]*\)"$/\1/' || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

ISSUES_FOUND=0
REPORT=""

append() {
  REPORT="${REPORT}$1
"
  ISSUES_FOUND=1
}

# Only inspect files we care about
case "$FILE_PATH" in
  *.ts|*.tsx|*.sql)
    : # process below
    ;;
  *)
    exit 0
    ;;
esac

# === Backend code checks ===
case "$FILE_PATH" in
  apps/api/src/**)
    # 1. console.log in server code — forbidden by backend rules
    if grep -nE 'console\.(log|info|warn|error|debug)' "$FILE_PATH" 2>/dev/null; then
      append "🟥 console.log/info/warn/error found in $FILE_PATH"
      append "   Server code MUST use the Pino logger (apps/api/src/lib/logger.ts), not console."
    fi

    # 2. sql.raw with template interpolation — SQL injection vector
    if grep -nE 'sql\.raw\(`[^`]*\$\{' "$FILE_PATH" 2>/dev/null; then
      append "🟥 sql.raw() with template interpolation in $FILE_PATH"
      append "   This is a SQL injection vector. Use the parameterized sql\`...\` template instead."
    fi

    # 3. process.env. outside config.ts
    case "$FILE_PATH" in
      */config.ts) ;;  # config.ts is allowed
      *)
        if grep -nE 'process\.env\.[A-Z_]+' "$FILE_PATH" 2>/dev/null; then
          append "🟧 Direct process.env access in $FILE_PATH"
          append "   Use the typed config module (apps/api/src/config.ts) instead of process.env."
        fi
        ;;
    esac

    # 4. Missing tenantContext on routes that touch tenant data
    if echo "$FILE_PATH" | grep -qE 'apps/api/src/routes/'; then
      # Heuristic: if the file mentions schoolId or tenant table imports, it should also use tenantContext
      if grep -qE '(schoolId|submissions|customKnuter|refreshTokens|russenavnAllowlist)' "$FILE_PATH" 2>/dev/null; then
        if ! grep -qE 'tenantContext\(\)' "$FILE_PATH" 2>/dev/null; then
          append "🟧 Route file references tenant data but doesn't import tenantContext middleware"
          append "   File: $FILE_PATH"
          append "   Tenant-scoped routes MUST: .use('*', auth()).use('*', tenantContext())"
        fi
      fi
    fi
    ;;
esac

# === DB schema checks ===
case "$FILE_PATH" in
  apps/api/src/db/schema/**)
    # Check: any pgTable() should have either RLS or a comment explaining why not
    if grep -qE 'pgTable\(' "$FILE_PATH" 2>/dev/null; then
      if grep -qE '\bschoolId\b' "$FILE_PATH" 2>/dev/null; then
        if ! grep -qE '\.enableRLS\(\)' "$FILE_PATH" 2>/dev/null; then
          append "🟥 Schema file defines a tenant-scoped table (has schoolId) but does NOT call .enableRLS()"
          append "   File: $FILE_PATH"
          append "   Every tenant table MUST have .enableRLS() + a tenant policy. See .claude/rules/database.md §1."
        fi
        if ! grep -qE 'tenant_isolation' "$FILE_PATH" 2>/dev/null; then
          append "🟥 Schema has schoolId but no 'tenant_isolation' pgPolicy"
          append "   File: $FILE_PATH"
        fi
      fi
    fi
    ;;
esac

# === Frontend checks ===
case "$FILE_PATH" in
  apps/mobile/**)
    # 1. Raw colors/hex in components (should be design tokens)
    if echo "$FILE_PATH" | grep -qE 'apps/mobile/components/|apps/mobile/app/' && ! echo "$FILE_PATH" | grep -qE 'lib/theme'; then
      if grep -nE "'#[0-9A-Fa-f]{3,8}'|\"#[0-9A-Fa-f]{3,8}\"" "$FILE_PATH" 2>/dev/null; then
        append "🟧 Hex color literal in component file (not in theme.ts)"
        append "   File: $FILE_PATH"
        append "   Move colors to apps/mobile/lib/theme.ts. Components should import colors from theme."
      fi
    fi

    # 2. useEffect for data fetching (anti-pattern)
    if grep -B 1 -A 5 'useEffect' "$FILE_PATH" 2>/dev/null | grep -qE '(fetch\(|axios\.|api\.fetch)'; then
      append "🟧 useEffect + fetch detected in $FILE_PATH"
      append "   Use TanStack Query (useQuery / useMutation) instead. See .claude/rules/frontend.md §5."
    fi

    # 3. Raw TouchableOpacity / TouchableHighlight
    if grep -qE 'TouchableOpacity|TouchableHighlight' "$FILE_PATH" 2>/dev/null; then
      append "🟧 TouchableOpacity/TouchableHighlight in $FILE_PATH"
      append "   Use the Pressable primitive (apps/mobile/components/primitives/Pressable.tsx) for haptic + scale."
    fi
    ;;
esac

# === TypeScript / lint passes ===
# Only run if pnpm is available and we changed a TS file
if command -v pnpm > /dev/null 2>&1; then
  case "$FILE_PATH" in
    *.ts|*.tsx)
      # Run typecheck — but fast, only on the affected package
      AFFECTED_PKG=""
      case "$FILE_PATH" in
        apps/api/*) AFFECTED_PKG="@knuteloop/api" ;;
        apps/mobile/*) AFFECTED_PKG="@knuteloop/mobile" ;;
        packages/shared/*) AFFECTED_PKG="@knuteloop/shared" ;;
      esac

      if [ -n "$AFFECTED_PKG" ]; then
        if ! pnpm --filter "$AFFECTED_PKG" typecheck > /dev/null 2>&1; then
          append "🟧 TypeScript errors in $AFFECTED_PKG after this edit. Run: pnpm --filter $AFFECTED_PKG typecheck"
        fi
      fi
      ;;
  esac
fi

# === Report back to Claude ===
if [ "$ISSUES_FOUND" -eq 1 ]; then
  echo "================================================================"
  echo "  Post-edit quality issues in $FILE_PATH:"
  echo "================================================================"
  echo "$REPORT"
  echo "================================================================"
  # Exit 2 tells Claude these are blocking issues to address before continuing.
  exit 2
fi

exit 0
