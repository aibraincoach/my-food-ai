# Run 6 claims-rule copy audit

Observed November 2, 2026 during the Doc rev 358 backlog reconciliation. This is an additional source audit of the six unmerged PR heads below. It changes no product copy, code head, review receipt, merge order or issue acceptance. It is not the natural-language terminology review assigned to the planner in #294; no AGY wording opinion or owner terminology ruling is claimed.

## Earlier evidence and its limit

`tests/wording.test.mjs` has two tests. They exercise the model-summary wording guard and the unavailable-nutrition fallback. They do not enumerate UI strings, accessible labels, toast messages, API errors or agent-tool descriptions. Run 6 also had source review and page comparisons against the supplied frames, and the generated removal/remainder replies pass through the runtime wording guard. Those checks were not a recorded inventory of every new UI string. The earlier passing wording tests therefore did not establish complete UI-copy coverage.

This audit now inventories string literals, template expressions and JSX text overlapping added lines in `src/**/*.ts` and `src/**/*.tsx`, independently for each PR against its `origin/main` base. The inventory contains 1,800 candidate nodes, including nested/duplicate templates, styles, selectors, paths, keys and database categories; that is not a count of UI messages. Authored copy was reviewed in source context, including fallbacks and messages returned by the new routes. The migration exception messages in 0029–0031 were also inspected. A whole-word scan using the wording guard's banned phrases supplemented the contextual reading. A keyword scan alone is insufficient: it can flag CSS `left`/`ring`, miss plural `targets`, and cannot distinguish a record from a recommendation.

## Exact scope and findings

| PR | Head audited | Result |
| --- | --- | --- |
| #296 | `839760807842faaf5cd1bb29dd28d9c2cd81381d` | No prohibited nutrition claim found in the authored copy reviewed below. |
| #297 | `2f02b07dfd64f80fc73d194fde87b893c71fe57b` | Same; one diagnostic use of “remaining” is discussed below. |
| #298 | `8286851f92b15602b9f2a2633b069ba05da55892` | Same; capture instructions describe operating the camera. |
| #299 | `4764e773cb67ad148ea434dec015aaf8dc3560ea` | Same; the bar describes file upload only, with no displayed percentage or time estimate. |
| #300 | `b954fb7585c5c953c5e03a3373db765d15d79002` | Same; scope copy explicitly excludes targets, weight and exercise. |
| #301 | `ad9aca8bbf720341b084cc6b88f1917229885bce` | Same; navigation, focus indicators and dates do not express nutrition progress. |

### #296 — drink records and cards

Reviewed `PostCard`, `ResultsCard`, `card-data`, `summary-line`, `drinks-from-items`, hydration and related persistence fallbacks. Record wording includes “Drank”, “Drank in this meal:”, “Consumed:”, “Consumed today:”, “from drinks”, “from food”, “caffeine”, “Nutrition unavailable:”, “unavailable”, the units ml/mg/kcal, and the generic label “Drink”. “Open drink details” and “Open meal details” are navigation. The meal summary's added fragment is “[amount] ml drank”, optionally followed by “[amount] mg caffeine”. The fragment is past tense; its awkwardness, if any, belongs to #294 rather than a claims-rule rewrite in this reconciliation.

The quantities are recorded amounts or calculated totals, without a daily allowance, target, recommendation or comparison to a goal. Missing caffeine remains absent and unknown nutrition is not invented. Error text such as “Drink records could not be saved.” / “Drink items could not be read.” is operational. USDA category and beverage-description strings classify references; “low fat” / “reduced fat” there are database descriptions, not advice to the user.

### #297 — deletion, removal and replay

Reviewed the delete sheet, menus, carousel, thread, new routes, replay replies and Sheet close labels. The confirmation reads “Delete this post?” and “Its photos and numbers are removed. This cannot be undone.” Actions/statuses include “Delete”, “Delete post”, “Deleting…”, “Cancel”, “Post deleted”, “Remove this photo”, “Remove this correction”, “Remove”, “Removed” and “Accepted”. Accessible labels include “Leftovers photo menu”, “Meal photos”, “Meal comments” and “Close [sheet label]”. Retained menu copy on changed lines includes “Add photo”, “Log again”, “Save meal”, “Unsave”, “Edit caption”, “Edit time” and “Correct product”.

