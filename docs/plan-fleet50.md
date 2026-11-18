# Fleet 50 — #1095: one Realtime channel per tab; the per-post channels and the meal page's backoff poll deleted; discarding a waiting meal is a soft delete (2026-11-18, amended 18:40Z)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. **Nothing here touches production before the PM's merge order**; after it, one migration and one check. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 2, plus two rulings:
- 18:09Z: include the meal page's backoff poll.
- 18:26Z, after the builder's pre-build gate (`qitem-20261118182609-165ac9b2`, `state/build/fleet50/deletion-fact.md`): `discard_post` becomes a soft delete, so every delete sets `deleted_at`. There is no DELETE handling, no replica identity change, and no extra channel or timer.

**The rules:** RT's rules 4 and 5 of Nov 18 (`/home/opc/pm/my-food-ai/decisions/OWNER-RULINGS-2026-11-16.md`).

**Shape:**
- one code PR (with migration 0074) and one docs PR;
- local checks, one stop before the merges;
- after the PM's merge order: the migration applied once, and one production check.

**Base:** main `3f41e22da49fcfc8df1f614d54632b6217fc9c84`. Fleet 49 shares no file with this fleet; both patches apply to this base (checked).

**Supersedes** the first version of this plan (patch `a861a833…`). If you started from that version, reset the branch and apply this patch.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 5). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. What is duplicated, and how a deletion reaches the screen

**The tab's one channel.** `src/components/PostReadinessListener.tsx:119-124` is mounted once per tab (`src/app/(tabs)/layout.tsx:10`). It subscribes to every change on `posts` for the signed-in owner, and dispatches `post-readiness {id}` for each row.

**Three more channels per post repeat it:**

| Channel | Where |
|---|---|
| `post-<id>`, one per feed card (UPDATE and DELETE) | `src/components/RealtimePost.tsx:60-64` |
| `upload-post-<id>`, one per uploading card | `src/components/Feed.tsx:571-573` |
| `detail-<id>`, the meal page | `src/components/OutlineOverlay.tsx:180-182` |

**The quiet poll Fleet 47 missed:** `OutlineOverlay.tsx:183-198`, a 2 → 30 s backoff while the meal updates.

