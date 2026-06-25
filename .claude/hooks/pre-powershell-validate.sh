#!/usr/bin/env bash
# .claude/hooks/pre-powershell-validate.sh
# Runs BEFORE every PowerShell tool use. Exit 2 blocks the command.
#
# WHY THIS EXISTS
# The CRITICAL-RULE guards (deny/ask in settings.json + pre-bash-validate.sh)
# were written only for the *Bash* tool. On Ludvig's Windows machine the primary
# shell is the *PowerShell* tool, which those guards do NOT cover — so e.g.
# `git push origin main` run via PowerShell would sail straight through. This
# hook ports the same protections to PowerShell so "stay on a branch" is a
# guarantee no matter which shell Claude reaches for.
#
# THREAT MODEL: (a) Claude making an honest mistake while running autonomously,
# and (b) prompt-injection (the LayerX class). It is NOT a sandbox against a
# determined operator — PowerShell can express anything — but it closes the
# obvious and the common-injection vectors, and that is what the branch-as-safety
# -net model relies on.
#
# DESIGN: most checks are shell-agnostic (git/drizzle/psql/npm), a few are
# PowerShell-specific (Remove-Item, Invoke-WebRequest, Get-Content, -EncodedCommand).
# Patterns are deliberately narrow — they target catastrophic actions only, so
# routine PowerShell (Get-ChildItem, pnpm test, git status) never trips them.

set -u

INPUT=$(cat)

# --- Robust command extraction ------------------------------------------------
# Prefer a real JSON parse (node is always present in this repo) so that an
# embedded quote cannot truncate the command string and hide a dangerous tail
# from the regexes below — a real bypass in the grep-only approach. Fall back to
# grep/sed only if node is somehow unavailable.
COMMAND=$(printf '%s' "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const o=JSON.parse(s);const c=(o.tool_input&&o.tool_input.command)||o.command||"";process.stdout.write(String(c));}catch(e){}});' 2>/dev/null)
if [ -z "$COMMAND" ]; then
  COMMAND=$(printf '%s' "$INPUT" | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:[[:space:]]*"\(.*\)"$/\1/' | head -n 1)
fi
[ -z "$COMMAND" ] && exit 0

block() { echo "🚫 BLOCKED (PowerShell guard): $1" >&2; echo "   Command: $COMMAND" >&2; exit 2; }

# PowerShell is case-insensitive for cmdlets/paths — match against a lowercased copy.
LC=$(printf '%s' "$COMMAND" | tr '[:upper:]' '[:lower:]')
# `grep -qE --` so a pattern that begins with a dash (e.g. '--read-only') is read
# as a pattern, not parsed as a grep option. Without the `--`, such a call errors
# out and grep returns non-zero, silently breaking the carve-out it guards.
has() { printf '%s' "$LC" | grep -qE -- "$1"; }

# 1) git push to main / force-push (shell-agnostic) ----------------------------
if has 'git(\.exe)?[[:space:]]+push'; then
  if has 'origin[[:space:]]+main([[:space:]]|$|:)|:main([[:space:]]|$)|[[:space:]]-f([[:space:]]|$)|--force'; then
    block "Pushing to main or force-pushing is not allowed. PRs only; Ludvig merges via GitHub."
  fi
fi

# 2) drizzle-kit push — bypasses migrations, banned outside a local DB ----------
if has 'drizzle-kit[^;&|]*push'; then
  block "'drizzle-kit push' is not allowed. Use 'drizzle-kit generate' + 'drizzle-kit migrate'."
fi

# 3) psql against production / Aiven without an explicit read-only flag ---------
if has 'psql(\.exe)?[[:space:]].*(aivencloud|production|[[:space:]]prod([[:space:]]|$))'; then
  if ! has '--read-?only'; then
    block "psql to a production/Aiven target without --read-only. Use a migration for writes."
  fi
fi

# 4) catastrophic recursive delete ---------------------------------------------
#   Remove-Item -Recurse -Force (+ rm/del/rmdir/rd aliases) aimed at a drive
#   root, the home dir, a parent path, or a wildcard. Local subdir deletes pass.
if has 'remove-item|(^|[^a-z0-9])(ri|rm|del|rd)([^a-z0-9]|$)|rmdir'; then
  if has '(-recurse|[[:space:]]-r[[:space:]]|/s)' && has '(-force|[[:space:]]-fo([[:space:]]|$)|[[:space:]]-f([[:space:]]|$)|/q|/f)'; then
    if has '([a-z]:\\?($|[[:space:]]|"|'\'')|[[:space:]]/($|[[:space:]])|~|\$home|\$env:userprofile|\$env:systemroot|\.\.|[[:space:]]\*([[:space:]]|$))'; then
      block "Recursive force-delete targeting a root / home / parent / wildcard path."
    fi
  fi
  if has 'rm[[:space:]]+-[a-z]*r[a-z]*f|rm[[:space:]]+-[a-z]*f[a-z]*r'; then
    if has '[[:space:]](/|~|\.\.)'; then
      block "rm -rf targeting root / home / parent."
    fi
  fi
fi

# 5) network egress to non-allowlisted hosts (LayerX exfil / injection defense) -
if has 'invoke-webrequest|invoke-restmethod|(^|[^a-z0-9])(iwr|irm|curl|wget)([^a-z0-9]|$)|start-bitstransfer|net\.webclient|downloadstring|downloadfile|system\.net\.http'; then
  if ! has 'localhost|127\.0\.0\.1|registry\.npmjs\.org|github\.com/anthropics'; then
    block "Network request to a non-allowlisted host. If you need an external resource, ask Ludvig to fetch it."
  fi
fi

# 6) obfuscated execution — encoded commands, or iex of downloaded content ------
if has '\-e(nc|ncodedcommand)([[:space:]]|$)'; then
  block "Encoded/obfuscated PowerShell (-EncodedCommand) is not allowed — an injection-evasion vector."
fi
if has 'invoke-expression|(^|[^a-z0-9])iex([^a-z0-9]|$)'; then
  if has 'downloadstring|invoke-webrequest|invoke-restmethod|(^|[^a-z0-9])(irm|iwr)([^a-z0-9]|$)|frombase64string'; then
    block "Invoke-Expression of downloaded/encoded content is not allowed."
  fi
fi

# 7) reading .env via the shell — secrets belong in the typed config module -----
if has '(get-content|(^|[^a-z0-9])(gc|cat|type|gi)[[:space:]]|get-item)[^;&|]*\.env'; then
  block "Reading .env via the shell is not allowed. Env vars go through the typed config module."
fi

# 8) npm publish ---------------------------------------------------------------
if has 'npm[[:space:]]+publish'; then
  block "'npm publish' pushes a package public. Not allowed via Claude."
fi

# 9) eas submit to production — warn loudly, do not block (Ludvig may have asked)
if has 'eas[[:space:]]+submit.*--profile[[:space:]]+production'; then
  echo "⚠️  WARNING: 'eas submit --profile production' uploads to the stores (money + review). Confirm with Ludvig." >&2
fi

exit 0
