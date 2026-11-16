## What was measured

Source audit A8 read commit `2e4d0d396b595ab3c5646e8df3956b8eaad6ce76`. Its app source is identical to the planner's `9f5b60538f12525d225f37456faadf4d007c6636`; the intervening changes are documentation. The JavaScript table and initial ordering below are the planner's supplied text, copied unchanged, not a new build measurement by the auditor.

A2 contains one corrected paired browser collection on the exact local builds recorded below; it has primed HTTP caches, incomplete event cohorts and an unstable old build, so it is not an equivalent-work speed comparison. A3 is not done because its required F1 fixture failed the bounded setup premise. A4 to A7 production readings are deferred until the ordered merges and deployments; no production completion is claimed here.

A8 uses only the Scale, Speed and Lean checklist from `DietrichGebert/ponytail`'s `skills/ponytail-audit/SKILL.md` at fixed commit `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`. The skill was fetched read-only through GitHub. No code was changed by the audit.

## 1. JavaScript size

Built with the same placeholder settings on Nov 16 2026, Home's first-load JavaScript is:

| Commit | Files | Bytes | Gzip bytes |
|---|---|---|---|
| 96ecdcf (before Fleets 21 to 23) | 20 | 1,099,351 | 324,914 |
| 9f5b6053 (main) | 20 | 1,104,551 | 326,431 |

The difference is 5,200 bytes, 0.5%. The dependencies are identical. The slowdown is not bundle growth.

Home loads about 1.1 MB of JavaScript at either commit. The capture sheet (camera, composer, barcode reader, food search) is about a ninth of it and is used only after a tap. Three source files are imported by nothing: src/components/NutritionImage.tsx, src/components/SafeImage.tsx and src/lib/queue/enqueue.ts.

## 2. Requests when Home opens

A2 local browser observation completed on the two builds below. Each cold-labelled open cleared CacheStorage and unregistered service workers; the browser HTTP cache remained primed by earlier looks and aborted measurement attempts. Both first paired attempts stopped at the warm step because Firefox refused the reload option `ignoreCache:false`; the option was omitted and one corrected current/old collection completed. “Cold” below is the plan’s label, not a true network-cold measurement. Warm is a normal reload. Each window includes navigation plus 15 seconds after navigation completed.

| Build | Full source head | Expected and observed build marker |
| --- | --- | --- |
| Current (PR 8) | `faa0f1d87a2375d749b08d070d4d1c1922352643` | `local-1794845114359` |
| Old | `96ecdcf7897035b3019d14c7f0af38ce2510f890` | `local-1794845195716` |

The current build is the selected PR 8 local-storage fixture branch, whose product source is the audited main plus only the local test stand-in’s Storage copy support. The old build is run against the same later disposable database. The source and fixture/migration differences make this an observation of each setup, not equivalent work.

The byte column is exactly WebDriver BiDi `response.bytesReceived`: no fallback to decoded/body-size estimates. It is neither physical network-transfer bytes nor decoded body bytes. Cached responses sometimes have a positive value (for example old warm photos: 23,040 with all three responses marked cached), so the values cannot prove fresh downloads. `Unknown bytes` counts completion events lacking that field; all observed completion events supplied it. It does not count started requests whose completion falls outside the window.

