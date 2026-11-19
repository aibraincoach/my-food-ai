# Ponytail audit — 2026-11-19

What this repo does: My Food AI keeps a private meal history, accepts photos and text, and calculates nutrition through a background worker. Signed-in people read their feed, day totals and meal details; corrections keep a history of earlier values.

Assumed load: the owner and a handful of accounts, several investor-demo viewers at once, worker concurrency one (`src/lib/worker/concurrency.ts`) and the minute database wake. No throughput, CPU or phone-speed measurement was made.

This is the first audit using all six Ponytail axes, at `b808dc5057bd71a3df248be29298d2a38747578b`, using DietrichGebert/ponytail `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`. It is a source audit with explicit coverage limits, not a full runtime certification. No application source was changed.

## Method and result

All eleven passes are recorded. P0 mapped every page/API, six worker handlers and script/SQL entry points; P1 traced session and agent-token access with the schema chains in P6; P2–P5 read screens, uploads, worker/model and nutrition paths; P7 read operator tools; P8 read test code. P9 checked debt markers and P10 checked duplication and references. The tests include real controlled trust-boundary tests; no missing test was inferred just from an unfamiliar filename.

Independent reviewer source checks covered all 65 candidates. One candidate was dropped as an existing owner decision. The remaining **64 findings: 11 Must fix, 38 Should fix, 15 Nice to have; 50 tagged rule 5**. Tiers: T1: 30, T2: 20, T4: 14. The reviewer changed several groups; diagnostic-only and intentionally degraded displays are not ranked as meal-data loss. The eight interim Must findings were sent to the PM before this final report.

Coverage: **45,668 / 59,386 text lines read in full**, across 883 of 937 tracked files; 40 skimmed and 14 binaries not read. [Every file and pass count](ponytail-audit-2026-11-19-coverage.md). Superseded SQL and recorded fixtures are deliberately not counted as full reads.

A database policy is a rule limiting which account sees a row. A security-definer function runs with its database owner’s rights, so its explicit caller and ownership checks matter. These were traced through source replacements; no live cross-account isolation or migration replay was executed. The report establishes no new cross-account data leak.

## Ranked findings

The headline list is limited to 20 findings, ordered by group, then exposure tier, then bug, risk, scale, missing test, speed and lean. Numbers remain stable in the further-findings section. Rule 5 is the owner’s instruction to remove replaced paths and make failures visible; a policy hit does not by itself prove bad nutrition.

### Must fix

