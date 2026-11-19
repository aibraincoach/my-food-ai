# Fleet 61 — #1186: the first full ponytail audit of My Food AI, read-only and local (2026-11-19)

You are the coder. You have the filesystem, GitHub (read, plus the one docs PR) and local-stack access this plan needs. **Nothing here touches production, and no model or provider is called.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-19 12:16Z. The owner asked whether a full review for minimal code, no fallbacks, bloat and duplication was ever done. **It was not:** Fleet 24 A8 (Nov 16) applied only Scale, Speed and Lean, read 41 of 192 mapped files, and left most tests and the model, nutrition and database internals unaudited. This fleet is the first full pass.

**Shape:**
- one fleet, read-only: **no code change, no fix, no issue filed** by the coder;
- eleven bounded passes (section 3), each with its own coverage line;
- one interim message to the PM after the demo-path passes (section 5.2), which does not stop the work;
- one docs PR holding the report (section 6), then **one stop**;
- **base:** main `b808dc5057bd71a3df248be29298d2a38747578b`. Every finding cites this commit's paths and lines.

**Why one fleet, not several.** The pass is read-only and the passes are independent, so they can run side by side. The work is bounded by the coverage rule, not by a promise to finish: a pass that runs out of room declares what it did not read, and no full-coverage claim is made that was not earned.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no fix and no new audit.

**The only other halts are:**
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer, production, a model or a provider (do not do it; report it).

## 1. What the audit is

**Method:** the ponytail-audit skill (DietrichGebert/ponytail at `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`, `skills/ponytail-audit/SKILL.md`; the text is saved in `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/side-issues-2026-11-19/ponytail-sources.json`). **Read it before starting.** All six axes apply, in its order of importance:
1. **Bug:** wrong result, crash, missed edge case, callers that disagree with what a function returns, the same rule applied differently in two places.
2. **Risk:** security holes and data loss.
3. **Scale:** what fails at the expected load (section 2).
4. **Missing test:** risky logic with no test that fails when it breaks.
5. **Speed:** big slowdowns.
6. **Lean:** delete, reuse, stdlib/native, yagni, merge, split.

**The owner's no-fallback rule is an explicit finding class** (rule 5 of Nov 18: "When code is replaced, delete the old path. Don't keep legacy code alongside the new code, and don't add fallbacks that quietly retry or switch to another route. If something fails, it fails visibly and gets fixed."). Each of these is a finding, tagged `rule 5`:
- a quiet retry (a loop, a second attempt or a backoff the user never sees fail);
- a silent default that hides a failure (an unknown value shown as zero, an empty list returned on error, a missing number read as a real one);
- a swallowed error (an empty or log-only `catch`, a `.catch(() => …)` that carries on, an ignored `{ error }` from Supabase);
- an alternate or legacy route kept next to its replacement (an old code path, flag, env switch, second provider, or "if the new way fails, try the old way").

**A default is not a finding when** it is the documented, visible value and no failure hides behind it. Give the concrete case either way.

**DRY:** two helpers doing one job are a finding. **The fix names the one path to keep and deletes the other.** "Keep both" is never a fix.

**Every finding needs a concrete case** ("this input or situation leads to this wrong result"). No case, no finding. No style taste, no "consider", no vague worries.

**Before calling anything unused, grep the whole tree for it,** including tests, fixtures, config, `package.json` scripts, and string or dynamic references. **Never dead by convention:**
- Next.js `page`, `layout`, `route`, `loading`, `error` and `not-found` files;
- migrations (they are history);
- test files picked up by the test globs in `package.json`.

## 2. Load, exposure and what is not a finding

**Assumed load** (state it in the report; correct it from the config if the config says otherwise):
- the owner and a handful of accounts;
- an investor demo in a few days with several viewers at once;
- the worker at concurrency one with the minute wake.

**Exposure tiers.** Each finding carries one. **Rank within each ponytail group by tier first,** because the demo is close:
- **T1, the demo path:** sign-in, posting a photo, the analysis, the meal card and detail, the feed, Home, Days and Profile, on a normal account.
- **T2, less-used user features:** corrections, leftovers, drinks, barcode, label, voice, saved meals, push, the share page.
- **T3, owner and admin only:** admin, MCP, the agent routes.
- **T4, not on a live path:** operator scripts, migrations and rollbacks, tests and the test harness.

**Owner decisions, not findings** (record a hit as "decision, not a finding" with its source):
- CAPTCHA is off by owner ruling;
- the Vercel protection-bypass secret is permanent fleet test access. **Never propose removing it;**
- models are Meta only. USDA FoodData Central is a database, not a model;
- a shortcut marked with a `shortcut:` or `ponytail:` comment that names its limit, unless the assumed load already crosses it.

