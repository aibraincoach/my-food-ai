# Fleet 18 item 10a — investigation #571

**Issue:** [A post started while another is going up breaks the other post with "The meal could not be saved"](https://github.com/aibraincoach/my-food-ai/issues/571)

**Repository baseline:** `origin/main` at `7d2cbd37` (Fleet 18 backlog reference). This checkout was at `e9acca42` when the investigation ran.

**Scope:** Investigation only — no product code changes, no live production writes.

**Method:** Code-path analysis plus review of prior overlap evidence (Fleet 15). **No live 10-pair overlap run was executed in this session** (see §1).

---

## 1. Live test status — blocked

| Check | Result |
| --- | --- |
| `.env.test.local` (disposable stack env) | **Missing** |
| `uploads/test-stack` data dir | **Missing** |
| App port `60260` / PG `55449` | **Not listening** |
| `TEST_ENV_FILE` | Unset |

Per [docs/testing.md](../../testing.md), a disposable stack requires `npm run test:stack` (Podman + PostgreSQL 17 + build + `npm run test:app -- start`) before browser observation. Host tools (`podman`, `psql`, Node) are present, but **no stack was provisioned** in this investigation turn, and no local Firefox BiDi session was attached for the requested **10 overlapping pairs** (post A in flight, start B) with **Save as meal on/off**.

**Planned live matrix (not run):**

| Pair # | Save as meal (composer) | Start condition |
| --- | --- | --- |
| 1–5 | Off | Tap Post on B while A shows “Uploading photo…” (or `upload.posted && !upload.postId`) |
| 6–10 | On | Same |

**Instrumentation to attach on the next live run** (pattern from `scripts/run15-b-production.mjs`):

- Hook `window.fetch` for same-origin paths: `/api/posts` (POST/PUT), `/api/media/sign-upload`, `/api/saved`, `/api/posts/food`.
- Record `{ path, method, status, ms, body.operation_id, body.post_id }` where parseable.
- Listen for `save-meal`, `save-meal-result`, `post-created`, `upload-started`, `upload-finished`, `upload-failed`, `upload-progress`, `upload-deleted`.
- Map DOM nodes via `[data-post-id]`, `[data-upload-id]`, `[data-post-status]`.
- MutationObserver on `[role="alert"]` for feed toasts (Dismiss affordance).

Until that run completes, conclusions below are **code-read only**.

---

## 2. Owner screenshot vs UI surfaces

The owner report matches the **feed-level toast** rendered by `SavedMealListeners.tsx`: fixed bar above the bottom chrome, `role="alert"`, exact copy **“The meal could not be saved.”**, and a **Dismiss** control.

That component is the **only** feed overlay that combines those three traits with that exact string. Other uses of the same phrase:

| Location | Surface | Dismiss on feed? |
| --- | --- | --- |
| `SavedMealListeners.tsx` | Feed toast | **Yes** |
| `CaptureSheet.tsx` (`postLabel`, `postBarcode`) | Inside capture sheet | No |
| `FoodSearchPanel.tsx` | Composer search | No |
| `DeletePostSheet.tsx` | Different delete copy | No |
| API routes (`/api/posts/food`, etc.) | Server JSON only | N/A |

Regular **photo Post** from `CaptureSheet.post()` does **not** use this string on failure; it uses **“The post could not be kept on this phone…”** or **“Posting failed.”** (`CaptureSheet.tsx` ~414–427).

Upload failures on the feed card use **“Upload failed” / “Try again”** on the photo overlay (`UploadingPost.tsx`), not the saved-meal toast.

**Implication:** If the Nov 4 screenshot is accurately described, the strongest client-side explanation is a **`save-meal` → `/api/saved`** failure, not a failed overlapping **Post** tap on its own. The owner’s “pressed Post again” may describe recovering an unpublished draft or retrying upload, which is a **separate** UX path from the toast (see §6).

---

## 3. Path that produces the feed toast (bookmark / menu save)

```text
User taps Save meal (bookmark or card menu)
  → window "save-meal" { postId, savedMealId?, previousSaved? }
  → SavedMealListeners save handler
  → POST /api/saved { post_id }  (or DELETE /api/saved/:id to unsave)
  → savePost() → RPC save_meal_from_post
  → on failure: setError(message) → feed toast
```

**Server gate** (`0026_saved_meals.sql`): `save_meal_from_post` requires `status = 'ready'`. Otherwise it raises SQLSTATE **42501** (`Meal not found`).

**After #587 (merged, named for #571):**

- `PostActions.tsx`: bookmark **disabled** until `post.status === 'ready'` (or already saved).
- `PostCard.tsx` / menus: **Save meal** menu entry disabled when not ready and not already saved.
- `saved.ts` / `/api/saved`: **42501 → HTTP 409** with *“This meal is still being analysed. Save it once its nutrition shows.”* (not the generic toast string).

**Generic toast string** on current main still appears when:

- `POST /api/saved` returns **400** with `{ error: "The meal could not be saved." }` (non-42501 RPC/validation failures, or route catch-all).
- Network / non-JSON response (`SavedMealListeners` `request()` fallback).
- `savePost` client throw for RPC errors **other than 42501** (e.g. **22023** no items).

**Not this path:** Composer **Save as meal** switch (`save_as_meal`) is persisted on the upload draft and post row, then **`save_ready_meal`** runs in the worker when analysis completes (`persist.ts`). That path does **not** dispatch `save-meal` and does **not** show this toast on success or failure.

---

## 4. Overlapping posts — client architecture (code-read)

Two concurrent photo posts are modeled as **two `UploadManager` entries** (distinct `operationId` UUIDs):

- `stage()` / `post()` each touch one entry; `process()` runs per entry with its own `active` promise and `entry.writing` chain (`upload-manager.ts`).
- IndexedDB store key = `operationId` (`upload-store.ts`); writes for A and B serialize per key but do not share one draft object.
- Feed renders each posted upload as an **`UploadHydratedCard`** keyed by `upload.operationId`, seeding a placeholder post `{ id: upload.postId ?? upload.operationId, status: "queued" }` until hydration (`Feed.tsx` ~443, 477–540).
- While **`!upload.postId`**, bookmark actions are **inert** (`PostCard.tsx`: dimmed `PostActions`, no Save menu on the uploading chip).

**Opening a second capture after Post on the first:**

- `CaptureSheet` initializes `resumed` from `uploadManager.newest()`, which returns only **`!posted`** drafts (`upload-manager.ts` `newest()`).
- After the first **Post**, that operation has `posted: true`, so the second sheet should **not** resume the first operation’s draft.

**Risk called out in code (not proven live):** If the user opens capture again **before** Post on the first meal, `newest()` returns the first staged operation and the second sheet **reuses the same `operationId`**, which can mix two intended meals into one draft. That does not directly emit the saved-meal toast but can explain “wrong meal / had to Post again” confusion.

**IndexedDB / CLOSE_WAIT_MS (#619):** `post()` acknowledges after at most **700 ms** waiting on `persist()` while encoding continues (`upload-manager.ts` ~274–278). Overlap increases concurrent large writes; sheet close timing can lag (#370 / #619 backlog), but failure copy for a rejected `post()` is still **not** the saved-meal toast.

---

## 5. Prior production overlap evidence (Fleet 15)

`docs/run15-report.md` (production #581 baseline, not current main):

- Two overlapping fixture posts **closed on first Post** (474 ms / 365 ms).
- A **processing bookmark** on the first post issued **`POST /api/saved` → 400** and showed **“The meal could not be saved.”**
- Report explicitly states this **proves the bookmark toast path**, not that every phone failure shares that cause.

That matches §3 on pre-#587 bookmark behavior. It does **not** replace the requested **10-pair** matrix with save-as-meal on/off on a disposable stack or owner phones.

---

## 6. Reconciling owner narrative with code

| Owner observation | Code-read interpretation |
| --- | --- |
| Toast over feed with Dismiss | **`SavedMealListeners`** / **`POST /api/saved`** (§3) |
| “Beef noodle” grey processing bar | Normal **processing** card (upload hydrated or server `queued`/`processing`) |
| Second photo while first “going up” | Two **`operationId`s**; independent upload pipelines (§4) |
| “Pressed Post again” and meal appeared | Consistent with **retry** (`uploadManager.retry`), **unpublished draft** still in IDB, or **second Post** after sheet stayed open — **not** the same mechanism as the toast |
| Save-as-meal switch | **Server-side** auto-save when ready; **no** `save-meal` event (§3) |

**Unknown without live trace:** Whether the owner (or UI) triggered **Save meal** on a not-ready post, whether production was before **#587** UI gating, or whether a **non-bookmark** failure was misread from the screenshot.

---

## 7. Code-read conclusions (hypotheses, ranked)

1. **Confirmed mechanism for the exact feed toast:** `save-meal` event → **`POST /api/saved`** failure → `SavedMealListeners` error toast. On builds **before #587**, tapping bookmark on a **processing** card reproduced this (Fleet 15). On **current main**, the same tap should be **disabled** unless status is **`ready`**; the generic toast then requires a **non-42501** `/api/saved` error or transport failure.

2. **Save as meal on/off during overlap:** Changes **`save_as_meal`** on each draft/post and worker **`save_ready_meal`** only. It does **not** explain the **`save-meal` toast** unless a separate bookmark/menu save is attempted.

3. **Overlap alone (two photo Posts):** No code path found that maps a successful first Post + second Post directly to **this** toast without an **`/api/saved`** (or mis-attributed user action). Upload publish failures use **different copy** (§2).

4. **Draft resume edge case:** Second capture opening while the first is **staged but not posted** can attach to **`newest()`** draft — worth checking on phone if “Post again” recovered a **lost merge** rather than a server save failure.

5. **Not investigated live here:** Race between hydration (`UploadHydratedCard`), realtime status flips, and accidental double **`save-meal`** dispatch.

---

## 8. Recommended next steps (execution, not implemented)

1. Provision disposable stack (`npm run test:stack` → build → start → sign-in test user).
2. Run **10 pairs** per §1 matrix with fetch/event logging; store JSON under `uploads/run18-571/` (gitignored).
3. Repeat **one** pair on owner phone with remote logging or Safari Web Inspector if stack behavior differs.
4. If **`POST /api/saved` never fires** during failures, file a **separate** issue for the actual failing request (e.g. `/api/posts` PUT, reservation 409) — per Run 15 plan lane B.3.

---

## 9. Files referenced

| Area | Path |
| --- | --- |
| Feed toast | `src/components/SavedMealListeners.tsx` |
| Bookmark gating | `src/components/PostActions.tsx`, `src/components/PostCard.tsx` |
| Composer / Post | `src/components/CaptureSheet.tsx` |
| Upload overlap | `src/lib/posts/upload-manager.ts`, `src/lib/posts/upload-store.ts` |
| Feed + upload cards | `src/components/Feed.tsx`, `src/components/PostCard.tsx`, `src/components/UploadingPost.tsx` |
| Saved API | `src/app/api/saved/route.ts`, `src/lib/posts/saved.ts` |
| Save-as-meal server | `supabase/migrations/0026_saved_meals.sql`, `src/lib/pipeline/persist.ts` |
| Prior overlap script | `scripts/run15-b-production.mjs` |
| Prior evidence | `docs/run15-report.md` |

---

**Investigation outcome:** **Code-read complete; live 10-pair overlap test blocked** (no disposable TEST env in session). Issue **#571** remains open pending traced reproduction on stack or owner phone.
