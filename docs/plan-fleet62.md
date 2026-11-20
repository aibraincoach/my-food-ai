# Fleet 62 — the demo path: three audit fixes (#1191, #1192, #1193) and the owner's iPhone bugs (#1209, #1207, #1208) (2026-11-20)

You are the coder. You have the filesystem, GitHub, local-stack and Vercel/Supabase access this plan needs. **Production contact is limited to section 6, after the PM's merge order.** Carry it out; do not return it, evaluate it or wait on anyone except where a step says so.

**What this plan is.** The PM's order of 2026-11-20 11:36Z, items 1 and 2. **The sign-in work (item 3) is Fleet 63,** a separate plan, because most of it waits on accounts the owner must create first. **The investor demo is in a few days, so this fleet goes first,** and its PRs merge one at a time as each is ready.

**Rules that apply to every change here:**
- **Rule 5 (Nov 18):** the fix deletes the quiet path. Never add one:
  - no automatic reload or retry;
  - no default that shows a failure as zero or as "nothing";
  - no second route.
  - A **Try again button the person presses** is allowed: it is visible.
- **Rule 4:** test against the local throwaway database. The only production contact is section 6.
- **Wording:** AGY decides every new user-facing string. **Appearance:** the designer decides; #1208's result display is theirs (section 4).

**Shape:**
- **five code PRs, one per issue,** in the order below, unless #1209's diagnosis shows it shares #1191's cause (section 3);
- one docs PR;
- **no full stop between PRs:**
  - when a PR is ready, report it to the PM (section 5) and carry on with the next;
  - a PR merges only on the PM's order for that PR at its exact head;
- **base:** main `2eb5df8904c79c4e4580d78955b496e4cccb472f` (the Fleet 61 report is merged);
- **`FOOD_MATCH_VERSION`** is not bumped: no valid search result changes.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**The only halts are:**
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer;
- #1208 without the designer's proposal (section 4).

**Your own stack, outside the worktrees:** `TEST_PORT_BASE=64260 TEST_PG_PORT=58549 TEST_STACK_DIR=/tmp/mfa-f62s TEST_ENV_FILE=.env.test.fleet62`. **Browser checks run in Playwright's WebKit with an iPhone device profile,** the nearest local stand-in for the owner's Safari. They do not prove the phone; section 7 lists what only the owner can check.

## 1. The order, and why

| # | Issue | What a person sees today | Can it be proven locally? |
|---|---|---|---|
| 1 | **#1209** tapping + on Home makes the controls disappear | cannot start a post: the worst demo failure | partly: a reproduced cause, in WebKit. **The owner's phone is the proof** |
| 2 | **#1191** a failed camera or text-entry download closes it without a word | the tap seems ignored, or the entry vanishes | yes, fully |
| 3 | **#1207** draw the controls before the data | the app is slow to become tappable on open | the order and a local timing, yes. **The phone timing is the owner's** |
| 4 | **#1208** the drink sheet interrupts typing | the text field is covered mid-sentence | the behaviour, yes. **The keyboard and dictation are the owner's** |
| 5 | **#1192** Days hides a failed water and caffeine read | a saved drink silently missing from a day | yes, fully |
| 6 | **#1193** a malformed USDA search becomes a cached empty search | different nutrition, silently, and kept | yes, fully |

**#1209 and #1191 touch the same file** (`src/components/NavigationControls.tsx`), and so may #1207 (`src/app/(tabs)/layout.tsx`). Build them in this order, each on the previous branch's merged main, so they do not conflict. **#1192 and #1193 are independent:** they may be built in parallel at any time.

## 2. #1191, #1192, #1193: the audit fixes

**The issue texts are the specification.** Each has its "Done when" line, and the cited lines are in the Fleet 61 report, `docs/findings/ponytail-audit-2026-11-19.md`.

### 2a. #1191, the camera and text entry (finding P2-01)

**Today:** the rejection handler in `NavigationControls.tsx` closes the entry with no error. Its comment says so on purpose ("A failed fetch closes the entry, so the next tap tries again"). There is no pending view while the file loads.

**The change:**
- **delete that close-on-failure path;**
- the tap opens the entry at once in a loading state;
- a failed load shows a plain explanation and a **Try again** button, which starts a new load **only when pressed.** A success then opens a usable composer;
- **the 1.5-second background prefetch stays.** Its failure must not mark the file as loaded: the next tap starts a real load and shows its outcome.

