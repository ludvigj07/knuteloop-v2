# The Comeback Protocol

A 3 AM, 2-weeks-into-military-leave, "I have an hour, what do I do" guide. Read this when you sit down to work after time away. The Claude `/comeback` skill is the automated version; this is the human-side framing for the same protocol.

---

## Step 0: Don't write code for the first 15 minutes

The single biggest mistake is opening a file and starting to edit. After a leave, your mental model is stale. You will introduce bugs that take longer to fix than the time you "saved" by skipping context-loading.

15 minutes of context-loading saves hours of confused debugging. Trust this even when you don't believe it.

---

## Step 1: Sit down with Claude, run `/comeback`

That's it. The skill handles step 2-5 automatically. Read the output.

If for some reason Claude isn't available, do the manual version below.

---

## Step 2 (manual): Read the latest handoff

```bash
ls -lt docs/handoffs/*.md | head -1
```

Open it. Read the whole thing. Pay attention to:

- "What's in progress" — there's probably uncommitted work
- "Gotchas" — things you knew but already forgot
- "Resume command" — exact next step

This is the most useful 2 minutes you'll spend.

---

## Step 3 (manual): Check what changed while you were away

```bash
git log --since="2 weeks ago" --oneline
```

Read every line. If something says "feat(db): add submissions_v2" — you NEED to know that.

```bash
git status
git diff
```

Are there uncommitted changes? Read the diff. Was this in-progress work, or did something get half-merged?

---

## Step 4 (manual): Make sure the project still builds

```bash
pnpm install            # in case dependencies changed
pnpm typecheck          # tsc errors?
pnpm lint               # lint errors?
pnpm test               # tests pass?
```

If any of these fail, **fixing them is your priority** — not the feature you came back to write. A broken main branch compounds: every subsequent change builds on a broken foundation.

---

## Step 5 (manual): Read any new ADRs

```bash
ls -lt docs/adr/*.md | head -5
```

ADRs are how past-Ludvig (or co-builder Claude) told future-Ludvig "we decided this for these reasons." If new ones appeared, you need to internalize them before working in the affected area.

---

## Step 6: Now decide what you'll do this session

The temptation: "I'll just finish the in-progress thing from the handoff."

Sometimes that's right. Sometimes things have shifted (App Store deadline, a school onboarding got urgent, a security issue surfaced). Ask yourself:

- What does Knuteloop most need from me in the next month?
- Is the in-progress thing still on the critical path, or is it a "would be nice"?
- What's the highest-leverage thing I can ship in this session?

Don't autopilot into the old work just because it's there.

---

## Step 7: Set a SMALL goal for this session

Smaller than you think. "Finish the auth refresh flow" is too big after a 2-week break. "Get one passing test for the auth refresh flow" is right-sized.

Smaller goals = more wins = more momentum. Big goals = "I didn't finish, I'm behind" = morale tax.

---

## Step 8: Pair with Claude actively

Don't have Claude write code while you watch passively. The goal is for YOUR mental model to come back, not just for the codebase to advance.

- Ask Claude to walk you through the diff before approving it.
- When Claude proposes a plan, restate it back to confirm you understand.
- When Claude uses a concept you forgot, ask for the 30-second refresher.

The 4 hours you'd spend pairing this way are worth more than the 6 hours of solo coding you'd have done.

---

## Step 9: End with a handoff

Even if you only got 30 minutes done. Run `/handoff`. Write down:

- What you did
- What's mid-flight
- What you learned (mental notes — they'll be gone in 2 weeks)
- What you'd do next if you had another hour

Future you will thank present you.

---

## Things that are GOING TO bite you after a leave

These are the recurring failure modes. Recognize them as they happen:

- **"I'll just push directly to main — it's a tiny change."** No. The hooks are there for a reason; the PR workflow is there for a reason. Tiny changes break things too.

- **"I don't need to run /backend-review for this."** You do. Especially after a leave. Your mental model is the weak point.

- **"Why does this look so weird? Did someone change the auth flow?"** Read the recent ADRs. Yes, probably.

- **"I'll just regenerate the migration to fix the schema."** Generate a NEW migration. Never edit a committed one — see the rules.

- **"It worked yesterday."** "Yesterday" was 2 weeks ago. Things changed.

- **"I'll skip the test for now, fix it later."** Skipped tests after a leave are bug factories. The compound interest on technical debt is brutal here.

- **"I don't remember why I did this."** This is exactly what ADRs and handoffs are for. Read them. If they don't explain it, write one before continuing.

---

## When you have only 30 minutes

Some sessions are short — a slot of free time during military service. The protocol is the same, just compressed:

1. Run `/comeback` (5 min)
2. Verify it builds (3 min)
3. Pick the SMALLEST possible win you can ship cleanly (15 min coding)
4. Run `/handoff` (5 min)
5. Commit + push the PR (2 min)

A 30-minute session that ships one clean PR is more valuable than a 30-minute session that opens 4 partial fixes you forget about.

---

## When you have more than a week back-to-back

Lucky. Use one of the longer days to:

- Read the entire current state of the codebase end to end
- Run `/backend-review` on the cumulative diff since the last big review
- Write a new ADR if any decisions accumulated implicitly
- Tackle the gnarliest thing on the backlog — the kind that needs uninterrupted focus

Don't waste long days on small-PR work. Save those for the 30-minute slots.

---

## A final note

Knuteloop is a long project. Norway's russetid is a fixed annual deadline; everything else is moveable. The shape of "good progress" is consistency, not intensity. Two solid pairing hours per week for 50 weeks > one heroic 14-hour weekend that breaks production and leaves you unable to debug it for 10 days.

The protocol exists so that "good progress" is achievable even with the constraints. Trust it.
