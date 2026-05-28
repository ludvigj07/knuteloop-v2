#!/usr/bin/env bash
# .claude/hooks/session-start.sh
# Runs at the start of every Claude Code session.
# Implements the "comeback protocol" — ensures Ludvig (and Claude) have full context
# before any code is written, especially after weeks-long military leaves.

set -u  # treat unset variables as errors, but DO NOT set -e (we want to continue on missing files)

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || exit 0

echo "================================================================"
echo "  Knuteloop v2 — Session Start"
echo "================================================================"
echo ""

# 1. Branch and status
echo "📍 Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$DIRTY_COUNT" -gt 0 ]; then
  echo "⚠️  You have $DIRTY_COUNT uncommitted change(s). Last session may have left work in progress."
fi
echo ""

# 2. CLAUDE.md integrity check (LayerX defense — March 2026 disclosure)
if [ -f CLAUDE.md ]; then
  CLAUDE_MD_DIFF=$(git diff --quiet CLAUDE.md 2>/dev/null; echo $?)
  if [ "$CLAUDE_MD_DIFF" != "0" ]; then
    echo "🔴 CLAUDE.md has uncommitted changes. Review the diff before trusting instructions:"
    echo "   git diff CLAUDE.md"
    echo ""
  fi
fi

for rule_file in .claude/rules/*.md; do
  if [ -f "$rule_file" ]; then
    RULE_DIFF=$(git diff --quiet "$rule_file" 2>/dev/null; echo $?)
    if [ "$RULE_DIFF" != "0" ]; then
      echo "🟡 $rule_file has uncommitted changes — review before relying on its rules."
    fi
  fi
done
echo ""

# 3. Latest handoff
LATEST_HANDOFF=$(ls -t docs/handoffs/*.md 2>/dev/null | head -n 1)
if [ -n "$LATEST_HANDOFF" ]; then
  echo "📋 Latest handoff: $LATEST_HANDOFF"
  HANDOFF_AGE_DAYS=$(( ( $(date +%s) - $(date -r "$LATEST_HANDOFF" +%s) ) / 86400 ))
  if [ "$HANDOFF_AGE_DAYS" -ge 7 ]; then
    echo "   ⏰ Last handoff is $HANDOFF_AGE_DAYS days old. You may want to run /comeback."
  fi
  echo ""
  echo "   --- First 20 lines of latest handoff ---"
  head -n 20 "$LATEST_HANDOFF" | sed 's/^/   /'
  echo "   ----------------------------------------"
  echo ""
else
  echo "📋 No handoff files found in docs/handoffs/. (First session?)"
  echo ""
fi

# 4. Recent commits
COMMIT_COUNT=$(git log --since="2 weeks ago" --oneline 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMIT_COUNT" -gt 0 ]; then
  echo "🔄 Last 2 weeks of commits ($COMMIT_COUNT total):"
  git log --since="2 weeks ago" --pretty=format:"   %h  %ad  %s" --date=short 2>/dev/null | head -n 15
  echo ""
  if [ "$COMMIT_COUNT" -gt 15 ]; then
    echo "   ... and $((COMMIT_COUNT - 15)) more. Run: git log --since=\"2 weeks ago\" --oneline"
  fi
  echo ""
fi

# 5. New ADRs since last session
if [ -d docs/adr ]; then
  ADR_COUNT=$(find docs/adr -name "*.md" -not -name "README.md" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$ADR_COUNT" -gt 0 ]; then
    echo "📐 ADR count: $ADR_COUNT"
    echo "   Latest 3:"
    ls -t docs/adr/*.md 2>/dev/null | grep -v README | head -n 3 | while read f; do
      TITLE=$(head -n 1 "$f" | sed 's/^# *//')
      echo "   - $TITLE"
    done
    echo ""
  fi
fi

# 6. Reminder
echo "💡 Reminders for this session:"
echo "   • If you've been away ≥ 24 hours: run /comeback before coding"
echo "   • Before any DB migration: run /migration-plan"
echo "   • Before declaring a backend PR done: run /backend-review"
echo "   • At session end: run /handoff"
echo ""
echo "================================================================"

exit 0