| Build/open | Group | Requests | Responses | BiDi bytesReceived | Unknown bytes | Cached responses | Fetch errors |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Current cold | Page | 1 | 1 | 22,602 | 0 | 0 | 0 |
| Current cold | JavaScript/styles | 23 | 23 | 0 | 0 | 23 | 0 |
| Current cold | Photos | 5 | 5 | 0 | 0 | 5 | 0 |
| Current cold | Background pages (_rsc) | 15 | 15 | 20,594 | 0 | 0 | 0 |
| Current cold | /api/ | 3 | 3 | 5,352 | 0 | 0 | 0 |
| Current cold | Database/Auth/Realtime | 38 | 38 | 18,383 | 0 | 0 | 0 |
| Current cold | Other | 2 | 2 | 0 | 0 | 2 | 0 |
| Current warm | Page | 1 | 1 | 133,804 | 0 | 1 | 0 |
| Current warm | JavaScript/styles | 23 | 23 | 1,105,372 | 0 | 23 | 0 |
| Current warm | Photos | 5 | 5 | 0 | 0 | 5 | 0 |
| Current warm | Background pages (_rsc) | 15 | 15 | 0 | 0 | 15 | 0 |
| Current warm | /api/ | 5 | 5 | 8,920 | 0 | 0 | 0 |
| Current warm | Database/Auth/Realtime | 40 | 40 | 20,470 | 0 | 0 | 0 |
| Current warm | Other | 2 | 2 | 0 | 0 | 2 | 0 |
| Old cold | Page | 49 | 47 | 412,309 | 0 | 0 | 0 |
| Old cold | JavaScript/styles | 26 | 26 | 68,038 | 0 | 26 | 0 |
| Old cold | Photos | 3 | 3 | 0 | 0 | 3 | 0 |
| Old cold | Background pages (_rsc) | 72 | 72 | 6,148 | 0 | 65 | 0 |
| Old cold | /api/ | 13 | 13 | 125,266 | 0 | 0 | 0 |
| Old cold | Database/Auth/Realtime | 215 | 214 | 114,608 | 0 | 0 | 1 |
| Old cold | Other | 8 | 8 | 0 | 0 | 8 | 0 |
| Old warm | Page | 39 | 39 | 454,448 | 0 | 1 | 2 |
| Old warm | JavaScript/styles | 26 | 26 | 1,161,023 | 0 | 26 | 0 |
| Old warm | Photos | 3 | 3 | 23,040 | 0 | 3 | 0 |
| Old warm | Background pages (_rsc) | 69 | 69 | 0 | 0 | 69 | 0 |
| Old warm | /api/ | 13 | 13 | 125,266 | 0 | 0 | 0 |
| Old warm | Database/Auth/Realtime | 212 | 215 | 116,438 | 0 | 0 | 0 |
| Old warm | Other | 8 | 8 | 0 | 0 | 8 | 0 |

Arithmetic differences below are current minus old, by group; they describe raw event windows and the same reported byte field only. Negative values are not a percentage speedup or a saving in physical transfer.

| Group | Cold request delta | Cold BiDi-byte delta | Warm request delta | Warm BiDi-byte delta |
| --- | ---: | ---: | ---: | ---: |
| Page | -48 | -389,707 | -38 | -320,644 |
| JavaScript/styles | -3 | -68,038 | -3 | -55,651 |
| Photos | +2 | +0 | +2 | -23,040 |
| Background pages (_rsc) | -57 | +14,446 | -54 | +0 |
| /api/ | -10 | -119,914 | -8 | -116,346 |
| Database/Auth/Realtime | -177 | -96,225 | -172 | -95,968 |
| Other | -6 | +0 | -6 | +0 |

Request and completion events do not form a perfectly paired cohort inside each window. Old cold page has 49 starts and 47 completions; old warm database has 212 starts and 215 completions. Some earlier requests therefore complete in a later window, and some window starts have no completion in that window. Do not compute average bytes per request, response success rates, per-navigation costs or equivalent-work speed changes from these totals.

The old build was unstable: 49 page requests in the cold-labelled window, 39 warm, one cold database fetch error and two warm page fetch errors. The reason for its repeated navigation/error behavior was not isolated. In particular, neither that behavior nor the fixture or database-test failure is attributed to dropping `today_summary` on this evidence alone.

Actual collection windows (wall-clock durations including navigation) were current warm: 15.542 s, old warm: 15.137 s. Source receipts: verification/A2-current.json, verification/A2-old.json and verification/build-identities.json. Sanitized numbers are embedded here so the report can be read without those local files.

Comparison limit identified before A2: the old `96ecdcf` Home calls `today_summary` even when the desktop Today column is hidden by phone-width CSS. The selected local sequence applies PR 6’s function-drop migration before A2, and the parent ordered no schema rollback. An old-build missing-function response must be retained as a non-2xx observation; those runs compare different application/schema behavior and cannot establish an equivalent-work speedup or slowdown.