Replay commentary is “Removed the leftovers (not eaten) photo. [Consumed summary].” or “Removed the correction [quoted user words]. [Consumed summary].” The latter's generated prefix and summary are checked separately from the user's quotation. The remainder reply uses “leftovers (not eaten): … Consumed: …”. These describe past records; they neither prescribe eating nor express an amount remaining toward a target.

The fixed request/removal errors were read, including “Sign in required.”, “The correction could not be read.”, “The correction could not be removed.”, “The photo could not be read.”, “The photo could not be removed.”, “The post could not be deleted.” and their “Try again.” fallbacks. Other authored errors concern ownership, stale revisions, storage cleanup and failed rebuilding.

“The remaining correction needs clarification before the meal can be rebuilt.” is an authored worker error in `jobs/recompute.ts:86`. The lexical guard would flag “remaining”; here it refers to a correction still in the replay list, not food, calories or an amount left to meet a target. This audit treats it as operational wording, not a nutrition claim. It has not been forced through every terminal worker-error UI state in a browser.

### #298 — capture modes and barcode panels

Reviewed “Photo”, “Barcode”, “Text”, “Capture mode”, “Capture content”, “Capture actions”, “Swipe for Barcode · the camera reads packs too”, “Code read · [digits]”, “Hold the barcode inside the frame”, “Hold the code steady in the frame”, “Camera unavailable”, “Looking for a barcode…”, “Choose a photo containing a barcode.” and “Looking it up…”. The result panel includes “Not in the database”, “No product for this code yet. Photograph the nutrition label and the pack becomes a post the same way.”, “Photograph the nutrition label”, “Type it instead” and “Try the code again”. Accessible image/panel names include “Meal photos”, “Nutrition label”, “Scanned product” and “Scanned pack”.

These are capture/navigation instructions and lookup statuses. No instruction tells someone what or how much to eat. The hint placement's `left` value is a layout direction, not displayed food wording. Home/End/arrow key names are keyboard handling, not nutrition language.

### #299 — upload states, retry, chip and local draft controls

Reviewed “Uploading photo…”, “Uploading [count] photos…”, “Uploading [count] posts…”, “Uploaded”, “Upload failed”, “New post”, “View”, “Not posted yet. The photo is kept on this phone.”, “Just now”, “The connection dropped.”, “The photo is too large.”, “The server didn't respond.”, “Try again” and “The photo upload failed. Your draft was kept; try again.” Retained/new local-draft controls include “Post”, “Posting…”, “Post menu”, “Delete”, “Edit caption”, “Caption”, “Save”, “Cancel”, “Add a photo”, “Add a photo of leftovers (not eaten)” and the leftovers label. Accessible copy includes “Photo upload”, “Photo uploads”, “Meal photo [number]”, “Meal photos” and “Open meal details” / “Open drink details”.

The upload bar's width is computed from transferred bytes and total bytes. Its CSS percentage is not rendered as a number or time estimate. Its accessible label is “Photo upload”; it is not a nutrition or goal meter. The internal event name `upload-progress` describes file transfer. The failed-upload reasons map to fixed authored strings rather than printing arbitrary upload exceptions in that overlay. Counts refer to photos/posts, not progress toward nutrition targets.

### #300 — agent setup, token handling, activity and API

Reviewed the Profile row (“Connect an agent”, “Agents”, “[count] connected”, “Lets an assistant post and read your meals”), the setup page (“Profile”, “Name”, “Agent 1”, “Create token”, “Creating token…”) and its introduction: “An agent such as Claude can use a token to post meals for you and read what you have posted.” The name help is “Only you see this. It labels the agent's posts and its activity.” Scope rows are “The token can”, “Post a meal you tell it about”, “Read the meals you have posted”, “Add a correction to a meal” and “Nothing else: no weight, no exercise, no targets”. The last row denies those functions; it does not introduce a target.