**Done when** (from the issue):
- on a delayed download, the tap shows the entry opening at once;
- on a failed download, the entry stays open with the explanation and a working Try again;
- a successful retry opens the composer.

**Proof:**
- a WebKit test that delays, then aborts, the composer file's request (Playwright `route`): it checks the pending view, the message, Try again, and a usable composer after the retry;
- a unit test of the load state.

### 2b. #1192, Days and recorded drinks (finding P3-01)

**The change:**
- a failed `intake_logs` page (the first or a later one) makes that day's intake **unavailable,** never zero;
- the month reader returns the error, not a partial success;
- `StoryPlayer` and the month view show the meals they have, plus a plain line that the recorded drinks could not be loaded, with a Try again the person presses;
- **delete** the `emptyIntake` substitution on failure. `emptyIntake` stays only for a successful read with no rows.

**Done when:** the issue's lines.

**Proof:**
- tests that fail the first and a later intake page, for one day and for the month: the meals are kept, the failure is shown and is never zero, and a retry restores the intake;
- one test that a successful empty read still shows "no intake" as today.

### 2c. #1193, USDA search data (finding P5-02)

**The change:**
- `asFoods` checks the envelope. A 200 response without a valid `foods` array is a food-database error of the kind the client already raises for a failed request, and **is not cached;**
- `foods: []` stays an ordinary no-match.

**Done when:** the issue's lines.

**Proof:** unit tests with a fake fetch:
- `{error:"upstream unavailable"}`, `{}`, `{foods:"x"}` and a non-JSON 200 are each an error, with no cache write;
- `foods: []` is a no-match and is cached as today;
- a later valid response is read normally.

**Not done here:** empties already in the production cache that came from malformed responses cannot be told apart from real no-hits. **No production read looks for them.** Say so in the PR.

## 3. #1209 and #1207: the controls

### 3a. #1209, + makes the controls disappear: diagnose first, then fix only what is reproduced

**Owner's report, Nov 20 9:21 AM, iPhone:**
- a Home screenshot with the feed and no tab bar or New post controls;
- the camera froze with the menu showing.

**Not known:**
- which controls vanished;
- whether it happens on every open;
- whether reopening fixes it.

**The planner's hypotheses, each to be tested in WebKit with the iPhone profile, none assumed:**
1. **A stale download after a deploy.** The home-screen app stays open across a deploy. The old page then asks for a composer file of the previous build, which may no longer exist, so the load fails. #1191's silent close then closes the entry. Test it: load build A, then serve build B from the same port, and tap +.
2. **The layout's `<Suspense fallback={null}>`** in `src/app/(tabs)/layout.tsx` wraps the Sidebar, the listeners and `NavigationControls` together. While any of them suspends, the tab bar and + render as nothing.
3. **The Plus menu and the capture sheet's layering, or the camera stream,** left in a state where neither is usable (see #999, the black camera).

**For each hypothesis, report one of three results:**
- **reproduced,** with the steps;
- **not reproduced,** with what was tried;
- **ruled out,** with why.

**Fix only reproduced causes.**
- **If hypothesis 1 holds,** #1191's change already turns the silent close into a visible failure. For a missing file of an older build, the message tells the person to reopen the app, with a button that reloads **when pressed.** No automatic reload: rule 5.
- **If the cause is #1191's alone,** #1209 is fixed by #1191's PR. Say so and send no separate PR.
- **If nothing reproduces, there is no speculative fix.** Report the attempts; #1209 stays open for the owner's phone, with the questions in section 7.

**Done when** (from the issue), on his iPhone from a cold open:
- tapping + shows New post with all its controls;
- closing it brings the tab bar back;
- this works in the home-screen app and in Safari.

**The owner checks this** (section 7). Locally: each reproduced case gets a WebKit test that fails on main and passes on the branch.

### 3b. #1207, draw the controls before any data

**The change:** the header, the + button, the Today ring and the tab bar are rendered and tappable **before** any feed or day data arrives:
- they are not inside a Suspense boundary that waits on data or on a sibling;
- the Today ring draws empty, then fills in;
- tapping + while the feed is still loading opens New post.

The coder decides the structure. Hypothesis 2 above is the same boundary: if 3a changes it, 3b builds on that.