Source evidence distinguishes two costs. Ready cards leave Comment and Details links eligible for framework prefetch (`src/components/PostActions.tsx:44,46`). Home starts an owner feed query, an earlier ID-only discovery query and bounded batched revision/media/nutrition reads (`src/lib/posts/feed.ts:329`). The batched reads avoid a full query chain per card; the discovery query is deliberately ordered before the first page to close an insertion gap. No change to that safety rule is proposed from source inspection alone.

## 3. The photo address

A3 not done. On PR 8 head `faa0f1d87a2375d749b08d070d4d1c1922352643`, the required “Fixture ready” photo meal did not settle within the plan’s 60-second attempt and was not accepted as F1. A separate sample during that attempt showed `queued` with no failure reason. A later read at 2026-11-16T16:25:23.698Z found it ready, but this did not reopen or retrospectively pass the failed premise. No F1 address was accepted for A3; no width/status/byte/timing results are invented. Source: the verification owner’s retained `F1.json`.

On a cache miss, `src/app/p/[file]/route.ts:17-48` checks the photo and post rows, reads the stored original through a six-second deadline and eight-MiB cap, then resizes it. `reserveFeedPhoto` allows four transformations per server instance (`src/lib/posts/feed-photo.ts:10`). A fifth overlapping miss receives a no-store 302 to a signed original, and a resize failure takes that same fallback. Successful output is browser-cacheable for a year and shared-cacheable for one day. Those bounds protect the worker; they do not make a cache miss free.

A4 production cache headers and timings are deferred until after the merges. Local repeated requests do not establish Vercel cache HIT/MISS behavior. The prior Fleet 23 Storage report and the planner's bundle measurements are context, not fresh evidence from this audit.

## 4. Sign-in calls on production

A5 deferred until after the ordered merges and deployments. No sign-in, token or logs query ran for this audit.

`src/middleware.ts:23` calls `getClaims` for protected requests. The earlier Fleet 22 report identified ES256 plus a key id on production, while the disposable stack used HS256. This explains why local Auth service calls per guarded request cannot be relabelled as production sign-in counts. A5 still needs its own per-minute counts, caller groups and a note that unrelated users may share the time window.

## 5. The worker wake

A6 and A7 deferred until after the ordered merges and deployments. This report contains no live job rows or tick timings.

At the audited base, `src/lib/queue/tick.ts:24` counts every queued job. `src/lib/media/staged-photo.ts:8` queues cleanup three hours in the future; `QueueTicker.tsx:40` polls once a minute while the reported queued-plus-running count is nonzero. The worker claim rule accepts only due jobs. A queue containing only future cleanup rows can therefore trigger an empty drain and continued polling.

Fleet 24 PR 7 changes the tick's queued count to due work. Its test/build and production result belong to that exact PR head and the verification/merge report, not this unmodified audit base. `src/lib/queue/traffic.ts:18` independently counts all queued rows and caches that count for 60 seconds; #967 tracks that remaining rule copy.

## 6. Slow paths and code to delete

What this repo does: My Food AI stores a private meal history, uploads photos, computes food records through a background worker and serves a feed plus meal details. The scale assumption is several active authenticated accounts opening six-card Home pages, scrolling 20-card pages and uploading photos concurrently, with multiple requests sharing a server instance. No traffic rate, throughput limit or on-phone speed was measured by A8.

Findings are source-backed cases at the audited base. Already-filed issues are linked; none is created, closed or fixed by this audit. The ranking is provisional until A2 to A7 distinguish actual runtime cost.

**Must fix**