**Deletion (the builder's gate).**
- A filtered DELETE event needs replica identity FULL, and Realtime cannot check RLS on a DELETE (Supabase docs, Postgres Changes, "Delete events"). So the card's `id=eq` DELETE handler was not dependable.
- `discard_post` (`0011_posts_needs_input.sql:93-108`, called by `src/app/api/posts/[id]/discard/route.ts:30` for a `needs_input` meal) is the one live hard delete.
- A meal page left open on that meal in another tab (`PostDetail.tsx:18,27`) stayed stale.

**Planner's addition: the soft-delete UPDATE is probably not delivered either.** Realtime checks the owner's SELECT policy against the changed row. `posts_owner_select` (0036:8) admits only `deleted_at is null`, so the row that sets `deleted_at` is no longer visible to its owner, and the planner expects no event for it.
- **Confirm in the Supabase docs** (Postgres Changes and RLS) before building. Either way, this plan does not rely on that event for deletion.
- **How a deletion reaches each screen instead:**
  - **The same tab:** the `post-deleted` event. `DeletePostSheet.tsx:21` already sends it, and now the strip's Discard sends it too.
  - **Another tab or device:** the read the screen already makes when the person returns to it (focus or visibility). A read that finds no meal retires the card or leaves the meal page.
  - That is one read per return, no timer and no channel.

## 2. The change (patch `fleet50-1095-one-channel.patch`)

1. **`RealtimePost.tsx`:**
   - The `post-<id>` channel is deleted, together with its DELETE handler.
   - The card re-reads on `post-readiness` for its own id, through its existing `changed` handler.
   - Its focus and visibility reads (unchanged) retire a deleted card: the read returns nothing (`:47`).
2. **`Feed.tsx` (`UploadHydratedCard`):** the `upload-post-<id>` channel is deleted. The card re-reads on `post-readiness` for its own id.
3. **`OutlineOverlay.tsx`:**
   - Deleted: the `detail-<id>` channel, and the whole backoff (`delay`, `timer`, `tick` and the restarting `visible`).
   - The page refreshes on `post-readiness` for its own id.
   - On `post-deleted` for its own id, it goes home (`router.replace("/")`).
   - Whenever the tab becomes visible again, it reads once, for any status: a `needs_input` page discarded elsewhere is found then. A read that finds no meal already goes home (`:175`).
   - The effect depends only on `postId` and `router`.
4. **`NeedsInputStrip.tsx`:** a successful Discard also dispatches `post-deleted {id}`, as the owner's delete does.
5. **Migration `supabase/migrations/0074_soft_discard.sql`** (the next free number at this base; renumber if another fleet takes it first):
   - The old `discard_post(uuid,uuid,text[])` is **dropped** (rule 5).
   - The new `discard_post(p_post_id uuid, p_user_id uuid) returns boolean` sets `deleted_at = now()` only where `id`, `user_id`, `status = 'needs_input'` and `deleted_at is null` all match, and returns whether it did. It is `security definer`, executable by `service_role` only, as before.
   - It no longer queues an immediate `media_cleanup` job. The media stay until the daily `purge_deleted_posts` (0036:69-77), which queues the prefix cleanup and deletes the row 30 days later, exactly as for the owner's delete.
6. **`src/app/api/posts/[id]/discard/route.ts`:** the storage walk, the path list and the after-response tick are deleted. The route checks the owner's `needs_input` meal as before, then makes one `discard_post` call, and returns 204, 409 ("Meal changed before it could be discarded.") or 500 ("Meal could not be discarded.").

### 2a. Rollback SQL (for the PR body; run only on the PM's order)

```sql
begin;
drop function public.discard_post(uuid,uuid);
-- Recreate the 0011 function exactly: copy lines 92-110 of supabase/migrations/0011_posts_needs_input.sql
-- (create or replace function public.discard_post(p_post_id uuid,p_user_id uuid,p_paths text[]) … grant … to service_role;)
notify pgrst,'reload schema';
commit;
```

A rollback also needs the previous route deployed, because the old function takes the path list. Meals discarded under 0074 stay soft-deleted and are purged as usual.

### 2b. Readers: what a discarded meal now is

A discarded meal is now a `needs_input` row with `deleted_at` set. **That state already exists today:** the owner's Delete (`owner_remove_post_data('delete')`, 0036:20-34) soft-deletes a meal of any status, including `needs_input`. So no reader meets a new state. Confirm these as facts before building (void the migration half if one is false):
- **Hidden from the owner:** every browser read goes through `posts_owner_select` (`deleted_at is null`). That covers the feed, the strip (it also filters `deleted_at`), the meal page and Days.
- **Recently deleted:** `list_deleted_posts` lists it and `restore_post` can bring it back as `needs_input` with its question, as for an owner-deleted waiting meal. The PM may want that stated to the owner as new behaviour of Discard.
- **Service-role reads without a `deleted_at` filter** (`src/lib/push/send.ts:24`, `src/lib/worker/jobs/*.ts`, `src/lib/pipeline/*.ts`): a waiting meal has no running job. For each, say what it does for an owner-deleted waiting meal today; the discarded meal follows the same path.
- **Jobs and storage:** the purge's prefix `media_cleanup` removes its files. A job queued before the discard follows the existing deleted-meal handling.

## 3. Tests

**Rewritten** (they encoded the old paths):
- `tests/card-polling.test.mjs`:
  - its fake client **throws** if a card opens a channel;
  - an update is the tab event;
  - another meal's event makes no read;
  - a deletion is found by the focus read returning nothing, and retires the card with reason `deleted`.
- `tests/quiet-event-readers.test.mjs`: the upload card waits for the tab event or focus. Its fake client throws on `channel`, and another meal's event makes no read.
- `tests/discard-cleanup.test.mjs`, first test, a database test:
  - the old function is gone;
  - a wrong owner or a ready meal is refused;
  - discard sets `deleted_at` and keeps the row and its media, with no cleanup job queued;
  - a repeat is refused;
  - after 31 days, `purge_deleted_posts` removes the row and queues the prefix cleanup;
  - the `authenticated` role cannot call it.
- **New:** a source test, the route makes one two-argument call and touches no storage and no tick.

**Extended:** `tests/no-quiet-timers.test.mjs` adds `OutlineOverlay` to the readers that may hold no timer.

**New `tests/one-posts-channel.test.mjs`:**
- only `PostReadinessListener.tsx` and `Feed.tsx` open a channel on `posts`, and `Feed.tsx` exactly one (`feed-inserts`, per tab, with #1096's catch-up);
- the card, the upload card and the meal page listen for `post-readiness`;
- the meal page goes home on its own `post-deleted`, reads on every return to the tab, and goes home when the read finds nothing;
- the strip's Discard dispatches `post-deleted`.

**Write in the PR (the planner did not):** a fake-event test of `OutlineOverlay`'s effect, in the vm pattern of `tests/card-polling.test.mjs`, with these checks:
- `post-readiness` for its id refreshes, and another id's event does not;
- `post-deleted` for its id calls `router.replace('/')`;
- a visibility return with the read returning null calls `router.replace('/')`;
- 10 idle minutes make no read.

If its imports make a vm harness impractical, say so and keep the source test.

## 4. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet50-1095-one-channel.patch` | `e1144adcd5ce519193d94e0f8d80860ad68cb2afa042b23fc0d96f8f61c6e2e6` | `src/components/RealtimePost.tsx`, `Feed.tsx`, `OutlineOverlay.tsx`, `NeedsInputStrip.tsx`; `src/app/api/posts/[id]/discard/route.ts`; new `supabase/migrations/0074_soft_discard.sql`; `tests/card-polling.test.mjs`, `quiet-event-readers.test.mjs`, `no-quiet-timers.test.mjs`, `discard-cleanup.test.mjs`; new `tests/one-posts-channel.test.mjs` |

**Verified on the planner's worktree** (main `3f41e22d` with the patch):
- `npx tsc --noEmit` is clean.
- `npx eslint` on the changed sources shows only `OutlineOverlay.tsx`'s error at line 74 and warning at line 98. Both are on main, outside the change.
- **The 46 test files** that mention the card, the meal page, the upload card, `Feed.tsx`, `post-readiness`, `removeChannel`, discard, the strip or `needs_input`:
  - with the patch: 178 passed, 5 failed, 4 skipped;
  - on main: 174 passed, 5 failed, 4 skipped.
  - **The 5 failures are the same tests** in both runs, and each needs a database. On main the discard one is the old test; with the patch it is the rewritten one. The 4 extra passes are the new and changed source tests.

**Not run by the planner:**
- any database test (the rewritten discard test included);
- the migration;
- the suites against a stack.

## 5. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f50` from `origin/main`, with `npm ci`. Branch `fix50/one-posts-channel` from `origin/main`, with the patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63160 TEST_PG_PORT=57449 TEST_STACK_DIR=/tmp/mfa-f50s TEST_ENV_FILE=.env.test.fleet50`. The stack applies 0074 with the rest.
   - It has no Realtime, so the live path is proven by the fake-channel tests and the production check.
   - It has no minute wake (no pg_cron), so tick the worker by hand with `/api/jobs/tick` where a step needs it.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - the tests in section 3, including the discard database test on the stack;
   - the facts in section 2b;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **L1, on the stack as test user 1, at 390 × 844. Met when all of these hold:**
   - **Meal page:** post one photo meal and open its page while it is processing. With the tab visible and no input, count the page's own `/rest/v1/` requests for **5 idle minutes**: **0**. Record main's count for comparison.
   - **Return:** switch away and back. The page reads once, and shows the meal ready once the worker has finished (tick by hand).
   - **Feed:** the same meal's card on Home, with 5 idle minutes: 0 database requests from the card.
   - **Delete:** delete the meal from its menu. The card is gone, and it stays gone after a reload.
   - **Discard, two tabs:**
     - Make one `needs_input` meal with the beer-question fixture.
     - Tab A: its meal page. Tab B: Home, then Discard it from the strip.
     - Tab B: the row is gone.
     - Tab A, on its return: it goes home.
     - The meal is in Recently deleted. Its media are still in storage. No `media_cleanup` job was queued.

   One screenshot per state; report the counts.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable).
6. **Docs PR:** branch `docs/fleet50`, with this plan unchanged as `docs/plan-fleet50.md`.
7. **Stop** when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and review;
   - the suites' counts against main;
   - L1 with its counts and screenshot paths;
   - the RLS fact and the section 2b facts;
   - anything void;
   - the merge order: **the code PR, then the docs PR**;
   - **the migration is applied in production after the code PR is merged and its deployment is READY,** because the deployed route calls the new two-argument function.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 6. After the PM's merge order: production, once

Rule 4: each step once, no repeat.
1. **Deployment:** wait for READY with the alias matched (at most 10 minutes).
   - Between READY and step 2, a Discard returns 500, because the old function takes three arguments. That window is minutes. The PM may instead order the migration applied just before the merge; then old deployments' discards fail until READY. **Say which you did.**
2. **Migration 0074,** applied once. Read back once: `select to_regprocedure('public.discard_post(uuid,uuid)') is not null, to_regprocedure('public.discard_post(uuid,uuid,text[])') is null;` → both true.
3. **P1:** as test account 2, in a fresh native Chromium at 390 × 844, post one ledgered photo meal.
   - Open its meal page while it is processing. Met when the page shows it ready **with no reload**, and its network log shows no timed database read while it waits.
   - Open Home: the card shows the ready meal.
   - Delete the meal, and read back once that no post is visible to the account and no draft remains. Its stored files follow the 30-day purge, as for every deleted meal; say so.
4. **Report:** the migration's read-back, P1 met or not, the screenshot path, and the cleanup.