Token copy reviewed: “Token created”, “Copy it and paste it into the agent's settings. For your security it is shown only this once.”, “Agent token”, “Copy token”, “Copied”, “The token could not be copied. Select it and copy it.”, “If you lose it, revoke this one and create another.”, “Done”, “You won't see this token again”, “Leave” and “Stay”. Agent-list/revoke copy includes “Connected”, “token ending”, “Last used”, “Revoked”, “Activity”, “Posted a meal”, “Read a meal”, “Corrected a meal”, “Read [count] meal/meals”, “Revoke token”, “Revoke [name]?”, “The agent stops working right away. Posts it made stay in your feed and stay yours.”, “Cancel”, “Connect another agent” and “Token revoked”. Attribution (“via [agent name]”) identifies who wrote a post.

The new API/MCP tool descriptions limit operations to logging, reading and correcting owned meal records. They say “Post a meal the user tells you about.”, “When eaten, in the past. Defaults to now.”, “Read meals the user has posted, newest first.”, “Read one owned meal, its items, consumed totals and thread.” and “Add a correction to an owned meal.” Input/time/size/rate-limit/token errors and JSON-RPC errors were read as operational copy. “Time eaten must be in the past” enforces a record, not a plan. No tool provides nutrition advice, weight/exercise operations or targets.

### #301 — desktop navigation, capture, Search, Days and Profile

Reviewed the brand and navigation (“My Food AI”, “Home”, “Search”, “New post”, “Days”, “Profile”, “Main navigation”), the KEYS labels (“J / K”, “next and previous post”, “Enter”, “open”, “Esc”, “close”, “N”, “new post”, “/”, “search”, “← →”, “slides”), the detail pane (“Post”, “Post detail”, “Close post detail”, “Loading post…”) and carousel/image labels (“Previous slide”, “Next slide”, “Open post”, “Meal”).

Capture copy includes “Back to Feed”, “Photo source”, “Webcam”, “Upload a file”, “Drop meal photos here”, “or paste one with ⌘V”, “Choose files”, “or write a caption without a photo”, “Camera [number]”, “Choose from library”, “Flip camera”, “Space” and “takes the photo”. Search has “Search meals” and “[count] post/posts”. Days has “Selected day”, “Choose a day”, “Consumed: [kcal] kcal · [count] post/posts”, dates/times and “Open the day ›”. Phone day-ring naming remains “Last five days”. Keyboard left/right and CSS focus rings describe navigation/focus; no new nutrition ring is introduced. Consumed totals and post counts are historical records.

## What remains unchecked

No prohibited claim was identified in the authored literal UI copy and templates reviewed above. This is source verification, not a claim that every assembled UI state was rendered or that every possible runtime value passed `checkWording`.

- Arbitrary user captions, correction quotations, agent names, database food/product names, browser camera-device names and externally supplied error text are not exhaustively checked for every possible value. In particular, removing a correction deliberately preserves the quoted user's words rather than censoring them; agent activity and attribution also interpolate user text. Numeric values and locale-generated dates/times were checked as record templates, not every possible rendering.
- Raw database/SDK errors can vary. The authored fallback messages were read, but every upstream message and every failure path was not induced in a browser. The worker diagnostic noted above is specifically retained as an unforced terminal-state case.
- Earlier page looks covered the reported built states. Drink cards had component/source audits, not a new fully migrated photo-to-drink live flow; only the new-agent form was fully viewed against the real project before the agent migration. The remaining schema-dependent pages, production acceptance and all physical-phone states are not covered by those looks. They are not converted into claims-rule test coverage here.
- Unchanged application copy outside these six diffs and their directly examined shared record renderers is outside this audit. #294 remains open for the planner's full terminology review, AGY opinion, owner rulings and subsequent wording changes.

No product string was changed by this audit. The six reviewed code heads remain unchanged.

## Subsequent merge evidence — November 3 reconciliation

The six feature PRs are now merged, including refreshed #299 head `eb10b1e1543c4e2d5078b0678b542bb7deea8768` and #301 head `7affd872dd0eee32ceb66419b52739d0488164de`. Their later exact-head external confirmations are on their PR threads; the audit above retains its original cutoff and is not a new whole-runtime wording audit. Production checks and final docs merges are recorded in the [final receipt](https://github.com/aibraincoach/my-food-ai/pull/302#issuecomment-6583475674). #294 remains open.
