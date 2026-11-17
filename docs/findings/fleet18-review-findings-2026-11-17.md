# Finding: the unchecked Fleet 18 review findings, checked on main (#659)

Fleet 30, 2026-11-17. A read of main `45ea4cf7f190e9c01dd280e0d42f6e5f5dd07edd`. No code was changed for this finding. Line numbers are on that commit.

#659 lists the review findings on the merged Fleet 18 PRs that nobody had checked on main. Each is reproduced or dismissed below, with the line that shows it.

| Finding | On main | Result |
|---|---|---|
| #641: the database does not accept `portion_unit` "serving" | Migration 0060 (`supabase/migrations/0060_label_serving_unit.sql`, lines 17 and 81) accepts `g`, `ml` and `serving`, and writes "1 serving" or "N servings" (lines 46 and 110) | Dismissed |
| #638: Feed discovery polling stops when the tab is hidden | It skips a poll while hidden (`src/components/Feed.tsx` line 410) and starts again on a return to the tab (lines 426 to 432) | Dismissed |
| #638: `today_summary` disagrees with the legacy totals | Nothing in `src` reads `today_summary` any more | Dismissed: the code is gone |
| #639: NeedsInputStrip never finds new questions after an empty first poll | After an empty poll it schedules the idle discovery poll (`src/components/NeedsInputStrip.tsx` line 36, `DISCOVERY_IDLE_MS`), and it listens for a return to the tab and for focus (lines 90 and 91) | Dismissed |
| #639: RealtimePost does not refresh on visibility | It listens for `visibilitychange` and `focus` (`src/components/RealtimePost.tsx` lines 114 and 115) and stops polling while hidden (line 109) | Dismissed |
| #637: Thread retry polling | It polls with a backoff from 2 to 30 seconds and starts again at 2 seconds on a return to the tab (`src/components/Thread.tsx` lines 53 to 59). The review's own wording of this finding is not held, so this reads the code as it stands | Dismissed on the code as it stands |
| #643: the header text is cut off | Reproduced in Fleet 27 at 390 pixels wide (a 30-character handle, 318 pixels of text in 219) | Reproduced; filed as #1022 and fixed in Fleet 30 |
| #647 blocker: every post header shows the viewer's avatar and handle | `usePostAuthor` (`src/components/PostHandle.tsx` lines 39 to 54) uses the viewer's identity only for the viewer's own posts, and the post's author otherwise | Dismissed |
| #647 blocker: the avatar route reads with the viewer's token, so another user's avatar fails | The route answers 404 to anyone but the owner or an admin (`src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts` line 34) and reads the file with the service client (line 52). A 404 for another user is the intended result (#689's done line) | Dismissed |
| #647 blocker: the avatar route sends a public one-year cache header | It sends `private, max-age=31536000, immutable` (same file, line 8) | Dismissed |
| #648 blocker: `wording-inventory.mjs` embeds the HEAD short hash, so its check can never pass | The script no longer reads git or a hash (`scripts/wording-inventory.mjs`) | Dismissed |
| #648 blocker: `docs/wording/inventory.md` was generated before later changes | Reproduced: regenerating it on main gives 1,259 strings and 2,031 locations against the committed 1,249 and 2,024, and moved line numbers | Reproduced; regenerated in Fleet 30's docs PR |

Every finding #659 lists is now reproduced or dismissed. The two reproduced ones are #1022 and the inventory, and both are handled in Fleet 30.