**Already known.** Before reporting, search open and closed issues with `gh issue list --state all --search …` (read-only).
- **An open issue that covers a finding:** report the finding with that number and propose no new item.
- **A closed issue whose fix the finding shows did not hold:** say so.
- **The matcher's wrong-record recurrence is open under #990.** Do not re-plan it; report only what is new.

**Fleet 24 A8's eleven findings** (`docs/findings/performance-audit-2026-11-16.md` on main): check each once at the base commit and mark it *still holds*, *fixed (by #…)* or *changed*. They count toward coverage only for the files actually re-read.

## 3. The passes

Each pass reads its own scope and writes one pass file. **The coverage list for each pass is generated from `git ls-tree -r --name-only b808dc50 -- <scope>`,** so no file is silently left out. Every file gets one mark:
- **read in full;**
- **skimmed** (say what was looked at);
- **not read.**

The counts below are tracked files and newline counts at the base commit (937 files, 59,386 lines across `src`, `scripts`, `tests` and `supabase`).

| Pass | Scope | Files / lines | Tier | Depth |
|---|---|---|---|---|
| P0 Map | `package.json`, `package-lock.json` (the dependency list only), `next.config.ts`, `vercel.json`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`, `README.md`, `src/` root file, the cron and worker wiring | ~20 | all | full. Writes the entry-point list (every route, job and CLI command) and the end-to-end flows the other passes follow |
| P1 Auth and access | `src/lib/auth`, `src/lib/supabase`, `src/lib/admin`, `src/lib/limits`, `src/app/(auth)`, `src/app/auth`, `src/app/admin`, `src/app/mcp`, `src/app/api/agent`, `src/lib/agents`, `src/app/api/profile`, `src/lib/profile`; **plus every RLS policy, grant and `security definer` function in `supabase/migrations`, read as the final schema** | ~40 / ~1.3k, plus the policies | T1, T3 | full. Trace that every route checks its user before it reads or writes, and that one account cannot read or change another's data |
| P2 Screens | `src/app/(tabs)`, `src/app/profile`, `src/app/days`, `src/app/p`, `src/app/posts`, `src/app/shell`, the `src/app` root files, `src/components`, `src/lib/theme`, `src/lib/ui`, `src/lib/time`, `src/lib/location`, `src/lib/audio` | ~140 / ~7.3k | T1, T2 | full |
| P3 Posts, API and media | every `src/app/api/*` route not in P1, P4 or P5, `src/lib/posts`, `src/lib/media`, `src/lib/intake`, `src/lib/push`, `src/lib/search` | ~110 / ~6.0k | T1, T2 | full. Trace upload → post → job → ready → feed, and each write's order and transaction |
| P4 Worker, jobs and model pipeline | `src/lib/worker`, `src/lib/queue`, `src/lib/pipeline`, `src/lib/meta`, `src/lib/prompts`, `src/lib/trace`, `src/lib/health`, `src/app/api/jobs`, `src/app/api/health`, `src/app/api/transcribe` | ~65 / ~3.3k | T1 | full. Read with care: claims, leases, retries, timeouts and what the user sees when the model fails |
| P5 Nutrition and matcher | `src/lib/fdc`, `src/lib/nutrition`, `src/app/api/fdc`, `src/app/api/barcode`, `src/app/api/label`, `src/app/api/drinks` | ~30 / ~1.9k | T1, T2 | full. Units, rounding, unknown-versus-zero, and the same rule applied in two places |
| P6 Database | `supabase/migrations` (the final state of every table, index, trigger and function), `supabase/rollback`, `supabase/rollbacks` | 110 / ~5.9k | T4, T1 through the schema | full for the final schema. Earlier, superseded migration bodies may be skimmed. **Both `rollback/` and `rollbacks/` exist: say which is used, and whether one is a duplicate** |
| P7 Scripts | `scripts/` (root, `lib`, `numbers`, `retention`, `review`); `scripts/fixtures` skimmed, binaries not read | 94 / ~8.7k | T4 | full for code. Look hardest at the tools that write production data: their guards, transactions, snapshots and put-back |
| P8 Tests | `tests/` root, `tests/db`, `tests/integration`, `tests/fixtures`; `tests/fake-meta` code read, its recorded data skimmed | 337 / ~25.6k | T4 | full for test code. A test that cannot fail, a duplicate test, a dead test, a sleep-based wait, or a harness fallback that hides a failure is a finding. **The Missing-test axis for P1–P7 uses this pass's map** |
| P9 Debt ledger | the ponytail-debt grep (`git grep -nE '(#\|//\|/[*]) ?(shortcut\|ponytail):'`), and a second ledger for `TODO\|FIXME\|HACK\|XXX` | whole tree | — | the skill's ledger format, with the `no-trigger` tag |
| P10 Cross-pass | a duplication sweep and an unused-code sweep across `src` and `scripts` | `src`, `scripts` | — | see below |

**About P10.** These two candidate finders may run once each, in a scratch worktree, **without adding anything to `package.json` or the lockfile**:
- a dead-export tool (for example `knip`);
- a copy detector (for example `jscpd`);
- `npm audit --omit=dev` for known-vulnerable runtime dependencies.

Record each tool's exact version and command. **A tool hit is a candidate, not a finding,** until it passes the grep rule of section 1 and has a concrete case.

**Local execution** is allowed only to confirm a concrete case:
- your own stack outside the worktree: `TEST_PORT_BASE=64160 TEST_PG_PORT=58449 TEST_STACK_DIR=/tmp/mfa-f61s TEST_ENV_FILE=.env.test.fleet61`;
- the fake Meta model and `fdc_cache` fixtures only. **No real model, USDA or other provider call;**
- the unit suite may run once on the base commit to list tests that fail or flake on main.

Each finding says **"Confirmed by: reading"** or **"Confirmed by: local run `<command>`".**

**The passes may run in parallel** (subagents or not, the coder decides). Each writes `/home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/fleet61/passes/P<n>.md` with its findings and its coverage list.

## 4. The form of each finding

This is the skill's four parts, with five tags added:

```
N. **<plain title>** (`path:Lstart-Lend` at b808dc50)
   - Tier: T1 | T2 | T3 | T4 · Axis: bug | risk | scale | test | speed | lean · rule 5: yes | no · Issue: #… | none · Confirmed by: reading | local run `<cmd>`
   - What this is: …
   - Problem: … (the concrete case)
   - Fix: the smallest fix that works; prefer deleting code; name the one path kept for any DRY fix
   - If we skip it: … what the demo, a viewer or the owner would see
```

**Very simple English, as the skill asks.** Explain a technical term the first time it is used.

**Public repository rules:**
- no secrets;
- no account, user or meal identifiers;
- no owner meal content.

**A secret found in the code** is reported by its path and kind only, never its value. Send it to the PM privately at once, as its own `rig send`, so it can be rotated.

## 5. Verification and the interim message

1. **The reviewer seat** checks every Must-fix and Should-fix finding against the code at the base commit. It gets the pass files and the code, not this plan's expectations.
   - For each finding it rules **holds**, **does not hold** (with its reason), or **wrong tier or group**.
   - A finding that does not hold is dropped from the report and counted under "dropped in verification".
2. **The interim message.** When P0–P5 are written and verified, send the PM one message: the verified Must-fix findings of tiers T1 and T2 so far, in the section 4 form. Then carry on. **This is not a stop.**

## 6. The report and the docs PR

**Branch** `docs/fleet61-ponytail-audit` from `origin/main`. **Files:**

**`docs/findings/ponytail-audit-2026-11-19.md`**, in the skill's output order:
- `What this repo does:` in two or three sentences, and the load assumed;
- **the ranked findings**, at most 20 in the headline list, numbered across groups:
  - **Must fix**, then **Should fix**, then **Nice to have**;
  - within each group, by tier first, then by the skill's axis order;
- **the rest**, in the same form under "Further findings, by pass", so nothing verified is lost. Say how many;
- Fleet 24 A8's eleven findings, each marked *still holds*, *fixed* or *changed*;
- the debt ledgers (P9);
- the decisions-not-findings list;
- dropped in verification: the count, with one line per finding dropped;
- `Verdict:`, `Lean: -<N> lines, -<M> dependencies possible.` and `Not checked:`. `Not checked:` names every area marked skimmed or not read, and states that production behaviour, real model output and real USDA responses were not run.

**`docs/findings/ponytail-audit-2026-11-19-coverage.md`:**
- **every one of the 937 files** with its mark;
- per pass and in total: lines read in full ÷ lines in scope.

**`docs/plan-fleet61.md`:** this plan, unchanged.

**No code file changes.** Docs-only, so no PPLX, AGY or Codex review is required.

## 7. The proposed backlog items

**At the end of the report:** "Proposed backlog items, most important first". One per verified Must-fix and Should-fix finding that has no open issue; findings that must change together are grouped. **Each item has:**
- a plain title;
- one or two sentences on what goes wrong and who sees it;
- the finding numbers it covers;
- its tier.

**The coder files no issues.** The PM files them; a finding is planned only after it has its own GitHub issue.

## 8. Stop

**Report to the PM in one message:**
- the docs PR's number, branch and final head (40 characters);
- the counts: findings per group and tier, `rule 5` findings, dropped in verification;
- **the coverage:** lines read in full of 59,386, and the areas not read;
- the proposed backlog list, as titles in order;
- anything void;
- **the merge order: the docs PR alone.**

**Then stop.** No fix starts from this fleet.