**Done when** (from the issue):
- the controls are drawn and tappable before the feed data;
- + works while the feed loads;
- the time from open to the first tappable control is measured and written down.

**Proof and measurement:**
- **locally:** a WebKit test that holds every Supabase data response for 5 seconds and taps + at 1 second. It passes on the branch and fails or shows the gap on main;
- **a timing table,** main versus branch on the local built app: cold open to first tappable control, with and without the 5-second hold;
- **production:** one cold load after the merge (section 6);
- **the phone's own time** is the owner's to observe (section 7).

## 4. #1208, the drink sheet that interrupts typing

**The behaviour**, which the coder builds:
- when the drinks are identified while the person is typing or dictating:
  - focus stays in the field;
  - the text is unchanged;
  - nothing covers the field;
  - no sheet opens on its own;
- **the result is offered** where it does not cover the field, and opens only when the person taps it;
- what the sheet shows once opened ("2 drinks", "Tap one to change it", Post) is unchanged.

**How the result appears is not decided. The designer proposes it** (the issue says so).
- **The PM asks the designer now.** The coder builds #1208 after #1207, using the designer's proposal.
- **If there is no proposal by then,** build the behaviour with the smallest non-covering element from existing components. Report it to the PM as "behaviour done, appearance awaiting the designer"; the designer's later proposal is its own follow-up. **No second display path is kept:** the follow-up replaces this one.

**Done when** (from the issue):
- a person can type or dictate without the screen changing, the keyboard closing or text being lost when the drinks are identified;
- the result does not cover the field being typed in;
- the person chooses when to open it;
- this is checked on a real iPhone.

**Proof:**
- **locally**, a WebKit test with the fake Meta model: focus the description, type, resolve the identification mid-typing. It checks focus, the value and the caret, that no sheet opened, and the field's box against the result's box (not covering). It then taps the result and checks the sheet;
- the keyboard and dictation are the owner's (section 7).

**Related:** #693 (speech lost when a drink photo finished identifying during a recording) is **not in scope.** If the same change also keeps dictated text, report that as evidence on #693; do not close it.

## 5. Checks, review and the per-PR report

**Per PR:**
- **worktree** `/tmp/mfa-f62-<issue>` from `origin/main` with `npm ci`, branch `fix62/<issue>-<word>`;
- `npx tsc --noEmit`, and `npx eslint` on the changed files;
- the new tests, and every test file that covers the changed files;
- **both suites once,** with the built app started (10 minutes each), compared with main's counts;
- **review:**
  - the reviewer seat, given the code and the issue, not this plan's conclusions;
  - then one PPLX review (AGY if PPLX is unavailable);
  - **AGY checks every new user-facing string;**
- **the report to the PM, one message per PR:**
  - the number, branch and final head (40 characters), checks, suites against main and reviews;
  - what was proven locally, and what is left for the owner's phone;
  - **for #1209, the result of each hypothesis.**

**Docs PR:** branch `docs/fleet62`, with this plan unchanged as `docs/plan-fleet62.md`. It merges after the last code PR.

## 6. Production (after each PM merge order only)

**After each merge:**
- the merge deployment is READY;
- `/api/health` returns 200, once.

**After #1207's merge:** one cold load of Home in WebKit with the iPhone profile, signed in as the fleet's test account (never the owner's), recording the time to the first tappable control. **Once, no repeat** (rule 4).

**Nothing else touches production.** No data is written or repaired.

## 7. What the owner checks on his iPhone (the PM relays it, in plain words)

After the merges, in the home-screen app and in Safari:
1. **Open the app cold and tap +.** Does New post open with all its controls? Close it: is the tab bar back? (#1209, #1207)
2. **Open the app while the phone is on a slow connection.** Can you tap + before the meals appear? (#1207)
3. **Photograph a drink and start typing, or dictating, a description.** Does the keyboard stay up and your text stay, with nothing covering it, until you choose to open the drinks? (#1208)
4. **If + ever fails again:** what did the screen say, and did reopening the app fix it? (#1209)

## 8. Stop

**When the last code PR and the docs PR are reported, send the PM one closing message:**
- every PR with its merged or unmerged state and head;
- #1209's diagnosis;
- the owner's checks still open;
- anything void.

**Then stop.**