1. **A failed capture download closes the entry without explaining why** (P2-01; `src/components/NavigationControls.tsx:25-32`; `src/components/NavigationControls.tsx:47` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: #1191 (open; filed by the PM’s separate interim order); related: closed #972; its clear immediate feedback acceptance does not hold on failed/slow chunk load · Confirmed by: reading
   - What this is: Navigation downloads the camera and text composer as a separate browser file.
   - Problem: If that download rejects after a camera/text tap, the rejection handler clears the entry and shows no error. While it is loading there is also no immediate pending view.
   - Fix: Keep the entry open with a loading state, then show its load failure and an explicit retry button.
   - If we skip it: The normal posting entry appears to ignore the tap or disappear.

2. **Days turns a failed intake read into no recorded intake** (P3-01; `src/lib/posts/days.ts:90-114`; `src/lib/posts/days.ts:256-269`; `src/components/StoryPlayer.tsx:146` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: #1192 (open; filed by the PM’s separate interim order); related: open #164 covers day story; month branch extends same failure class · Confirmed by: reading
   - What this is: Days reads the water and caffeine recorded for each day.
   - Problem: If any intake_logs page fails, getDays returns the meals with emptyIntake zeros and StoryPlayer hides the intake line. The month reader separately stops on error and returns a partial success.
   - Fix: Represent failed intake as unavailable, propagate the month error, and show a visible failure beside the preserved meals.
   - If we skip it: A saved drink disappears from the day view without explanation.

3. **Malformed food-search data becomes an empty successful search** (P5-02; `src/lib/fdc/client.ts:129-164`; `src/lib/fdc/client.ts:204-228` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: #1193 (open; filed by the PM’s separate interim order); related: none · Confirmed by: reading
   - What this is: asFoods parses USDA food-search responses.
   - Problem: A successful HTTP response with an invalid payload such as {error:"upstream unavailable"} has no foods array. asFoods returns [], caches it as a valid empty search, and the matcher can advance to approximation or estimation instead of exposing the malformed provider result.
   - Fix: Validate the response envelope and reject malformed responses; reserve [] for a valid foods:[] result.
   - If we skip it: A provider failure can turn into different nutrition and then remain cached as a legitimate no-hit answer.

4. **Food, drink and copied-meal requests can wait forever** (P3-02; `src/lib/posts/upload-manager.ts:365-407`; `src/lib/posts/upload-manager.ts:351-363` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: no · Issue: #1194 (open; filed by the PM’s separate interim order); related: closed #969 fixed added-photo waits; these sibling paths were outside its scope and remain unbounded · Confirmed by: reading
   - What this is: The upload manager posts saved selections in the background.
   - Problem: submitFood, submitDrink, submitCopy and cancellation fetches have no deadline. A request that never settles keeps entry.active set, so failure handling and manual retry never start.
   - Fix: Apply the existing JSON_REQUEST_LIMIT_MS deadline to these fetches, retaining the same operation receipt for explicit retry.
   - If we skip it: The pending post stays Saving or Removing indefinitely.

5. **Incomplete model search is reported as no matches** (P3-05; `src/lib/search/query.ts:33-35`; `src/app/api/search/route.ts:12-13` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: #1195 (open; filed by the PM’s separate interim order); related: none; all-state searches fallback and search failure · Confirmed by: reading
   - What this is: Search asks the model to interpret a search when direct matching is insufficient.
   - Problem: If the response status is not completed or outputText is empty, searchPosts returns an empty result as a success. The route therefore sends HTTP 200, even though search interpretation failed.
   - Fix: Throw a clear search failure and reuse the route’s existing 503 error response.
   - If we skip it: A person is told there are no matching meals when the search did not complete.

6. **A stale vote silently votes on a newer unseen analysis** (P3-10; `src/lib/posts/feedback.ts:7-13`; `src/components/ThumbsFeedback.tsx:23-24`; `src/components/DoubleTap.tsx:17` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: #1196 (open; filed by the PM’s separate interim order); related: closed #389 limited stale retry behavior; silent revision reassignment remains; open #123 is related but covers queued/processing only · Confirmed by: reading
   - What this is: Thumb buttons and double taps save approval of one displayed analysis revision.
   - Problem: A viewer sees analysis A while a concurrent correction creates B. The API rejects A with 409, but sendFeedback takes B from the response and resends the same vote on B without asking the viewer.
   - Fix: Delete the 409 resubmit branch. Show the existing save error, refresh the visible analysis, and require a new vote on that analysis.
   - If we skip it: An unseen analysis receives approval that belonged to the older one.

7. **A label retry discards recovered values unless macro count rises** (P4-09; `src/lib/meta/label.ts:27-31`; `src/lib/meta/label.ts:65-71` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: no · Issue: #1197 (open; filed by the PM’s separate interim order); related: #881 (open; also #830, #787, #739) · Confirmed by: reading
   - What this is: A cropped label answer can fill values missing from the first answer.
   - Problem: First answer: protein=null, carbs=10, fat=2, sodium=null. Retry: protein=null, carbs=10, fat=2, sodium=100. macroCompleteness remains two, so all recovered sodium is discarded.
   - Fix: Merge every valid recovered value with mergeLabelReading; do not gate the merge on the core-macro count.
   - If we skip it: Printed sodium, fibre, sugar or calories remain unavailable even after a successful read recovered them.

8. **Food search ignores energy records that meal analysis supports** (P5-12; `src/lib/fdc/serving.ts:8-10`; `src/lib/fdc/nutrients.ts:10-12`; `src/app/api/fdc/search/route.ts:19-23` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: no · Issue: #1198 (open; filed by the PM’s separate interim order); related: none · Confirmed by: reading
   - What this is: Search results show calories for one serving.
   - Problem: For a valid Foundation food whose only energy nutrient is 2048 with value100KCAL, caloriesPerServing returns null because it accepts only1008. scaleNutrition accepts2048 and reports100kcal for100g of the same food.
   - Fix: Keep the energy selection/conversion in src/lib/fdc/nutrients.ts and reuse it for serving calories; delete the independent1008-only reader.
   - If we skip it: The food-search picker shows unavailable calories for a food the meal pipeline can calculate.

9. **New barcode meals lose the barcode needed for later product correction** (P6-1; `supabase/migrations/0060_label_serving_unit.sql:2-67`; `supabase/migrations/0071_job_retention.sql:81-143`; `supabase/migrations/0025_barcode_corrections.sql:54-66`; `src/app/api/posts/food/route.ts:99-102`; `src/app/api/posts/[id]/items/route.ts:27-28` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: no · Issue: none · Confirmed by: reading
   - What this is: Food publication receives the scanned barcode in p_nutrition.gtin and later product correction looks up the current item by that barcode.
   - Problem: 0060 (repeated in 0071) replaces create_food_post with the full create_food_post_without_gtin body and never writes post_items.gtin. The wrapper from0025 that performed that write is gone; publish_food_operation delegates to the replacement and does not restore it. A newly posted barcode meal therefore has a null item gtin, and its later correct_product lookup returns Product not found.
   - Fix: Keep the guarded creation helper and restore one barcode-stamping creation path. Delete the duplicate creation body and add a final-schema post-then-correct barcode regression.
   - If we skip it: A scanned meal posts successfully but the owner cannot correct that product afterward.

10. **Cleanup deletes unmerged closed-PR branches** (P7-01; `scripts/cleanup.sh:39-51` at b808dc50)
   - Tier: T4 · Axis: risk · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: The cleanup tool removes completed worktrees and branches.
   - Problem: A clean branch whose PR is CLOSED without merging passes the same condition as MERGED. The script removes its worktree, forcibly deletes the local branch, and deletes the remote branch. Errors are also discarded, so later deletion continues after an earlier step fails.
   - Fix: Require proof that commits are merged before deleting branch references; retain unmerged closed work. Stop and report if worktree or branch removal fails.
   - If we skip it: An operator can lose the normal local and remote references to rejected but still valuable committed work.

11. **A review output option can recursively delete the repository** (P7-02; `scripts/review/agy-review.mjs:115-120`; `scripts/review/agy-review.mjs:316-323` at b808dc50)
   - Tier: T4 · Axis: risk · rule 5: no · Issue: none · Confirmed by: reading
   - What this is: writePacket recreates the chosen review output directory.
   - Problem: Invoking the tool with valid --base/--head and --out=. resolves outDir to the repository, then rmSync recursively deletes it, including .git, before buildManifest runs. --dry-run still reaches writePacket.
   - Fix: Use a fresh dedicated packet directory; refuse existing unowned directories and protected roots/ancestors before any removal.
   - If we skip it: A mistyped output option destroys source, git history in that checkout, and uncommitted owner state.


### Should fix

12. **Removing an avatar can report success after its reads or storage deletes fail** (P1-2; `src/app/api/profile/avatar/route.ts:11-18`; `src/app/api/profile/avatar/route.ts:73-86` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: The Profile photo route reads the current avatar, clears its profile pointer, then removes stored images.
   - Problem: A failed initial profile read is treated as no avatar and returns ok:true. Storage remove/list error objects are also ignored. In the first case the avatar remains and the client receives success; in the latter cases private image objects can remain after a successful removal response.
   - Fix: Check each read/remove/list result and return a visible refusal on failure. Keep the existing ordered delete path, without a silent second cleanup attempt.
   - If we skip it: The viewer sees a photo removal succeed when it did not complete.

13. **Hint dismissal retries once and then discards its save failure** (P2-03; `src/components/FirstRunHint.tsx:43-52` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: open #130; its retry request predates and conflicts with owner rule 5 · Confirmed by: reading
   - What this is: The hint disappears when the person dismisses it.
   - Problem: If saving the dismissal fails, it silently calls dismissHint again; if both fail, the hint remains claimed in memory and there is no failure message.
   - Fix: Delete the second dismissHint call; keep one save. The hint returning on reload already makes an unsaved dismissal visible; do not add a retry loop.
   - If we skip it: The person sees a dismissed hint as saved even though it can return after reload.

14. **Failed profile reads become a cached blank identity** (P2-04; `src/components/PostHandle.tsx:15-20`; `src/lib/posts/feed.ts:146-149`; `src/lib/posts/feed.ts:261-267` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none; all-state search profile read · Confirmed by: reading
   - What this is: Cards and navigation share the signed-in person’s handle and avatar.
   - Problem: A profiles query returning an error is treated as data=null, producing an empty handle and no avatar. PostHandle caches that resolved result until an identity event or account change; the batched feed has no profile-unavailable flag.
   - Fix: Reject failed profile reads, preserve any known identity, and surface an unavailable identity state. Owner choice needed for the documented degradation behavior.
   - If we skip it: A normal account can lose its visible identity without any failure indication.

15. **Post saves silently retry every failure three times** (P3-04; `src/lib/posts/upload-manager.ts:416-478` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none; all-state search quiet retry · Confirmed by: reading
   - What this is: The manager sends new meals and the less-used food, copy and drink requests.
   - Problem: Every thrown submission error, including a deterministic HTTP refusal, is delayed two seconds and then six seconds and tried again before a failed state is published.
   - Fix: Delete the automatic retry loop, preserve durable files and operation identity, and expose the first failure with the existing Try again action.
   - If we skip it: The real refusal is hidden while the app repeats the same rejected write.

16. **The camera retries acquisition and falls back from still capture silently** (P3-11; `src/lib/media/camera.ts:48-67`; `src/lib/media/camera.ts:105-115`; `src/components/CaptureSheet.tsx:394-401` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: open #131 covers silent facing mismatch; still-photo fallback is a separate case; all-state search fallback · Confirmed by: reading
   - What this is: The browser camera helper flips cameras and captures a full-resolution still.
   - Problem: A contention error stops the old stream, retries the requested camera and restores the old camera if necessary; final failure is shown. Separately, a still-photo timeout or failure silently returns a video-frame JPEG. The latter is a documented supported fallback but loses still-photo quality.
   - Fix: Choose one supported capture route or an explicit user choice, then delete the silent still-to-frame fallback. Preserve the existing visible flip error; do not describe it as an entirely hidden failure. Owner choice needed for the documented degradation behavior.
   - If we skip it: A failed high-resolution capture can post a lower-resolution frame without explaining the failure.

17. **A successful camera flip can leave the same camera selected** (P3-13; `src/lib/media/camera.ts:4-5`; `src/lib/media/camera.ts:35-47`; `src/lib/media/camera.ts:71-78` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: open #131; same known case still holds · Confirmed by: reading
   - What this is: The capture sheet asks this helper to switch from rear to front camera or back again.
   - Problem: The facingMode string is only a preference. If the browser resolves the request with the current camera again, flip stops the old stream and records the opposite facing without checking the returned track. The preview never flips.
   - Fix: Require the target facing for flip and verify any selected device before updating facing. Keep the initial best-effort preference only for the first open.
   - If we skip it: The camera-flip control can appear to do nothing and its next request uses an incorrect internal facing.

18. **Model failures quietly start another provider attempt** (P4-01; `src/lib/meta/client.ts:74-143`; `src/lib/meta/retry404.ts:5-12` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: The model client decides how one failed provider call ends.
   - Problem: A 500 or timeout is retried inside fetchWithRetry and the SDK enables one retry. A 404 can start four createResponse calls based only on status, even for a permanent missing-resource response. The first failure is not exposed.
   - Fix: Keep one adequately configured provider attempt and propagate its failure; delete the in-call retry loops. Leave the separately documented queued recovery unchanged pending an owner decision.
   - If we skip it: The person waits through hidden repeated calls and costs. Removing the gateway workaround can make transient failures visible sooner; the PM must choose its replacement behavior.

19. **Card failure publishes ready through an alternate path** (P4-04; `src/lib/pipeline/persist.ts:158-176`; `src/lib/pipeline/results-card.tsx:65-73` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: markReady renders and publishes a stored nutrition image.
   - Problem: When renderResultsCard fails, markReady logs it and calls mark_post_ready anyway. A failed regeneration can leave the old stored image while the meal is ready. Storage removals of rejected/old card objects also ignore their returned errors.
   - Fix: Keep one publication contract with an explicit stored-card error state while preserving correct meal nutrition. Check cleanup results separately. The owner must decide whether a ready meal may lack a regenerated stored image. Owner choice needed for the documented degradation behavior.
   - If we skip it: A viewer can see stale exported-card nutrition or accumulate unremoved images while the meal appears successful. Broad photo/card issue #222 is related, but no specific open issue found.

20. **A failed identify-provider settings read silently selects Meta** (P4-08; `src/lib/pipeline/analyze.ts:253-261` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Analysis reads the account setting that chooses its identify route.
   - Problem: The query ignores returned error and the catch discards thrown errors; any failed read leaves provider=meta. This is separate from the documented 75-second open-model shortcut.
   - Fix: Read and check error/status and fail visibly when the setting cannot be read.
   - If we skip it: A settings outage switches the model host without telling the owner.


## Further findings, by pass

These 44 additional verified findings have the same four-part form. Their numbers come from the full ranked order.

### P1

Group: **Should fix**.

24. **A failed sign-up cleanup can leave an account with no profile** (P1-1; `src/lib/auth/actions.ts:37-44` at b808dc50)
   - Tier: T1 · Axis: risk · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: A failed profile insert triggers deletion of the just-created Auth account.
   - Problem: If deleteUser returns an error object, it is ignored; if it throws, the catch also ignores it. The person sees only the profile error while the Auth account can retain the email, preventing a clean sign-up retry.
   - Fix: Check and preserve the rollback error, report that account cleanup failed, and use one explicit recovery path instead of claiming the rollback succeeded.
   - If we skip it: A new viewer can become stuck between account creation and a usable profile.

Group: **Nice to have**.

55. **An avatar upload is buffered before the byte limit is checked** (P1-4; `src/app/api/profile/avatar/route.ts:25-35`; `src/lib/profile/avatar.ts:16-19` at b808dc50)
   - Tier: T1 · Axis: risk · rule 5: no · Issue: #817 (open) · Confirmed by: reading
   - What this is: The avatar route accepts a multipart image and enforces an eight-MiB image limit.
   - Problem: request.formData() has already buffered the upload before the file is copied with arrayBuffer and the 8 MiB image limit is checked. A too-large request therefore allocates memory before refusal.
   - Fix: Check the request byte limit before formData, then check the Blob size before making the second copy. Keep the existing image validation.
   - If we skip it: A malformed or oversized profile photo uses avoidable server memory.


### P2

Group: **Should fix**.

31. **Drink-card reads retry quietly and hide the final failure** (P2-02; `src/components/useDrinkCard.ts:35-71` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none; all-state searches drink retry and quiet retry · Confirmed by: reading
   - What this is: This hook fills drink details for cards.
   - Problem: An HTTP failure or a successful null result schedules up to three extra reads at one, two and three seconds. Final failure leaves the prior value or null with no error state.
   - Fix: Remove the retry timers and return a visible unavailable state plus an explicit retry action.
   - If we skip it: A reader cannot tell failed drink details from no drink.

Group: **Should fix**.

32. **The photo-drink composer quietly repeats a conflict for 90 attempts** (P2-06; `src/components/ComposerDrinks.tsx:23-36` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none; all-state search drink identify · Confirmed by: reading
   - What this is: Uploaded photos are checked for drinks before offering the drink-specific composer.
   - Problem: A 409 response silently waits a second and retries up to 90 times. The effect has no cancellation guard, so the loop continues after the photo changes or the component leaves.
   - Fix: Remove the retry loop; expose a pending or conflict result once, and require a new explicit check after a visible failure.
   - If we skip it: A refusal produces up to 90 background requests and no explanation until the loop ends.

Group: **Nice to have**.

50. **Failed meal and day refreshes keep stale data without a warning** (P2-07; `src/components/RealtimePost.tsx:40-58`; `src/components/DaysView.tsx:96-128`; `src/components/DaysView.tsx:148-156`; `src/lib/posts/day-totals-refresh.ts:25-31` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none; all-state search quiet retry and profile read · Confirmed by: reading
   - What this is: These listeners refresh already visible meals and day totals after changes.
   - Problem: If the read after a correction or another-tab deletion fails, these catches keep the old card/month/day totals and suppress the error. The UI offers no unavailable marker, unlike the feed’s flagged optional reads.
   - Fix: Preserve the last complete display but mark the failed fields unavailable and wire a visible manual retry into the existing reader. Owner choice needed for the documented degradation behavior.
   - If we skip it: A viewer can keep seeing the previous meal numbers or day count as though they were current.

Group: **Nice to have**.

51. **Failed high-resolution photo reads silently switch to another image path** (P2-08; `src/components/OutlineOverlay.tsx:77-117`; `src/components/Carousel.tsx:123-126`; `src/components/PostOpenFrame.tsx:33-38` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none; all-state search signed original; related closed #497 fixed repeated original downloads · Confirmed by: reading
   - What this is: The detail and feed progressively load sharper versions of a meal photo.
   - Problem: A broken cached original probes a fresh signed original, then detail clears it back to the preview. Non-priority feed/open-frame images clear srcset on error and let the browser retry the base image, with no visible failure.
   - Fix: Keep the displayed preview, show the sharper-image failure, and make loading another representation an explicit retry action. Owner choice needed for the documented degradation behavior.
   - If we skip it: Image failures disappear into another route and viewers cannot tell that the requested resolution failed.

Group: **Nice to have**.

58. **Replacing a leftovers photo can repeat a refused delete 120 times** (P2-05; `src/components/Carousel.tsx:40-58` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none; all-state search replace leftovers; closed #349 introduced feature, not this failure · Confirmed by: reading
   - What this is: Replacement attaches the new photo, then removes the old one.
   - Problem: While a replacement waits for analysis to become ready, deleting the old photo returns 404. The client repeats every two seconds up to 120 attempts and also listens for ready; the final non-OK error is shown. This is a documented bounded wait, not an unlimited retry.
   - Fix: Ask the owner whether the ready event can be the sole trigger; if that delivery is proved, delete the timer and keep a visible refusal. Do not delete the only recovery path without that proof. Owner choice needed for the documented degradation behavior.
   - If we skip it: The app repeats a failed destructive request for about four minutes with no explanation.

Group: **Nice to have**.

59. **Automatic push registration hides its failures** (P2-09; `src/components/PushPrompt.tsx:45-60` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none; all-state search push error · Confirmed by: reading
   - What this is: After a post, an installed app with notification permission registers this browser.
   - Problem: A rejected registration request or owner-reconciliation failure is discarded by catch(() => {}). Only the manual Enable path displays its error, so already-granted notification setup can fail silently.
   - Fix: Send these safe errors to the existing notification error state and show a retry action without changing the saved meal. Owner choice needed for the documented degradation behavior.
   - If we skip it: The person expects notifications after a post but this device may not be registered.


### P3

Group: **Should fix**.

25. **Saving a pending caption closes before the save is durable** (P3-14; `src/lib/posts/upload-manager.ts:191-197`; `src/components/UploadingPost.tsx:17` at b808dc50)
   - Tier: T1 · Axis: risk · rule 5: yes · Issue: none; all-state search draft caption save · Confirmed by: reading
   - What this is: A failed pending upload allows its caption to be edited and saved on this device.
   - Problem: update changes the in-memory caption but discards the persistence promise; Save closes the editor immediately. If the IndexedDB write fails, reloading brings back the previous caption and no save error was shown.
   - Fix: Return and await the existing persistence promise before closing the editor; keep the draft open and show the write failure. Do not suppress a previous failed write without reporting it.
   - If we skip it: A person can lose a caption edit that the interface appeared to save.

Group: **Should fix**.

27. **Busy or failed photo resizing quietly serves the full original** (P3-03; `src/app/p/[file]/route.ts:24-45`; `src/lib/posts/feed-photo-response.ts:34-61`; `src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts:34-64` at b808dc50)
   - Tier: T1 · Axis: speed · rule 5: yes · Issue: open #222 and #375; closed #372 bounded normal responses but fallback remains; A8 #3 still holds · Confirmed by: reading
   - What this is: Feed routes resize a stored photo for the displayed card.
   - Problem: A fifth overlapping cache miss has no transformation slot and redirects to a signed original. Resize/source failure also switches to the original; the v1/v2 route can substitute a JPEG after resize failure.
   - Fix: Have the owner choose one bounded image path for overload, and delete the silent original redirect after that choice. The failure UI must show an unavailable photo; simply removing the redirect can break thumbnails because browsers do not retry another srcset candidate. Owner choice needed for the documented degradation behavior.
   - If we skip it: Several demo viewers can receive original-sized files just when the preview path is busy, with the resize failure hidden.

Group: **Should fix**.

33. **Push delivery errors are discarded** (P3-08; `src/lib/push/send.ts:22-36`; `src/lib/push/send.ts:53-59` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none; all-state search push error · Confirmed by: reading
   - What this is: This helper notifies the browser when a meal is ready or needs a reply.
   - Problem: A failed post/subscription query returns silently; non-expired provider failures are swallowed, and a failed expired-subscription delete is not checked. The caller receives normal completion.
   - Fix: Keep meal publication independent of optional push, and show a safe delivery diagnostic through a chosen user/operator surface. Never log endpoints or keys; do not fail a committed meal because push failed. Owner choice needed for the documented degradation behavior.
   - If we skip it: A person receives no notification and the delivery failure has no visible result.

Group: **Should fix**.

34. **Committed food, drink and copy repair errors are reduced to log lines** (P3-09; `src/lib/posts/saved.ts:44-48`; `src/app/api/posts/food/route.ts:36`; `src/lib/intake/post-drink.ts:62-75` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none; all-state searches copy operation and intake error · Confirmed by: reading
   - What this is: These saves perform hydration or card work after the meal transaction commits.
   - Problem: If follow-up work throws, each catch logs a sentence and returns the ordinary success shape; the failed repair state is not sent to the person.
   - Fix: Report a committed save with a visible partial failure through one explicit repair contract. Copies have a queued drink_sync repair; food and drink-tile publication have no such job established by this audit. Do not promise a repair remains queued when none exists.
   - If we skip it: A saved meal can return success while its drink/card update is incomplete.

Group: **Should fix**.

39. **Food, drink and copy saves keep routes without operation receipts** (P3-06; `src/lib/posts/copy-operation.ts:7-10`; `src/lib/posts/saved.ts:39-43`; `src/app/api/posts/food/route.ts:30-35`; `src/lib/intake/post-drink.ts:56-60` at b808dc50)
   - Tier: T2 · Axis: risk · rule 5: yes · Issue: none; all-state search copy operation · Confirmed by: reading
   - What this is: Normal saves use an operation identifier that prevents duplicate meals after a lost response.
   - Problem: The copy reader accepts a missing identifier and calls old copy functions. Food and drink saves likewise accept a missing identifier and call create_food_post/create_drink_post instead of their operation functions; repeating a lost-response request can create a second meal.
   - Fix: Require operation identifiers on every food, drink and copy POST. Keep the publish_*_operation paths and delete the direct creation branches.
   - If we skip it: An older or direct client can still create duplicate meals through the retained route.

Group: **Should fix**.

40. **Item edits ignore the failure to save their explanation** (P3-07; `src/lib/posts/items.ts:96-104` at b808dc50)
   - Tier: T2 · Axis: risk · rule 5: yes · Issue: none; all-state search comment note · Confirmed by: reading
   - What this is: A direct item edit writes a note in the meal’s comment thread.
   - Problem: After the item-edit RPC succeeds, the separate post_comments insert is awaited without checking its error. A refused insert still returns item-edit success and the explanation is absent.
   - Fix: Commit the note in the existing edit transaction, or return a visible partial failure without repeating the committed item edit.
   - If we skip it: The meal changes with no explanation in the thread and no warning that the note was lost.

Group: **Nice to have**.

52. **Failed photo signing is treated as no photo** (P3-12; `src/lib/posts/days.ts:77-88`; `src/lib/posts/grid.ts:67-75`; `src/lib/posts/deleted.ts:22-23`; `src/lib/posts/feed.ts:161-165` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none; all-state search signed original; open #222 concerns photo loading generally · Confirmed by: reading
   - What this is: These readers turn private stored photo paths into usable URLs.
   - Problem: A failed signing request is ignored by Days, Profile and Recently deleted; the single-card feed mapper drops a failed slide. Profile can render a nutrition tile instead, while the card has no media-unavailable marker.
   - Fix: Keep a distinct photo-unavailable flag and show it at these callers; do not replace failed signing with an ordinary missing-photo result. Owner choice needed for the documented degradation behavior.
   - If we skip it: An existing photo disappears or becomes a nutrition tile with no explanation.


### P4

Group: **Should fix**.

26. **Lease renewal and release errors disappear** (P4-02; `src/lib/worker/drain.ts:58-76` at b808dc50)
   - Tier: T1 · Axis: risk · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: The worker keeps its exclusive lease alive while a job runs.
   - Problem: If a heartbeat renewal fails, its empty catch discards the error and the in-flight job continues. If enough renewals fail for the 60-second lease to expire, another tick may acquire a lease while this invocation still calls providers. Release errors are also discarded. Three failed 20-second renewals are needed to cross the lease lifetime. SQL row claiming still prevents two workers from claiming the same job; the risk is excess concurrent work, not proven duplicate processing.
   - Fix: Surface renewal/release failures and stop or cancel work when lease ownership is lost. Preserve the original work failure if cleanup also fails.
   - If we skip it: Two invocations can do overlapping provider work after lease loss, with no visible indication of the lease error.

Group: **Should fix**.

35. **Incomplete label reads quietly retry and keep partial success** (P4-05; `src/lib/meta/label.ts:62-90` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Label reading extracts printed values from meal photos.
   - Problem: A missing macro silently triggers a cropped model call; if it throws, the empty catch keeps the first reading. Additional-photo failures are skipped by catch/continue. No error from those failed attempts reaches the person. Unread nutrition remains null and is shown as unknown; this does not invent values.
   - Fix: Make the first incomplete read visible and require an explicit retry, and propagate failed photo reads instead of keeping partial success.
   - If we skip it: The person sees a successful partial label without knowing that the attempts meant to complete it failed.

Group: **Nice to have**.

53. **A reuse check makes a larger second call before choosing fresh analysis** (P4-06; `src/lib/meta/same-meal.ts:8-28`; `src/lib/pipeline/prior.ts:54-56` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: A model check decides whether earlier meal nutrition may be reused.
   - Problem: An unfinished reuse answer triggers a larger second call. Refusal, malformed JSON or unfinished content becomes false and chooses fresh analysis. HTTP/provider errors propagate; they are not swallowed. Reuse is documented as an optimization.
   - Fix: Use one adequate allowance for the reuse check and remove the silent second call; retain conservative no-copy behavior for an unusable answer, with safe diagnostics.
   - If we skip it: The optional reuse check can add a hidden paid call. It does not copy a meal on an invalid answer or conceal an HTTP failure.

Group: **Nice to have**.

54. **Analysis progress save errors only print a log** (P4-07; `src/lib/pipeline/pending-items.ts:3-9` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: The pipeline writes discovered names and calories for pending cards.
   - Problem: A failed write_pending_names or write_pending_kcal RPC is logged and ignored. Analysis keeps running while the pending card has no truthful error for its missing progress.
   - Fix: Keep the existing progress RPCs and expose their failure instead of returning successful void after an error.
   - If we skip it: A demo viewer can stare at stale or empty progress while the log is the only evidence.

Group: **Nice to have**.

56. **A failed trace write still reports a successful model call** (P4-03; `src/lib/trace/record.ts:56-73` at b808dc50)
   - Tier: T1 · Axis: risk · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Every model and food-resolution call writes a private trace row.
   - Problem: A model_calls insert returning an error or throwing only prints a log; recordCall still returns the model result. The owner sees a successful analysis with its required evidence absent.
   - Fix: Keep the single insert and the finished model result; provide a safe operator-visible trace-store diagnostic. A diagnostic failure must not turn correct meal nutrition into a failed meal.
   - If we skip it: Investigation evidence may be absent even though analysis succeeds. This is diagnostic loss, not lost meal nutrition.


### P5

Group: **Should fix**.

21. **Rate-limited USDA requests quietly wait and retry** (P5-03; `src/lib/fdc/client.ts:36-57` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: fdcFetch handles USDA HTTP 429 rate limits.
   - Problem: A 429 with retry-after:1 waits then issues the request again without surfacing the first failure. This is the immediate retry only: a longer/missing hint enters a separate durable queue state with a visible automatic-retry notice, which is not reported as quiet.
   - Fix: Return the immediate rate-limit failure visibly and remove the in-call retry. Keep any deliberately visible durable recovery distinct from this quiet path.
   - If we skip it: The meal silently keeps working through provider failures contrary to rule 5.

Group: **Should fix**.

22. **Incomplete nutrition model answers silently get larger attempts** (P5-04; `src/lib/fdc/match.ts:46-53`; `src/lib/fdc/approximate.ts:17-27`; `src/lib/fdc/estimate.ts:20-30` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Matcher, closest-food and estimate calls choose nutrition references.
   - Problem: When a model answer ends incomplete, each caller issues another request with a larger output allowance. The first failed answer is not shown as a failure. After a second incomplete answer the paths throw visibly; the finding is the extra quiet call, not permanent suppression of failure.
   - Fix: Use one adequate output allowance and surface an incomplete answer; remove the escalation loops.
   - If we skip it: The owner pays for repeated model reasoning while viewers only see continued waiting.

Group: **Should fix**.

23. **The blended food treats absent nutrients as known zero contributions** (P5-07; `src/lib/fdc/nutrients.ts:104-120`; `src/lib/fdc/approximate.ts:51-61` at b808dc50)
   - Tier: T1 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Rice and protein references are combined into one nutrition record.
   - Problem: For a 55% rice/45% protein blend, suppose rice has sodium=10 mg/100g and the protein has no sodium entry. The result stores 5.5 mg as complete sodium; the unknown protein contribution has silently become zero. Different-unit entries are also silently dropped after the first unit.
   - Fix: Emit a nutrient only when every positive-share component provides a compatible known value, or explicitly retain its unavailable state. Convert compatible units before combining.
   - If we skip it: Micronutrients or minor fields in this rice/protein approximation can be understated. The core macros and energy are present in the expected reference records; no live-provider behavior was tested.

Group: **Should fix**.

29. **Food detail keeps a legacy cache route and hides malformed current data** (P5-05; `src/lib/fdc/client.ts:260-267` at b808dc50)
   - Tier: T1 · Axis: lean · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Retained food detail is read from a cached envelope.
   - Problem: An envelope without kind is still parsed by legacy_cache beside fdc-detail-v1. A malformed current envelope is caught and silently replaced with a live provider read.
   - Fix: Keep fdc-detail-v1 only; migrate or invalidate old envelopes explicitly and make malformed current entries visible.
   - If we skip it: Old and current contracts remain coupled, and cache corruption starts an unseen provider route.

Group: **Should fix**.

30. **Old nutrition encodings remain active beside the compact format** (P5-11; `src/lib/nutrition/totals.ts:156-174`; `src/lib/fdc/nutrients.ts:155-166`; `src/lib/fdc/approximation-metadata.ts:28-36` at b808dc50)
   - Tier: T1 · Axis: lean · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Nutrition is read and written through several historical encoding shapes.
   - Problem: An unset NUTRITION_COMPACT_WRITE flag selects repeated legacy approximation metadata; setting it selects the compact shape. Readers also reconstruct pre-item-12 unscaled nutrient arrays and read per100 from either its current field or a nested legacy field. These are live old/new branches, not migration history alone.
   - Fix: After the explicit guarded format migration and reader-floor checks, keep the compact portion-basis contract and delete the legacy writer flag and old-shape reader adapters.
   - If we skip it: Every nutrition change must keep old and new runtime contracts correct together; the reader-first rollout comment documents the reason but is not a shortcut limit exemption.

Group: **Should fix**.

36. **Saved label data conceals a failed barcode provider** (P5-06; `src/lib/fdc/barcode-resolver.ts:18-22` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Barcode resolution combines provider lookup and the account correction.
   - Problem: When a complete saved label exists and USDA throws, the catch discards that error. Because base remains null, it then tries Open Food Facts; its errors may also be discarded before returning the saved label.
   - Fix: Ask the owner to choose the saved-label route explicitly before lookup when that label is authoritative, or retain provider enrichment with a visible partial result. Delete the silent provider-switch branch once that contract is chosen. Owner choice needed for the documented degradation behavior.
   - If we skip it: The user-verified label remains usable; the unresolved question is hidden lookup failures and extra provider enrichment calls, not wrong label numbers.

Group: **Should fix**.

37. **Drink correction maps database read failures to missing objects** (P5-08; `src/app/api/drinks/identify/route.ts:57-60` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: PATCH loads the drink reading and upload draft before saving a correction.
   - Problem: If the reading query returns {data:null,error:...}, error is ignored and the response says 404 Drink reading not found. If the draft query fails, it instead says 409 already posted.
   - Fix: Check each read error and return the existing visible temporary-unavailable response before interpreting missing data.
   - If we skip it: A person receives a false explanation of the failure and may abandon a valid draft.

Group: **Should fix**.

38. **Cup and piece edits silently choose the first size** (P5-13; `src/lib/nutrition/units.ts:14-25`; `src/lib/nutrition/units.ts:43-49`; `src/lib/posts/items.ts:74-83` at b808dc50)
   - Tier: T2 · Axis: bug · rule 5: no · Issue: #181 (open; PM waived as tracked) · Confirmed by: reading
   - What this is: A portion edit converts cups or pieces using USDA portion weights.
   - Problem: When one food lists a50g small piece and a100g large piece, the parser keeps both as unit=piece and toGrams(1,piece,portions) always chooses50g. The API cannot select the intended large modifier.
   - Fix: Keep the existing portion conversion and preserve/select the record modifier or refuse an ambiguous unit; add the focused mixed-size case to its test.
   - If we skip it: A person editing one large piece can halve its recorded weight and nutrients. The existing PM waiver remains nonblocking.

Group: **Should fix**.

41. **Drink cleanup and card errors are discarded after the operation** (P5-09; `src/app/api/drinks/identify/route.ts:39-48`; `src/app/api/drinks/post/route.ts:46` at b808dc50)
   - Tier: T2 · Axis: risk · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Drink publication and identification clean up claims and create cards.
   - Problem: A capped reading deletes its claim without checking error; a failed reading writes state=failed without checking error. A failed card render is log-only success. A failed claim cleanup can leave the reading pending and later POST calls return 409 indefinitely.
   - Fix: Check cleanup state writes and expose their failure; retain a durable visible recovery state after committed publication rather than logging card failure only.
   - If we skip it: The person may have a stuck draft or missing/stale stored card while the cause is hidden.

Group: **Should fix**.

42. **The old drink-publication route remains beside the operation route** (P5-10; `src/app/api/drinks/post/route.ts:22-33`; `src/app/api/drinks/post/route.ts:42` at b808dc50)
   - Tier: T2 · Axis: lean · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: Photo drinks support both a durable operation id and an older no-operation request.
   - Problem: A request omitting operation_id still takes a separate cancellation read and calls publish_composer_drinks; current requests call publish_photo_drink_operation. The code explicitly calls the first branch legacy clients.
   - Fix: Keep the durable operation route, require operation_id, and remove the legacy HTTP branch after its client contract is updated.
   - If we skip it: Two publication contracts must remain correct together; failures may take different cancellation and receipt paths.

Group: **Nice to have**.

57. **A failed food-search cache write is ignored** (P5-01; `src/lib/fdc/client.ts:222-227` at b808dc50)
   - Tier: T1 · Axis: risk · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: USDA search results are saved in fdc_cache after a network miss.
   - Problem: If upsert returns an error (including an aborted write), searchFoods ignores it and returns foods. The next identical search hits USDA again rather than the expected cache.
   - Fix: Keep the successful nutrition result and expose a safe cache-write diagnostic; do not fail an otherwise completed analysis for an optional cache write.
   - If we skip it: A lost cache write causes an additional USDA lookup, not lost nutrition.


### P7

Group: **Should fix**.

43. **The numbers card report turns unavailable stored calories into zero** (P7-04; `scripts/numbers/cards.mjs:33-38` at b808dc50)
   - Tier: T4 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: cards.mjs compares app-displayed calories with stored nutrition.
   - Problem: When every current food has calories=NULL or lacks a nutrition row, the stored reduction adds zero for each and prints stored_kcal=0. The app total correctly remains unavailable.
   - Fix: Use nutritionNumber/sumNutrition from src/lib/nutrition/totals.ts and print unavailable when no calories are known.
   - If we skip it: The operator can treat an unknown meal as a measured zero and misread the study comparison.

Group: **Should fix**.

44. **The queue inspector reports failed reads as an empty queue** (P7-07; `scripts/worker-local.mjs:37-42` at b808dc50)
   - Tier: T4 · Axis: bug · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: worker-local prints waiting and running job counts for an operator.
   - Problem: When all three Supabase reads return errors, their error fields are ignored and the command prints queued:0,running:0,oldest:null with a successful exit.
   - Fix: Check each query error/status before printing counts and fail visibly.
   - If we skip it: An operator can conclude the worker has no work when the database cannot be read.

Group: **Should fix**.

46. **The retained trace rollout gate demands a removed legacy behavior** (P7-03; `scripts/trace-rollout-smoke.mjs:8-16`; `src/lib/trace/record.ts:68-73` at b808dc50)
   - Tier: T4 · Axis: lean · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: The smoke script demands the actual database schema from before model/host columns.
   - Problem: The script first asserts those columns are absent, then expects recordCall to store one row. The current writer always includes model/host, so that insert fails and data.length is zero on the exact schema the gate requires.
   - Fix: Keep current-schema trace tests and delete the obsolete rollout smoke gate and its instructions.
   - If we skip it: An operator running the documented retained gate gets an inevitable failure rather than a meaningful release check.

Group: **Should fix**.

47. **Private-output helpers enforce different privacy rules** (P7-05; `scripts/numbers/study.mjs:28-29`; `scripts/numbers/mismatch.mjs:79-83`; `scripts/numbers/study-io.mjs:3-4` at b808dc50)
   - Tier: T4 · Axis: lean · rule 5: no · Issue: none · Confirmed by: reading
   - What this is: Study scripts write private mapping and nutrition evidence files.
   - Problem: study.mjs defines its own privateWrite that accepts any file and mismatch.mjs writes its own output files, while study-io refuses repository output and symlinks. prepare --map=./private-map.json writes the private meal map into the public checkout; the shared helper rejects that location.
   - Fix: Keep scripts/numbers/study-io.mjs as the one private-output helper; delete study.mjs and mismatch.mjs local copies and route map/output writes through it.
   - If we skip it: Private evidence can be staged with source files, and the two guards will keep drifting.

Group: **Should fix**.

48. **The wording checker is copied into its inventory script** (P7-06; `scripts/wording-inventory.mjs:17-18`; `scripts/wording-inventory.mjs:149-151`; `src/lib/pipeline/wording-check.ts:1-5` at b808dc50)
   - Tier: T4 · Axis: lean · rule 5: no · Issue: #820 (open) · Confirmed by: reading
   - What this is: The runtime and inventory script check the same banned words with the same regular expression.
   - Problem: The script explicitly says Keep in sync, and bannedHits repeats checkWording. Any new word must be edited twice or the inventory stops matching the runtime rule.
   - Fix: Keep src/lib/pipeline/wording-check.ts as the one checker; use its hits in the script and delete the copied list/checker.
   - If we skip it: The owner can receive a wording inventory that disagrees with the running app.

Group: **Nice to have**.

60. **An unreadable cost probe ledger becomes zero prior spend** (P7-08; `scripts/open-weights-trial.mjs:10-12` at b808dc50)
   - Tier: T4 · Axis: risk · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: The paid trial includes earlier probe usage in its five-dollar cap.
   - Problem: If /tmp/run7-b-probes.json exists but cannot be read, catch replaces it with [] and the cap starts with zero probe spend. The file failure is hidden.
   - Fix: Retain the historical trial as evidence unless its retirement is explicitly chosen. If it remains runnable, distinguish missing optional history from a failed read and fail visibly on the latter; do not assume zero spend.
   - If we skip it: The trial can exceed the intended combined probe-and-trial cap.


### P8

Group: **Should fix**.

49. **The same two micronutrient tests run from two files** (P8-4; `tests/micronutrient-coverage.test.mjs:1-21`; `tests/nutrition-totals.test.mjs:23-40` at b808dc50)
   - Tier: T4 · Axis: lean · rule 5: no · Issue: none · Confirmed by: reading
   - What this is: Both root test files test the same sumMicronutrients function.
   - Problem: Their two micronutrient test names, inputs and assertion bodies are identical. The standard root glob runs both files, repeating every case without adding a distinct failure check.
   - Fix: Keep the two tests in tests/nutrition-totals.test.mjs and delete tests/micronutrient-coverage.test.mjs (21 lines).
   - If we skip it: Every run and future change carries two copies of the same expected behavior.

Group: **Nice to have**.

61. **The fixture harness hides failed isolation writes behind three attempts** (P8-1; `tests/fake-meta/harness.mjs:103-108` at b808dc50)
   - Tier: T4 · Axis: test · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: After each worker drain, the test harness parks its queued fixture jobs in the distant future.
   - Problem: If the first parking write returns a database error and a later write succeeds, restored becomes true and the test passes. The earlier errors are neither reported nor retained. This is a quiet retry under owner rule 5.
   - Fix: Make the parking update once and fail with its error. Keep the existing cleanup/finally path so the worker lease and process globals are still restored.
   - If we skip it: A green test run can conceal a failed database write in the harness used to prove job isolation.

Group: **Nice to have**.

62. **The concurrent claim test also passes when the second lane waits for the first** (P8-2; `tests/job-ownership.test.mjs:31-40`; `supabase/migrations/0007b_comment_corrections.sql:13-32` at b808dc50)
   - Tier: T4 · Axis: test · rule 5: no · Issue: none · Confirmed by: reading
   - What this is: This test starts two database sessions to show that a claim on one meal does not block a claim on another meal. SKIP LOCKED means skip a row held by another transaction instead of waiting for it.
   - Problem: Lane one commits automatically after a 1.5-second sleep. Lane two is checked only for its eventual job ID. If SKIP LOCKED is removed from the claim lock, lane two can wait for that commit, then return the expected other-meal job and pass. The test therefore does not enforce the parallelism named in its title.
   - Fix: Keep lane one open until the test has observed lane two return, then explicitly commit lane one. Give lane two a short SQL lock or statement timeout so a blocking claim fails visibly instead of hanging.
   - If we skip it: A change that serializes unrelated claims can pass this concurrency gate. At the assumed worker concurrency of one this is a test gap, not evidence of a current demo slowdown.

Group: **Nice to have**.

63. **Failed fixture deletions can leave tests green and data behind** (P8-3; `tests/db/delete-and-remove.test.mjs:27`; `tests/photo-address.test.mjs:28`; `tests/barcode-post.test.mjs:151` at b808dc50)
   - Tier: T4 · Axis: test · rule 5: yes · Issue: none · Confirmed by: reading
   - What this is: These tests delete their temporary database rows or stored photos after their assertions finish.
   - Problem: Supabase returns deletion failures in an error field. These cleanup calls ignore the returned result, so a denied or failed delete leaves fixture rows or photos behind while the test reports success. Later tests then inherit residue.
   - Fix: Check each cleanup result with the existing checked/assert helper and report a failure. Still attempt all cleanup steps so one failed deletion does not prevent the rest.
   - If we skip it: A passing run can leave temporary posts, jobs, label readings or photo objects in the disposable stack, which makes later runs depend on residue and hides the cleanup failure.


### P10

Group: **Should fix**.

28. **Days and search copy the same date helpers** (P10-2; `src/lib/posts/days.ts:11-28`; `src/lib/search/dates.ts:3-27` at b808dc50)
   - Tier: T1 · Axis: lean · rule 5: no · Issue: none · Confirmed by: reading
   - What this is: Both readers validate time zones, format local dates and shift calendar dates.
   - Problem: The same three algorithms are implemented twice; search explicitly says its date grouping is the same as Days. A zone-validation or date-boundary correction must be applied twice to preserve that promise.
   - Fix: Keep the date helpers in src/lib/search/dates.ts, use them from Days and delete the duplicate bodies; adapt the Date input at the caller.
   - If we skip it: Date grouping can drift between two views of the same meal.

Group: **Should fix**.

45. **Three operator queries copy the same nutrition rules** (P10-1; `scripts/numbers/03-suspicious.sql:1-101`; `scripts/numbers/04-summary.sql:1-101`; `scripts/numbers/14-rule-failures.sql:7-62` at b808dc50)
   - Tier: T4 · Axis: lean · rule 5: no · Issue: none · Confirmed by: reading
   - What this is: The detail, summary and recheck reports apply the same nutrition checks.
   - Problem: The first two files repeat the rules CTE byte for byte; the third keeps a subset. A change to the definition of a failed rule must be edited in several places or the summary and recheck list disagree.
   - Fix: Keep one rules query and derive its detail and summary projections; delete the copied definitions.
   - If we skip it: An operator can get different counts and correction candidates from the same stored data.

Group: **Nice to have**.

64. **An unused queue helper survived its callers** (P10-3; `src/lib/queue/enqueue.ts:1` at b808dc50)
   - Tier: T4 · Axis: lean · rule 5: no · Issue: closed #971 was partial cleanup; this file remains · Confirmed by: reading
   - What this is: enqueueJob wraps the queue insert.
   - Problem: A whole-tree reference search finds only its definition; no static, dynamic, test or configured caller remains.
   - Fix: Delete src/lib/queue/enqueue.ts; keep current worker enqueue paths.
   - If we skip it: A reader can mistake this unused entry point for a supported queue contract.


## Fleet 24 A8: each earlier finding checked once

| A8 | Earlier finding | Current disposition at b808dc50 |
| --- | --- | --- |
| 1 | Attachment request waits forever | **Fixed by #969** for attachment requests. Separate food/drink/copy waits remain: P3-02. |
| 2 | Future cleanup wakes empty worker | **Fixed by #966**; shared due-work count and later Fleet 47 removal of idle self-ticks. |
| 3 | Busy resize sends full original | **Still holds**, P3-03; open #222/#375, with explicit overload-UI tradeoff. |
| 4 | Unchanged Home timer and tab-return reread | **Changed**: Fleet 47 removed the timer; event-driven focus remains, with existing focus fan-out tracked in #1161. No new timer finding. |
| 5 | Ready cards permit detail prefetch before tap | **Still holds**: PostActions links remain eligible. Covered by open #222; source eligibility is not a fresh request count. |
| 6 | Camera/composer loads with Home | **Changed by #972**: dynamic import replaces static import, but an idle 1.5-second preload still exists and failed entry load lacks immediate feedback (P2-01). |
| 7 | Detail updating poll misses return | **Fixed by #968**, then superseded by #1095 deleting the poll. |
| 8 | Traffic and wake disagree on due jobs | **Fixed by #967** through shared due-work count. |
| 9 | Attachment refusals lose their distinction | **Fixed by #970**: structured safe refusal remains. |
| 10 | No-photo update failure wording conflicts | **Fixed by #973**: initialization state chooses the wording. |
| 11 | Three unreferenced files | **Changed**: NutritionImage and SafeImage were deleted; enqueue.ts remains unused (P10-3). #971 was a partial cleanup, not a new whole-tree guarantee. |

## Debt ledgers

Whole-tree commands: `git grep -nE '(#|//|/[*]) ?(shortcut|ponytail):'` and `git grep -I -nE 'TODO|FIXME|HACK|XXX' -- .`.

| Live entry | Limit | Revisit trigger | no-trigger | Disposition |
| --- | --- | --- | --- | --- |
| `src/lib/meta/open-weights.ts:4` | One 75-second Baseten try before Meta; retained trial slowest 50.5 seconds | Normal Baseten latency grows beyond the allowance | no | Decision, not a finding: explicit bounded shortcut; assumed load not shown to exceed it. |

`docs/plan-run12.md:296` repeats that comment; its line 463 is a historical example, not another live entry. Other TODO-pattern hits are mktemp templates, an integrity-hash substring and a quoted upstream TODO in `docs/reviews/run12-pr506-observed-dependency-evidence.md:37`. No live application TODO/FIXME/HACK/XXX entry was found.

## Decisions, not findings

- CAPTCHA remains off by the owner’s ruling. Permanent fleet protection-bypass access is accepted; no secret value or removal proposal is included.
- The bounded `shortcut:` entry above is exempt unless its limit is exceeded; this audit makes no claim about real provider latency.
- P1-3: the spending-cap read deliberately fails open for availability, as stated in `src/lib/limits/user-cap.ts:6` and `docs/plan-run8.md`. The reviewer rejected calling it a newly found bug. Only the owner can resolve the older availability ruling against a newer interpretation of rule 5.
- Durable, visible job recovery is distinct from in-call quiet retries. FDC rate limiting sets a visible reason and queues a later wake; generic job recovery ultimately marks the meal failed. P4-01 and P5-03 cover only in-call quiet repeats. Changing queued recovery needs a separate owner decision.
- Nutrition migration helpers still called by current wrappers are not dead code. Both rollback directories hold different historical changes; neither is a duplicate folder to delete.
- A same-meal refusal conservatively avoids copying; an HTTP error propagates. P4-06 is narrowed to its extra quiet call, not a claimed swallowed provider outage.
- Optional push, image degradation, stale-display preservation and ready-without-exported-card behavior are documented design choices. Their rule-5 hits remain listed at the reviewer’s lower groups; choosing a visible replacement is an owner decision, not permission to make committed meals fail.

## Dropped in verification

**1 finding dropped:** P1-3, the spending cap, is the historical availability decision above. Other findings were narrowed or downgraded rather than counted as dropped; in particular P4-06 no longer asserts that an HTTP failure was swallowed.

## Tools and execution limits

- One Python 3.9.25 standard-library copy scan, command `python3 -` (stdin script): 12-line SHA256 windows with at least nine nonblank lines, across 476 src/scripts text files; 119 overlapping candidate windows. Only source-checked duplicates became findings. No dependency was added.
- Whole-tree reference searches included tests, fixtures, configuration, package scripts and string/dynamic references. Only enqueueJob’s definition remained; framework routes, migration history and globbed tests were not called dead by convention.
- npm 10.9.9: `npm audit --omit=dev --package-lock-only --json`, once, exit 0, zero known vulnerabilities in all severity groups. Reported dependency counts: 54 production, 416 development, 119 optional, 505 total; those categories are not additive. No install or lockfile write occurred.
- knip and jscpd were not installed or run; no suite, build, stack, browser, model or USDA call was run. All findings say confirmed by reading. No full-suite pass or runtime timing is claimed.

Verdict: fix the silent wrong-result cases and protect destructive operator-tool boundaries first. The code has strong ownership and revision fences, but several callers still turn failures into success, zero, empty results or quiet repeats. The audit does not clear the investor demo at runtime.

Lean: -40 lines, -0 dependencies possible from the independently checked unused queue file (19 lines) and duplicate test file (21 lines), before additional reviewed SQL/date/helper consolidation. This is a conservative source-line estimate, not a bundle-size or speed claim.

Not checked: production behavior, real model output, real USDA responses, live Realtime delivery, physical cameras, browser failure rendering, CPU/load and fresh performance. No SQL chain was applied or rolled back. Recorded provider payloads and script fixtures were skimmed for shape; some superseded migration/rollback bodies and the font license were only skimmed. The favicon, eight fonts and five binary script fixtures were not read. P0 only partially read public/sw.js outside the numeric denominator; the lockfile dependency list was skimmed. The exact non-full paths follow; the coverage file records each reason.

- `scripts/fixtures/ATTRIBUTION.md` — skimmed.
- `scripts/fixtures/food-matching.json` — skimmed.
- `scripts/fixtures/ham-resolution.json` — skimmed.
- `scripts/fixtures/label.png` — not read.
- `scripts/fixtures/plate1.jpg` — not read.
- `scripts/fixtures/plate2.jpg` — not read.
- `scripts/fixtures/plate3.jpg` — not read.
- `scripts/fixtures/tone.wav` — not read.
- `src/app/favicon.ico` — not read.
- `src/assets/fonts/Manrope-300.ttf` — not read.
- `src/assets/fonts/Manrope-300.woff2` — not read.
- `src/assets/fonts/Manrope-400.ttf` — not read.
- `src/assets/fonts/Manrope-400.woff2` — not read.
- `src/assets/fonts/Manrope-500.ttf` — not read.
- `src/assets/fonts/Manrope-500.woff2` — not read.
- `src/assets/fonts/Manrope-600.ttf` — not read.
- `src/assets/fonts/Manrope-600.woff2` — not read.
- `src/assets/fonts/OFL.txt` — skimmed.
- `supabase/migrations/0007_post_items_supersede.sql` — skimmed.
- `supabase/migrations/0027_not_eaten.sql` — skimmed.
- `supabase/migrations/0029_drinks_from_items.sql` — skimmed.
- `supabase/migrations/0054_unavailable_summary.sql` — skimmed.
- `supabase/migrations/0055_approximation_once.sql` — skimmed.
- `supabase/migrations/0057_today_summary.sql` — skimmed.
- `supabase/migrations/0060_label_serving_unit.sql` — skimmed.
- `supabase/migrations/0062_today_summary_nulls.sql` — skimmed.
- `supabase/rollback/0028_pause_leftovers.sql` — skimmed.
- `supabase/rollback/0028_resume_leftovers.sql` — skimmed.
- `supabase/rollback/0037_water_tile_labels.sql` — skimmed.
- `supabase/rollback/0038_unmark_not_eaten.sql` — skimmed.
- `supabase/rollback/0042_modes_hint.sql` — skimmed.
- `supabase/rollbacks/0046_drink_identify_cap.down.sql` — skimmed.
- `supabase/rollbacks/0047_alcohol_intake.down.sql` — skimmed.
- `supabase/rollbacks/0048_feed_post_indexes.down.sql` — skimmed.
- `supabase/rollbacks/0049_feedback_revisions.down.sql` — skimmed.
- `supabase/rollbacks/0050_sugar_total_backfill.down.sql` — skimmed.
- `supabase/rollbacks/0051_approximation_summary.down.sql` — skimmed.
- `supabase/rollbacks/0052_estimate_summary.down.sql` — skimmed.
- `supabase/rollbacks/0054_unavailable_summary.down.sql` — skimmed.
- `tests/fake-meta/fixtures/fdc.json` — skimmed.
- `tests/fake-meta/fixtures/recording.json` — skimmed.
- `tests/fake-meta/fixtures/sam.sse` — skimmed.
- `tests/fake-meta/fixtures/spark-closest_food.json` — skimmed.
- `tests/fake-meta/fixtures/spark-correct.json` — skimmed.
- `tests/fake-meta/fixtures/spark-identify.json` — skimmed.
- `tests/fake-meta/fixtures/spark-label.json` — skimmed.
- `tests/fake-meta/fixtures/spark-match.json` — skimmed.
- `tests/fake-meta/fixtures/spark-nutrition_estimate.json` — skimmed.
- `tests/fake-meta/fixtures/spark-remainder.json` — skimmed.
- `tests/fake-meta/fixtures/spark-same_meal.json` — skimmed.
- `tests/fake-meta/fixtures/spark-search_query.json` — skimmed.
- `tests/fake-meta/fixtures/spark-wording.json` — skimmed.
- `tests/fake-meta/fixtures/transcribe.json` — skimmed.
- `tests/fixtures/off-7622300761363.json` — skimmed.

## Proposed backlog items, most important first

The PM owns filing and planning. These proposals cover verified Must/Should findings without a matching open issue; related broad issues are not treated as exact coverage. No fix is authorized by this report. The PM separately ordered and received issues #1191–#1198 for the eight interim Must findings. No code fix was started. The retry deletion P3-04 must be handled together with #1194’s request deadline; it is listed here as the additional coupled scope, not a second timeout issue.

1. **New barcode meals lose the barcode needed for later product correction** — T2; findings 9 (P6-1). 0060 (repeated in 0071) replaces create_food_post with the full create_food_post_without_gtin body and never writes post_items.gtin. A scanned meal posts successfully but the owner cannot correct that product afterward.

2. **Cleanup deletes unmerged closed-PR branches** — T4; findings 10 (P7-01). A clean branch whose PR is CLOSED without merging passes the same condition as MERGED. An operator can lose the normal local and remote references to rejected but still valuable committed work.

3. **A review output option can recursively delete the repository** — T4; findings 11 (P7-02). Invoking the tool with valid --base/--head and --out=. resolves outDir to the repository, then rmSync recursively deletes it, including .git, before buildManifest runs. --dry-run still reaches writePacket. A mistyped output option destroys source, git history in that checkout, and uncommitted owner state.

4. **Removing an avatar can report success after its reads or storage deletes fail** — T1; findings 12 (P1-2). A failed initial profile read is treated as no avatar and returns ok:true. The viewer sees a photo removal succeed when it did not complete.

5. **Failed profile reads become a cached blank identity** — T1; findings 14 (P2-04). A profiles query returning an error is treated as data=null, producing an empty handle and no avatar. A normal account can lose its visible identity without any failure indication.

6. **Bound saved-meal requests and remove their quiet retry loop** — T1; findings 4 (P3-02), 15 (P3-04). Every thrown submission error, including a deterministic HTTP refusal, is delayed two seconds and then six seconds and tried again before a failed state is published. The real refusal is hidden while the app repeats the same rejected write.

7. **The camera retries acquisition and falls back from still capture silently** — T1; findings 16 (P3-11). A contention error stops the old stream, retries the requested camera and restores the old camera if necessary; final failure is shown. A failed high-resolution capture can post a lower-resolution frame without explaining the failure.

8. **Model failures quietly start another provider attempt** — T1; findings 18 (P4-01). A 500 or timeout is retried inside fetchWithRetry and the SDK enables one retry. The person waits through hidden repeated calls and costs.

9. **Card failure publishes ready through an alternate path** — T1; findings 19 (P4-04). When renderResultsCard fails, markReady logs it and calls mark_post_ready anyway. A viewer can see stale exported-card nutrition or accumulate unremoved images while the meal appears successful.

10. **A failed identify-provider settings read silently selects Meta** — T1; findings 20 (P4-08). The query ignores returned error and the catch discards thrown errors; any failed read leaves provider=meta. A settings outage switches the model host without telling the owner.

11. **Rate-limited USDA requests quietly wait and retry** — T1; findings 21 (P5-03). A 429 with retry-after:1 waits then issues the request again without surfacing the first failure. The meal silently keeps working through provider failures contrary to rule 5.

12. **Incomplete nutrition model answers silently get larger attempts** — T1; findings 22 (P5-04). When a model answer ends incomplete, each caller issues another request with a larger output allowance. The owner pays for repeated model reasoning while viewers only see continued waiting.

13. **The blended food treats absent nutrients as known zero contributions** — T1; findings 23 (P5-07). For a 55% rice/45% protein blend, suppose rice has sodium=10 mg/100g and the protein has no sodium entry. Micronutrients or minor fields in this rice/protein approximation can be understated.

14. **A failed sign-up cleanup can leave an account with no profile** — T1; findings 24 (P1-1). If deleteUser returns an error object, it is ignored; if it throws, the catch also ignores it. A new viewer can become stuck between account creation and a usable profile.

15. **Saving a pending caption closes before the save is durable** — T1; findings 25 (P3-14). update changes the in-memory caption but discards the persistence promise; Save closes the editor immediately. A person can lose a caption edit that the interface appeared to save.

16. **Lease renewal and release errors disappear** — T1; findings 26 (P4-02). If a heartbeat renewal fails, its empty catch discards the error and the in-flight job continues. Two invocations can do overlapping provider work after lease loss, with no visible indication of the lease error.

17. **Days and search copy the same date helpers** — T1; findings 28 (P10-2). The same three algorithms are implemented twice; search explicitly says its date grouping is the same as Days. Date grouping can drift between two views of the same meal.

18. **Food detail keeps a legacy cache route and hides malformed current data** — T1; findings 29 (P5-05). An envelope without kind is still parsed by legacy_cache beside fdc-detail-v1. Old and current contracts remain coupled, and cache corruption starts an unseen provider route.

19. **Old nutrition encodings remain active beside the compact format** — T1; findings 30 (P5-11). An unset NUTRITION_COMPACT_WRITE flag selects repeated legacy approximation metadata; setting it selects the compact shape. Every nutrition change must keep old and new runtime contracts correct together; the reader-first rollout comment documents the reason but is not a shortcut limit exemption.

20. **Drink-card reads retry quietly and hide the final failure** — T2; findings 31 (P2-02). An HTTP failure or a successful null result schedules up to three extra reads at one, two and three seconds. A reader cannot tell failed drink details from no drink.

21. **The photo-drink composer quietly repeats a conflict for 90 attempts** — T2; findings 32 (P2-06). A 409 response silently waits a second and retries up to 90 times. A refusal produces up to 90 background requests and no explanation until the loop ends.

22. **Push delivery errors are discarded** — T2; findings 33 (P3-08). A failed post/subscription query returns silently; non-expired provider failures are swallowed, and a failed expired-subscription delete is not checked. A person receives no notification and the delivery failure has no visible result.

23. **Committed food, drink and copy repair errors are reduced to log lines** — T2; findings 34 (P3-09). If follow-up work throws, each catch logs a sentence and returns the ordinary success shape; the failed repair state is not sent to the person. A saved meal can return success while its drink/card update is incomplete.

24. **Incomplete label reads quietly retry and keep partial success** — T2; findings 35 (P4-05). A missing macro silently triggers a cropped model call; if it throws, the empty catch keeps the first reading. The person sees a successful partial label without knowing that the attempts meant to complete it failed.

25. **Saved label data conceals a failed barcode provider** — T2; findings 36 (P5-06). When a complete saved label exists and USDA throws, the catch discards that error. The user-verified label remains usable; the unresolved question is hidden lookup failures and extra provider enrichment calls, not wrong label numbers.

26. **Drink correction maps database read failures to missing objects** — T2; findings 37 (P5-08). If the reading query returns {data:null,error:...}, error is ignored and the response says 404 Drink reading not found. A person receives a false explanation of the failure and may abandon a valid draft.

27. **Keep one operation-receipt publication contract** — T2; findings 39 (P3-06), 42 (P5-10). The copy reader accepts a missing identifier and calls old copy functions. An older or direct client can still create duplicate meals through the retained route.

28. **Item edits ignore the failure to save their explanation** — T2; findings 40 (P3-07). After the item-edit RPC succeeds, the separate post_comments insert is awaited without checking its error. The meal changes with no explanation in the thread and no warning that the note was lost.

29. **Drink cleanup and card errors are discarded after the operation** — T2; findings 41 (P5-09). A capped reading deletes its claim without checking error; a failed reading writes state=failed without checking error. The person may have a stuck draft or missing/stale stored card while the cause is hidden.

30. **The numbers card report turns unavailable stored calories into zero** — T4; findings 43 (P7-04). When every current food has calories=NULL or lacks a nutrition row, the stored reduction adds zero for each and prints stored_kcal=0. The operator can treat an unknown meal as a measured zero and misread the study comparison.

31. **The queue inspector reports failed reads as an empty queue** — T4; findings 44 (P7-07). When all three Supabase reads return errors, their error fields are ignored and the command prints queued:0,running:0,oldest:null with a successful exit. An operator can conclude the worker has no work when the database cannot be read.

32. **Three operator queries copy the same nutrition rules** — T4; findings 45 (P10-1). The first two files repeat the rules CTE byte for byte; the third keeps a subset. An operator can get different counts and correction candidates from the same stored data.

33. **The retained trace rollout gate demands a removed legacy behavior** — T4; findings 46 (P7-03). The script first asserts those columns are absent, then expects recordCall to store one row. An operator running the documented retained gate gets an inevitable failure rather than a meaningful release check.

34. **Private-output helpers enforce different privacy rules** — T4; findings 47 (P7-05). study.mjs defines its own privateWrite that accepts any file and mismatch.mjs writes its own output files, while study-io refuses repository output and symlinks. prepare --map=./private-map.json writes the private meal map into the public checkout; the shared helper rejects that location. Private evidence can be staged with source files, and the two guards will keep drifting.

35. **The same two micronutrient tests run from two files** — T4; findings 49 (P8-4). Their two micronutrient test names, inputs and assertion bodies are identical. Every run and future change carries two copies of the same expected behavior.
