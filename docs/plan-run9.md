# My Food AI — build plan, Fleet 9 (round-5 frames: drinks #289, capture modes #290, remove and redo #291; visual pass #193)

You are the coder. Written Tue 2026-11-03 ~11:40 WIB (04:40 UTC). All work is in `aibraincoach/my-food-ai`. Every time is WIB (UTC+7).

## Stops: zero

**Start:** begin item 0 the moment the last Run 8 code PR (#334–#342) has merged. **This plan is the merge order for its code PRs.** RT approved this on Nov 3 ~11:35 WIB, in reply to the planner: "Plan is the merge order", and "Start after Run 8, 23:59 holds". As in Run 8, this overrides the named-head rule for Fleet 9 only. The coder merges each Fleet 9 code PR at the exact head the reviewer cleared with `BLOCKERS: NONE`, in ascending PR number. The coder applies migration 0036 on production immediately before merging the PR that carries it. Nobody sends a further order.

**Deadline (the 23:59 freeze holds):** every code PR is clean by **23:30**, merged and checked on production by **23:55**. A PR not clean by 23:30 is not merged and is reported not done. Nothing waits on it.

## What ships, and the cut order

Run 8 finishes by 22:30, so Fleet 9 has about 90 minutes. All five PRs are built at once, and each is cut whole if it is not clean by 23:30. **Cut order, first to go:** item 5 (visual pass rounds 1–4, which stays a docs list of differences with no fixes), then item 4 (drink sheet and quick tap), then item 3 (soft delete with Undo and Recently deleted), then item 2 (capture modes). Item 1 (the cola caffeine on the card) is never cut.

**Not in Fleet 9 at all** (no time before the freeze): frames 5b, 5c and 5d, the composer drink card shown before posting. The coder files them as one issue in item 6.

| # | Backlog | Ships | Lane | Branch | Cut |
|---|---|---|---|---|---|
| 0 | — | This plan committed in a docs PR | coder | `run9/docs` | never |
| 1 | #289 | Feed card shows each drink's caffeine (5a, 5e) | A | `run9/drink-card` | never |
| 2 | #290 | Mode strip Text · Photo · Barcode, Barcode icon and scan view, hint copy (5h–5j) | B | `run9/capture-modes` | 4th |
| 3 | #291 | Delete sheet copy, soft delete with Undo and Recently deleted, photo and correction menus, "edited" (5k–5o) | C | `run9/remove-redo` | 3rd |
| 4 | #289 | Six-tile drink sheet, quick tap with Undo, caption field (5f, 5g) | D | `run9/drink-sheet` | 2nd |
| 5 | #193 | List of differences between rounds 1–4 and the live app | E | docs only, on `run9/docs` | 1st |
| 6 | — | Report, issues filed, merges, production checks | coder | — | never |

## Facts checked by the planner (Tue 2026-11-03, 04:29–04:40 UTC)

- Main is `58d127b999163bfb8212fa8145482ae875ed2276`. Check: `git log -1 origin/main`.
- Run 8 PRs #334–#342 and docs #332/#333 are open. Check: `gh pr list --state open`. Run 8 adds migration 0035, so Fleet 9's migration is **0036**. Check: `ls supabase/migrations` (last on main is 0034) and `docs/plan-run8.md` item 2.
- The cola path:
  - A photographed drink is an item. `isDrinkItem` (`src/lib/intake/drinks-from-items.ts:30`) accepts it by FDC category ("soft drinks" is in `BEVERAGE_CATEGORIES`, line 6).
  - `drinksFromItems` (line 37) reads caffeine only from nutrient 1057 with `basis === 'portion'` and never guesses a missing value.
  - In `PostCard.tsx` (around line 75), `hasDrink` is true only when the drink source is `'sheet'`. A photo drink therefore renders as a meal, and its summary comes from the meal branch of `summaryLine` (`src/lib/posts/summary-line.ts`).
  - That meal branch appends `· N ml drank · N mg caffeine` at the very end, after kcal, macros, water and leftovers, and only when `caffeineMg > 0`.
  - Check: `git show origin/main:` on both files.
- The delete sheet copy is "Its photos and numbers are removed. This cannot be undone." (`src/components/DeletePostSheet.tsx`, line 19). A delete is a hard delete through `delete_post` (`supabase/migrations/0030_delete_and_remove.sql:68`). No `deleted_at` exists anywhere in `src` or `supabase`. Check: `git grep deleted_at origin/main`.
- `FirstRunHint.tsx` already has a `modes` hint with the copy "Swipe for Barcode · the camera reads packs too". Check: `git show origin/main:src/components/FirstRunHint.tsx`.
- `ModeStrip.tsx` orders `["photo","barcode","text"]` (line 6). Swiping works through `useModeSwipe`. Check: same.
- The carousel already gives a leftovers slide a ··· menu (`Carousel.tsx`, `data-removal-menu`) that calls `DELETE /api/posts/{id}/media?media_id=`. `Thread.tsx:56` offers "Remove this correction", which calls `POST /api/posts/{id}/comments/{commentId}/revert`.
- `src` has 56 `.from('posts')` reads. Check: `git grep -n -E "from\(['\"]posts['\"]\)" origin/main -- src | wc -l`.

## Premises (unchecked; verify before acting; the report says which were false)

- **P1.** The Nov 2 cola post's item has nutrient 1057 with portion basis, so its caffeine reached `itemDrinks`. If so, the defect is only where and whether the card shows it. Verify by running this read-only query: `select id,name,portion_text from post_items where name ilike any(array['%cola%','%coke%']) order by created_at desc limit 3`, then look for 1057 in that item's stored nutrients and in `item_drinks`/`intake_logs` for its id. **If 1057 is missing,** item 1 also adds the fallback in its step 3. That fallback is the decided fix in both cases, so the card shows caffeine either way.
- **P2.** The `modes` hint is stored without a database key: `dismiss_hint` in 0013 accepts only `capture`, `thread` and `thumbs`. Read `src/lib/profile/hints.ts` and keep whatever it does. Item 2 changes only the copy and the look.
- **P3.** User-scoped reads of `posts` go through RLS. A select policy with `deleted_at is null` therefore hides deleted posts from them. Readers that use the admin client bypass RLS. Item 3 adds `deleted_at is null` to each admin-client read of `posts` that feeds a screen or a total.

- **P4.** The feed's post row carries `created_at` and `updated_at`, and `remove_post_media` and `revert_correction` update `updated_at`. Verify by reading 0030 and `src/lib/posts/feed.ts`. If false, "· edited" is not built, and the report says so.

## Lanes

Five worktrees under `../my-food-ai-wt/run9-<lane>`. Each is cut from `origin/main` after the last Run 8 merge, and all start in the first 5 minutes. Nothing is stacked, and **no file is edited by two lanes**:

| Lane | Files it owns |
|---|---|
| A | `src/lib/posts/summary-line.ts`, `src/components/PostCard.tsx` (summary and drink list block only), `src/lib/intake/drinks-from-items.ts`, `tests/drinks-from-items.test.mjs` |
| B | `src/components/ModeStrip.tsx`, `src/components/FirstRunHint.tsx`, `src/components/CaptureSheet.tsx` (barcode view and shutter only) |
| C | `supabase/migrations/0036_soft_delete_posts.sql` (new), `supabase/rollback/0036_soft_delete_posts.sql` (new), `src/components/DeletePostSheet.tsx`, `src/components/UndoToast.tsx` (new), `src/components/Carousel.tsx`, `src/components/Thread.tsx`, `src/app/api/posts/[id]/route.ts`, `src/app/api/posts/[id]/restore/route.ts` (new), `src/app/(tabs)/profile/deleted/page.tsx` (new), `src/lib/posts/deleted.ts` (new), the admin-client `posts` reads under P3, `tests/db/soft-delete.test.mjs` (new) |
| D | `src/components/IntakeSheet.tsx`, `src/lib/intake/intake.ts`, `src/lib/intake/post-drink.ts`, `src/app/api/intake/post/route.ts` |
| E | `docs/design/visual-pass.md` (new, on `run9/docs`) |

**Dependencies.** None between PRs, so no lane imports a file another lane creates.
- Item 4's Undo toast is written inside `IntakeSheet.tsx` with the same markup as `UndoToast.tsx`. It does not import it.
- Item 4's Undo calls the existing `DELETE /api/posts/{id}`. Before item 3 merges that is a hard delete; after, it is a soft delete. Both remove the post from the feed, so neither order breaks.
- If GitHub reports a conflict after an earlier merge, bring main in by merge commit. A refresh with no code change of its own merges without a new review; a refresh with a code change gets the same reviewer's confirmation first (owner ruling, Nov 2 23:21).

## The design (every spec the coder builds against)

The designer's frames are HTML: `My Food AI.dc.html`, round 5 at the top. The coder has the designer zip only once item 0 places it. **Item 0 copies `My Food AI.dc.html` and `support.js` from the owner's upload into `uploads/design-round5/` (ignored).** The owner's upload is at `/home/opc/.claude-second/uploads/d7c1c193-ea96-4408-afc7-fb2a043c6562/da8c9556-My_Food_AI_app_design_2.zip`, on this same machine. The coder opens that file in Chrome (claude-in-chrome) to look at each frame. Nothing is rendered to an image or stored.

The texts below are quoted verbatim from the frames. They are the specs; where the HTML and this plan differ, this plan wins.

Global note (round 5 header): "Records only, in past tense. Liquid and caffeine are day totals, never goals. Destructive actions use the darker accent." The darker accent is the existing `oklch(0.52 0.17 25)` in `DeletePostSheet.tsx`.

## 0. The docs PR (first 5 minutes)

Cut `run9/docs` from `origin/main`. Commit this file unchanged as `docs/plan-run9.md`, unzip the two design files as stated above, and open "docs: Fleet 9 plan". The report (item 6) lands here. The docs PR is not merged; it stays open for RT.

## 1. #289 The feed card shows each drink's caffeine (Lane A, `run9/drink-card`) — 5a, 5e

**Problem.** A photographed can of cola counts as caffeine, but its card shows none in the place a person looks.

**Service.** `summaryLine` in `src/lib/posts/summary-line.ts` owns the wording. `drinksFromItems` owns the caffeine figure. `PostCard` is the boundary that renders them.

**Step 1 — summary line for a post whose items are all drinks.** In `summaryLine`, before the meal branch, add this rule. When `post.itemDrinks` is non-empty and every item in `post.items` has a matching `itemDrinks` row (by `post_item_id === item.id`), return:
- one drink: `Drank: {ml} ml · {caffeine} mg caffeine · {kcal} kcal`;
- several drinks: `Drank: {n} drinks · {total ml} ml · {total caffeine} mg caffeine · {total kcal} kcal`.

Rules for those lines:
- Omit `· {caffeine} mg caffeine` when the caffeine is 0. Never print "0 mg".
- No sugar figure (cut; RT list).
- Numbers use the existing `number()` helper (en-US grouping) and kcal uses `formatCalories`.

**Step 2 — mixed meals.** In the meal branch, move `drinkLine` so it comes directly after `Consumed: … kcal`, ahead of the macros. Its text stays `· {ml} ml drank · {caffeine} mg caffeine`.

**Step 3 — caffeine fallback, decided.** In `drinksFromItems`, when there is no 1057 portion entry and the item name matches `/\b(coca[- ]?cola|coke|cola|pepsi)\b/i`, use 32 mg per 330 ml, scaled to the volume and rounded. The frames' stated value is 32 mg for a 330 ml can (5a). This is a disclosed estimate on the item (RT list below). No other drink gets a guessed value.

**Step 4 — the five-drink list (5e).** In `PostCard`, for a ready post with two or more `itemDrinks`, render a list under the caption, always expanded. Each row has the drink name and volume on the left (`{label} · {ml} ml`, 15 px text) and the caffeine on the right (`{mg} mg`, or `—` for none, muted, tabular numbers). Tapping a row opens `/posts/{id}`. A single drink shows no list.

**Test** (data rule): add to `tests/drinks-from-items.test.mjs`:
- a cola item without 1057 at 330 ml gives `caffeineMg 32`;
- one at 165 ml gives 16;
- water gives 0;
- an item with 1057 portion 34 keeps 34.

**Page look:** one look at the built feed card against 5a and 5e. Post the list of differences on the PR.

**Done** when a photographed cola's card reads "Drank: 330 ml · 32 mg caffeine · … kcal", and a several-drink post lists every drink with its caffeine. **Blast radius:** this changes every drink and mixed-meal summary line, and item drink caffeine for colas. It touches the `item_drinks` rows written by `syncItemDrinks` on the next analysis only. Existing posts change only on re-analysis.

## 2. #290 Capture modes with Barcode as an obvious choice (Lane B, `run9/capture-modes`) — 5h, 5i, 5j

**Service.** `useModeSwipe` in `ModeStrip.tsx` owns the switching. `CaptureSheet` is the boundary.

1. In `ModeStrip.tsx`, replace `const modes: CaptureMode[] = ["photo", "barcode", "text"];` with `const modes: CaptureMode[] = ["text", "photo", "barcode"];`. Labels stay `Text`, `Photo`, `Barcode`.
2. Under the selected name, draw a 4 px accent dot, centred. Before "Barcode", draw a 14 px barcode glyph: an inline SVG of five vertical bars, `currentColor`. It is the only mode with an icon. The selected name is semibold and full white; the others are 60% white. Tapping a name selects it. The existing swipe stays.
3. In `CaptureSheet.tsx` Barcode mode (5i):
   - Draw a bracket target, four 24 px corner brackets in white, 240×160, centred in the viewfinder.
   - Add a 2 px accent scan line that moves top to bottom over 1.6 s, repeating. With `prefers-reduced-motion` it does not move.
   - Show the line "Point at the barcode. It reads on its own." (15 px, white, centred) above the target.
   - The shutter shows the same barcode glyph at 50% opacity and still takes a photo when tapped.
   - The existing continuous decode and the Found (2i) / not-found (3k) results stay unchanged.
   - Each new opening of the capture sheet starts on Photo, which is already the behaviour of `initialMode`. Keep it.
4. In `FirstRunHint.tsx`, replace the `modes` copy `"Swipe for Barcode · the camera reads packs too"` with the 5j texts:
   - title "Swipe to scan a barcode";
   - body "Packaged food? Barcode mode reads the code and fills in the product. A photo of a barcode or a nutrition label in Photo mode is read too.";
   - two buttons, "Try Barcode" (switches the sheet to `barcode` and dismisses the hint) and "Got it" (dismisses it).
   - Any shot also dismisses it.
   - While it shows, the Barcode name in the strip gets a 1.5 px white ring and nudges 8 px toward the centre and back twice (CSS keyframes, off under reduced motion).
   - Pass a `onTryBarcode` prop from `CaptureSheet` for the button. Hint storage is unchanged (P2).

**No new test** (layout and behaviour). **Page look:** one look against 5h, 5i and 5j; post the differences on the PR. **Done** when the strip reads Text · Photo · Barcode with Photo in the centre, Barcode carries its icon, the scan view matches 5i and the first-time hint matches 5j. **Blast radius:** this touches the capture sheet only. A wrong swipe index would open the wrong mode, and Photo still reads barcodes.

## 3. #291 Remove and redo (Lane C, `run9/remove-redo`) — 5k–5o

**Service.** New `src/lib/posts/deleted.ts` owns the soft delete: `softDeletePost`, `restorePost` and `listDeleted`, each `(db, userId, postId?)`, each returning `{ ok, error? }` or the rows. The routes and the sheets are the boundaries.

**Migration `0036_soft_delete_posts.sql`:**
- `alter table public.posts add column deleted_at timestamptz;` and `create index posts_deleted_idx on public.posts(user_id, deleted_at) where deleted_at is not null;`.
- Replace `delete_post(p_post_id, p_paths)` so it sets `deleted_at = now()` (owner-checked as now) and returns true. It no longer cascades or removes storage.
- New `restore_post(p_post_id uuid) returns boolean`, security definer: it sets `deleted_at = null` where the owner is `auth.uid()` and `deleted_at > now() - interval '30 days'`.
- New `purge_deleted_posts()`, security definer: it runs the old cascade body of `delete_post` for posts with `deleted_at < now() - interval '30 days'`. It is scheduled daily at 03:00 UTC with `cron.schedule('purge-deleted-posts','0 3 * * *', 'select public.purge_deleted_posts()')`.
- Every `posts` select policy for `authenticated` gains `and deleted_at is null`.
- Grants follow 0030's shape.
- The rollback file reverses each step.

**Routes:**
- `DELETE /api/posts/[id]` stops collecting storage paths and calls `softDeletePost`.
- New `POST /api/posts/[id]/restore` calls `restorePost`. It returns 200 or 404.

**Readers (P3):** add `.is('deleted_at', null)` to every admin-client `posts` read that feeds the feed, Days, day totals, Search, the Profile grid, saved meals and hydration.

**UI:**
- 5k. In `DeletePostSheet.tsx`, replace `Its photos and numbers are removed. This cannot be undone.` with `“{caption}” and its photos, comments and record are removed. {Weekday}’s consumed total goes down by {kcal} kcal.` The kcal comes from `sumNutrition(post.items)` with `formatCalories`. When the post has a saved meal (`saved_meal_id`), add a second line: `The saved meal “{caption}” is not affected.`
- 5o. Replace the 3 s "Post deleted" toast with `UndoToast`: text "Post deleted", button "Undo", 4 s. Undo calls restore and dispatches `post-restore`, which already exists. The card collapses with a 200 ms height transition.
- New `src/components/UndoToast.tsx`. Props are `{ text, onUndo, ms }`, and the markup copies the existing toast (`fixed inset-x-inset bottom-[100px] z-[80] … bg-text … text-surface`) with an "Undo" button on the right.
- New `/profile/deleted` page titled "Recently deleted". It lists the posts from `listDeleted` (newest first: thumbnail, caption, date) with a "Restore" button each, and carries the line "Deleted posts are kept for 30 days, then removed for good." Link to it from Profile as "Recently deleted".
- 5l. In `Carousel.tsx`, the leftovers slide's ··· menu offers, in order: "Remove this photo" (the existing DELETE), "Unmark as leftovers (not eaten)" (cut, see the RT list) and "Replace photo" (cut, see the RT list). The menu ships with "Remove this photo" and the note "Removing it re-analyses the post with the other photos." After removal, show `UndoToast` "Leftovers photo removed", 6 s. Its Undo is cut; see the RT list.
- 5m. In `Thread.tsx`, rename "Remove this correction" to "Remove correction". Add the note under it: "Removes your comment and the AI’s reply, and puts back what it changed." After removal, show `UndoToast` "Correction removed", 6 s, with no Undo button.
- 5n. In `PostCard.tsx`, after the time, append ` · edited` when the post has a removed photo or a reverted correction. This is the one `PostCard` line Lane C owns; Lane A owns the summary block. The test is `post.updated_at` more than 60 s after `post.created_at` (P4).

**Test** (migration and data rule) `tests/db/soft-delete.test.mjs`:
- delete hides the post from a user-scoped select;
- restore within 30 days shows it again;
- restore by another user returns false;
- purge removes a post deleted 31 days ago with its items and leaves one deleted 29 days ago.

Run `npm run test:db`.

**Page look:** one look against 5k, 5l, 5m, 5n and 5o; post the differences on the PR. **Done** when a deleted post can be undone and restored from Recently deleted, and the sheets read as above. **Blast radius:** a missed admin reader would show a deleted post or count it in a day total; the P3 list is the guard. Storage now lives 30 days longer. The purge cron is new production work. **Production:** apply 0036 with `psql "$SUPABASE_DB_URL" -f supabase/migrations/0036_soft_delete_posts.sql` immediately before merging this PR, after Run 8's 0035 is applied.

## 4. #289 The drink sheet and the quick tap (Lane D, `run9/drink-sheet`) — 5f, 5g

**Service.** `postDrink` in `src/lib/intake/post-drink.ts` owns the caffeine and nutrition. `IntakeSheet` is the boundary.

1. In `intake.ts`, add `DRINK_TILES`, in this order:

   | Name | Size | Volume | Kind | Caffeine |
   |---|---|---|---|---|
   | Water | glass | 250 ml | water | — |
   | Coffee | cup | 240 ml | caffeine | 95 mg |
   | Espresso | double | 60 ml | caffeine | 126 mg |
   | Tea | mug | 300 ml | caffeine | 45 mg |
   | Coca-Cola | can | 330 ml | caffeine | 32 mg |
   | Water | bottle | 500 ml | water | — |

   Every user sees this order; the ordering by use is cut (RT list).
2. Extend `parseDrinkInput` to accept `{ tile: number }` (0–5) and resolve the volume, kind, label (`{name}, {size}`, e.g. "Coffee, cup") and caffeine from `DRINK_TILES` on the server. `postDrink` stores caffeine as nutrient 1057 as it does today for coffee.
3. Replace the Water/Coffee/Other tabs in `IntakeSheet.tsx`:
   - Header: "Drink", with "Today: {ml} ml · {mg} mg caffeine" on the right. Omit the caffeine part when it is 0.
   - A 3×2 grid of the six tiles. Each tile shows the name and size, then the volume and caffeine (`95 mg`; none for water).
   - The line "Tap to post. Hold to change the size."
   - A field with the placeholder "Type a drink, e.g. oat latte, large". It posts through the existing caption post (`POST /api/posts` with that caption), the same as a text post.
   - A camera button opens the capture sheet in Photo mode (`open-entry` `camera`).
   - Holding a tile is cut (RT list).
4. 5g quick tap:
   - One tap posts the tile, closes the sheet and dispatches `post-created`, so the feed shows it at the top.
   - A toast "Posted {label}" shows for 4 s with "Undo", which calls `DELETE /api/posts/{id}`. The markup copies `UndoToast`'s classes inline (Dependencies).
   - Two taps post two. There is no composer and no confirmation.

**No new test.** The tile values are data; `tests/drink-post.test.mjs` gains `{tile:4}` giving a 330 ml post with 32 mg caffeine, and `{tile:9}` refused with 400. **Page look:** one look against 5f and 5g; post the differences. **Done** when a tap on Coffee posts "Coffee, cup" with 95 mg at the top of the feed, and Undo removes it. **Blast radius:** this replaces the drink sheet: custom water/coffee volumes and the "Other" tab go away (RT list). It touches the intake POST route that agent tokens may also call; the old `{kind, ml}` body stays accepted.

## 5. #193 Visual pass, rounds 1–4 (Lane E, docs only)

For each frame in rounds 1–4 of `uploads/design-round5/My Food AI.dc.html` (1-01 to 4o), open it and the matching production screen in Chrome at 390×844 (1280×800 for round 4 desktop), signed in as the larger test account. Write `docs/design/visual-pass.md`: one section per frame, listing differences in layout, colour, type, spacing, copy and missing states, as text. Take no screenshots. Fixes are not in Fleet 9; the coder files one issue per screen with differences in item 6. Commit to `run9/docs`.

**Blast radius:** none; docs only.

## Run rules

- **Worktrees:** `git worktree prune`; remove every leftover `run8-*` worktree (Run 8 is merged at start).
- **Checks per code PR on its final head:** `npx tsc --noEmit`, `npx eslint <changed files>`, `npm run build`, the header command of each test it adds or touches, `npm run test:db` for item 3, and `node --test tests/wording.test.mjs` for every PR (all add user-facing text). Paste each command with its exit code in the PR body.
- **Review:** the owner's review agent checks open PRs every two minutes. When a head is pushed, comment `Ready for review at <full SHA>`. Fix every blocker, push, and comment again. A PR merges only at a head with `BLOCKERS: NONE` on that exact SHA. If no review appears within 20 minutes, run PPLX on it (`skills/pplx-review/SKILL.md`). If PPLX cannot run, that PR's review is a legal halt for that PR only.
- **Legal halts only:** a review tool unavailable when reached; a fact in this plan proves false; an operation would contact a customer or breach a prohibition. A halt stops only its own item.
- **Claims rule:** consumed and drank, past tense; no target, goal, ring, percentage, or "left" for an amount.
- **No customer contact.** Production checks use the two test accounts.

## 6. Merges, production checks, report

1. At 23:30, list each code PR as clean (with SHA) or not done.
2. Apply 0036 on production if item 3 is clean.
3. Merge the clean PRs in ascending PR number at their cleared SHAs.
4. On production, after the deploy is READY:
   - post a photo of a can of cola from the test account: the card shows 32 mg caffeine;
   - open the capture sheet and swipe to Barcode;
   - tap Coffee on the drink sheet, then Undo;
   - delete a test post, Undo, delete again, then restore it from Recently deleted.
5. File the issues: frames 5b–5d composer drink card; Unmark and Replace photo (5l); Undo for photo removal; tile ordering by use and hold-for-sizes (5f); one per screen from `visual-pass.md`. List every issue number in the report.
6. Write the report on `run9/docs`: every item 0–6 done or not done, the premises found false, the production checks with times.

## Cleanup

Remove leftover worktrees before the first PR. Remove each worktree and local branch once its PR is pushed. Delete each remote branch after its merge. At the end only the main checkout remains and nothing temporary is running. Run `scripts/cleanup.sh` last.

## For RT's eyes (defaults the plan takes)

- **Soft delete replaces "This cannot be undone."** A deleted post is hidden at once, can be undone for 4 s or restored from Profile › Recently deleted for 30 days, then is purged. Storage is held 30 days longer.
- **The drink sheet is replaced.** The Water/Coffee/Other tabs and custom volumes go. Six fixed tiles, a caption field and a camera button come in. The tiles are not reordered by use, and there is no hold-for-sizes before the freeze.
- **The mode order changes** from Photo · Barcode · Text to **Text · Photo · Barcode**, with Photo still in the centre and the default.
- **A quick tap posts at once,** with no composer or confirmation, only a 4 s Undo. Two taps post two drinks.
- A cola with no USDA caffeine value gets an estimated 32 mg per 330 ml. This is the only guessed caffeine figure in the app; the frames state it as a typical value.
- Frames 5b–5d (the composer's drink card before posting), "Unmark" and "Replace photo", and Undo after removing a photo or correction are not built before the freeze. They are filed as issues.
- Removing a correction shows "Correction removed" with no Undo, against the design's 6 s Undo (5n).
- The visual pass over rounds 1–4 delivers a list of differences, not fixes.