1. **An unanswered attachment request can keep Uploading forever** (`src/lib/media/pack-photo-upload.ts:26,35`; `src/lib/posts/upload-manager.ts:262-280,326-333`; [#969](https://github.com/aibraincoach/my-food-ai/issues/969)).
   - **What this is:** Added photos run signed-upload, image PUT and attachment requests while their durable draft is kept.
   - **Problem:** If one request never answers, it has no deadline or abort signal. The active promise never settles, so the manager does not reach its retry/failure path; with several failed entries the chip can still say “Uploading N posts”.
   - **Fix:** Give these existing requests bounded deadlines, retain the existing stage/reconciliation identity on timeout, and derive the chip title from failed versus active states.
   - **If we skip it:** A person can wait indefinitely with no usable completion or failure signal. No production hang was manufactured to establish this source case.

2. **Future cleanup jobs wake an empty worker** (`src/lib/queue/tick.ts:24`; `src/lib/media/staged-photo.ts:8`; `src/components/QueueTicker.tsx:40`; [#966](https://github.com/aibraincoach/my-food-ai/issues/966)).
   - **What this is:** A photo upload schedules cleanup three hours later, but the tick reports it as waiting now.
   - **Problem:** With only future cleanup rows queued, each app open can take a worker lease and drain nothing; open apps then repeat the tick once a minute.
   - **Fix:** Count due queued jobs for the wake, as selected Fleet 24 PR 7 does. Keep the actual worker claim rule unchanged.
   - **If we skip it:** Normal uploads create unnecessary database, lease and worker work for hours. This is a source consequence, not a claim that a new observation window ran.

**Should fix**

3. **Photo resize overload falls back to the full original** (`src/app/p/[file]/route.ts:26-45`; `src/lib/posts/feed-photo.ts:10,64`; existing [#222](https://github.com/aibraincoach/my-food-ai/issues/222), [#372](https://github.com/aibraincoach/my-food-ai/issues/372) and [#375](https://github.com/aibraincoach/my-food-ai/issues/375)).
   - **What this is:** The first request for a missing width reads the full stored original and resizes it, with four slots per instance.
   - **Problem:** Five overlapping misses leave the fifth request without a slot; it receives a redirect to the full original instead of the small feed copy. A phone then pays original-photo transfer bytes in the busy case.
   - **Fix:** Use the already-stored bounded feed JPEG as the busy/error fallback rather than the full original. Keep the original available for the separately ruled full-resolution detail use.
   - **If we skip it:** Simultaneous cold photo opens can become largest-file transfers just when the resize path is busy. A3/A4 are needed to quantify frequency and bytes; no concurrency test was run.

4. **An unchanged Home rereads the server page on a timer and on tab return** (`src/components/PostReadinessListener.tsx:15,79-81`; [#120](https://github.com/aibraincoach/my-food-ai/issues/120)).
   - **What this is:** The readiness observer reconciles once a minute while visible and every time the tab returns.
   - **Problem:** An account with no new meal still starts a full server refresh, or a full feed revalidation in the installed shell. Every active tab repeats this work independently.
   - **Fix:** Reuse the existing status/change reconciliation before requesting a whole page; retain a targeted midnight/day-total update and a recovery path for missed updates.
   - **If we skip it:** The same optional feed and summary work repeats even when the visible records did not change. This behavior predates Fleets 21 to 23.

5. **Finished cards permit two detail-page prefetch targets before a tap** (`src/components/PostActions.tsx:44,46`; existing [#222](https://github.com/aibraincoach/my-food-ai/issues/222)).
   - **What this is:** A finished card offers both a Comment link and a Details link, with default framework prefetch.
   - **Problem:** A visible ready card exposes two routes to background loading before the person chooses either. A screen of six ready cards exposes twelve eligible targets; eligibility is not proof that twelve full requests occur in every browser/build.
   - **Fix:** Disable automatic prefetch for these two links and reuse the existing remembered first frame; add only an explicit intent-based warm-up if measured navigation latency requires it.
   - **If we skip it:** A person who only reads Home can pay for meal pages they never open. A2 must decide the actual request count and byte cost.

6. **Home loads the camera and composer before they are used** (`src/components/NavigationControls.tsx:9,40`; `src/app/(tabs)/layout.tsx:3,11`; [#972](https://github.com/aibraincoach/my-food-ai/issues/972)).
   - **What this is:** Tabs import NavigationControls, which statically imports CaptureSheet and its camera, barcode and food-search dependencies.
   - **Problem:** Opening Home pulls that code into the initial dependency graph even for a person who never taps capture. The source-byte count is not the compressed bundle saving.
   - **Fix:** Load CaptureSheet on the first capture intent with immediate feedback, and retain its new chunk in the service worker's offline shell asset policy.
   - **If we skip it:** Every first Home load keeps paying unused entry-code download/parse work. No claim that the full 121 KB of source equals removable transfer bytes is made.

7. **The detail's updating poll stays on its old timer when the tab returns** (`src/components/OutlineOverlay.tsx:164-192`; [#968](https://github.com/aibraincoach/my-food-ai/issues/968)).
   - **What this is:** The detail retries a changing meal with a backoff that reaches 30 seconds.
   - **Problem:** A timer firing while hidden skips the read and schedules another timer. Returning just after that tick does not wake this poll, so a disconnected realtime channel can leave the person waiting nearly 30 seconds.
   - **Fix:** Reset and wake this existing poll on visibility return, with its current in-flight guard and cleanup; do not create a second polling mechanism.
   - **If we skip it:** The user can see old detail data until the timer expires. Fleet 24's Thread poll repair is a separate component and does not repair this one.

8. **Traffic and wake use different waiting-work rules** (`src/lib/queue/traffic.ts:18`; [#967](https://github.com/aibraincoach/my-food-ai/issues/967)).
   - **What this is:** The traffic label counts every queued job, independently of the selected due-only tick repair.
   - **Problem:** Ten future cleanup rows and nothing runnable produce “medium” traffic, then retain that label for the 60-second cache interval.
   - **Fix:** Apply the intended due-work predicate to the existing traffic count and centralize that predicate with the wake's count.
   - **If we skip it:** A person sees apparent traffic from work that cannot run; PR 7 alone does not remove this mismatch.

9. **Different attachment refusals lose their diagnostic distinction** (`src/lib/posts/attach-photo.ts:9-12`; [#970](https://github.com/aibraincoach/my-food-ai/issues/970)).
   - **What this is:** The server catches reservation/completion errors through a shared “The photo could not be attached” prefix.
   - **Problem:** Except for expired stages, several underlying refusals have the same top-level message, making the reported owner failure hard to attribute. This audit does not identify which refusal caused that historical failure.
   - **Fix:** Keep safe condition codes through the existing structured error path and map them to a useful user message; keep secrets and private row data out of public diagnostics.
   - **If we skip it:** The next reported attachment failure can again lack the evidence needed to distinguish its cause. The draft/reconciliation safety rules should remain intact.

10. **A no-photo failed meal can show conflicting failure wording** (`src/components/OutlineOverlay.tsx:258,280`; `src/components/Thread.tsx:42`; [#973](https://github.com/aibraincoach/my-food-ai/issues/973)).
    - **What this is:** The no-photo area and the thread each print their own failure sentence.
    - **Problem:** A previously analysed meal whose update failed can say it “could not be analysed” in one region and “could not be updated” in another. This is a correctness finding already filed during Part A, not a measured slowdown.
    - **Fix:** Reuse the existing initialization/failure-state rule for both sentences; do not infer a new analysis failure from the absence of a photo.
    - **If we skip it:** A person receives an incorrect explanation of the failed operation. Fleet 24 PR 2's no-photo combination still needs its explicit check.

**Nice to have**

11. **Three unreferenced source files add maintenance work** (`src/components/NutritionImage.tsx:1`, `src/components/SafeImage.tsx:1`, `src/lib/queue/enqueue.ts:1`; [#971](https://github.com/aibraincoach/my-food-ai/issues/971)).
    - **What this is:** The three files contain 51 lines and 2,808 bytes in total.
    - **Problem:** A tracked-tree search across source, tests, fixtures, scripts, tools, eval and configuration found the component/export names only in their definitions and no queue-helper import. Historical documentation mentions them, so deletion still needs an explicit owner keep/archive decision.
    - **Fix:** Delete these three files after the existing keep/archive decision, and recheck the existing app commands; do not add replacement wrappers.
    - **If we skip it:** The repository retains code with no executable caller. It is not in the client dependency graph, so deleting it does not improve phone load time.

Verdict: bound attachment waits and remove empty worker wakes first; measure the photo miss and actual background-page request costs before attributing the slowdown.

Lean: -51 lines, -0 dependencies possible from the three verified source files. No one-off script or evidence deletion is proposed. The tracked ten `scripts/run*` files total 109,188 bytes and evidence holds 597 files/37,969,306 bytes, but script entry points and receipts can be operational records even when nothing imports them; those counts do not prove they are safe to delete or that they reach a phone.

Not checked: runtime load or throughput, production, paid providers, every browser state, or every repository file. The audit mapped 192 files in the named source areas and deeply read 41 plus four partial component reads; 147 other files in those areas were not read. Specific deep paths covered tab entry pages, Feed/feed readers, realtime/readiness observers, post actions, upload manager/attachment/encoding, photo routes/resizing/cache policy, queue tick/claim/lease/drain, middleware and the complete service worker. Selected tests were read, not executed by A8. Deeper camera/barcode UI, voice UI, profile subpages, editing/correction helpers, remaining media helpers, most tests and the model/nutrition/database internals were not audited end to end. The unread-file list below is included here so the coverage limit can be assessed without private handoff files. Scope is Scale, Speed and Lean; this is not a security or food-accuracy certification.

The following named-scope files were not read beyond the path/reference inventory. Names below are relative to each stated directory, so this coverage limit travels with the committed report:

- `src/app/(tabs)/`: `days/loading.tsx`, `error.tsx`, `profile/CameraModeSwitch.tsx`, `profile/IdentifyProviderSwitch.tsx`, `profile/about/page.tsx`, `profile/deleted/DeletedPosts.tsx`, `profile/deleted/page.tsx`, `profile/loading.tsx`, `search/loading.tsx`.
- `src/components/`: `Avatar.tsx`, `BarcodeScanner.tsx`, `BottomBar.tsx`, `BrandMark.tsx`, `CameraPreview.tsx`, `Carousel.tsx`, `CleanFreshMarker.tsx`, `CommentComposer.tsx`, `ComposerDrinks.tsx`, `ConnectAgentRow.tsx`, `CorrectProductAction.tsx`, `CorrectProductSheet.tsx`, `DayHeader.tsx`, `DayRings.tsx`, `DaysScreen.tsx`, `DaysView.tsx`, `DeletePostSheet.tsx`, `DesktopDays.tsx`, `DesktopHomeFrame.tsx`, `DesktopToday.tsx`, `DesktopWorkspace.tsx`, `DoubleTap.tsx`, `DrinkPicture.tsx`, `EatenAtEditor.tsx`, `FacebookButton.tsx`, `FeedCacheMutations.tsx`, `FoodSearchPanel.tsx`, `GoToMonthSheet.tsx`, `HCaptcha.tsx`, `IntakeBar.tsx`, `IntakeSheet.tsx`, `ItemEditSheet.tsx`, `ItemRows.tsx`, `LightComposer.tsx`, `LiveNutritionCard.tsx`, `LocalTime.tsx`, `LocalTimeZone.tsx`, `LogAgainSheet.tsx`, `ModeStrip.tsx`, `MonthGrid.tsx`, `NeedsInputSheet.tsx`, `NeedsInputStrip.tsx`, `NutritionSummary.tsx`, `NutritionTable.tsx`, `OpenFoodFactsAttribution.tsx`, `PhoneCalendar.tsx`, `PlusMenu.tsx`, `PostCaption.tsx`, `PostCard.tsx`, `PostCreatedListeners.tsx`, `PostDetail.tsx`, `PostDetailHeader.tsx`, `PostDetailSkeleton.tsx`, `PostHandle.tsx`, `PostMenu.tsx`, `PostOpenFrame.tsx`, `PostOpenTransition.tsx`, `PostPageShell.tsx`, `ProfileAvatarControl.tsx`, `ProfileGrid.tsx`, `ProfileNutritionTile.tsx`, `PushPrompt.tsx`, `ResultsCard.tsx`, `SavePhoto.tsx`, `SavedMealListeners.tsx`, `SavedMealsButton.tsx`, `SavedMealsSheet.tsx`, `SearchBox.tsx`, `ServiceWorkerRegistration.tsx`, `ShellHome.tsx`, `ShortcutsDialog.tsx`, `Sidebar.tsx`, `SignOutButton.tsx`, `StoryPlayer.tsx`, `ThumbsFeedback.tsx`, `UndoToast.tsx`, `UploadBar.tsx`, `UploadingPost.tsx`, `VoiceButton.tsx`, `VoiceRecorder.tsx`, `ui/Button.tsx`, `ui/Field.tsx`, `ui/Icon.tsx`, `ui/Sheet.tsx`, `ui/Shimmer.tsx`, `ui/Tooltip.tsx`, `ui/TopBar.tsx`, `useCachedFeed.ts`, `useDrinkCard.ts`, `useRemovalMenus.ts`, `useUploads.ts`.
- `src/lib/media/`: `camera-mode.ts`, `camera.ts`, `media-url.ts`, `paths.ts`, `photo-box.ts`, `retained-image.ts`, `upload-window.ts`.
- `src/lib/posts/`: `barcode-correction.ts`, `bubble.ts`, `caption-client.ts`, `caption.ts`, `comment-label.ts`, `copy-operation.ts`, `copy-request.ts`, `correction-feedback.ts`, `create.ts`, `day-total-changes.ts`, `day-totals-refresh.ts`, `days.ts`, `delayed-action.ts`, `deleted.ts`, `drink-request.ts`, `eaten-at.ts`, `feed-cache-mutations.ts`, `feed-cursor.ts`, `feed-order.ts`, `feedback-errors.ts`, `feedback-optimistic.ts`, `feedback.ts`, `food-operation.ts`, `food-request.ts`, `grid.ts`, `home-today.ts`, `retry-kind.ts`, `retry.ts`, `save-optimistic.ts`, `saved-summary.ts`, `saved.ts`, `servings.ts`, `summary-line.ts`, `tap.ts`, `timeline.ts`, `today-view.ts`, `upload-draft.ts`, `upload-store.ts`, `upload-target.ts`, `visible-month.ts`.

Partial component reads only: `src/components/OutlineOverlay.tsx` (original-image loading, updating poll and failure regions), `src/components/FirstRunHint.tsx` (profile-read and hint path), `src/components/CaptureSheet.tsx` (entry/upload call sites), and `src/components/Thread.tsx` (retry and failure-wording path). These partial reads are not certification of the remaining branches.

## 7. What the planner would look at first

From reading the code, in order of likely effect:

1. The photo address change (Fleet 21). Every photo got a new address, so every phone's stored copies went unused once. A photo not in Vercel's cache is resized on demand from the full original, four at a time for each server instance, and a busy resize sends the phone the full original. Readings A3 and A4 measure it.
2. The worker wake (#966). For three hours after any photo upload the app wakes the worker on every open and polls it once a minute. Readings A6 and A7 measure it.
3. Home refreshes its whole server page every 60 seconds while it is on screen, and again on every return to the tab (PostReadinessListener). This is older than Fleet 21.
4. Each feed card loads two meal pages in the background before any tap. Reading A2 counts them.
5. The capture sheet loads with Home.

What the local readings change: A2 confirms that these windows contain background page loads and repeated requests, but cannot rank their real-user effect: HTTP caches were primed, response events cross window boundaries, and the old build was unstable against the later schema. Do not infer a speedup, a physical byte saving, or the cause of the old build’s repeated navigation from the arithmetic differences. A3 supplies no resize measurements because F1 failed its bounded setup premise, so the photo-address-first ranking remains a source hypothesis pending A4. A4 to A7 remain deferred until after the ordered merges/deployments; this report makes no production completion claim.
