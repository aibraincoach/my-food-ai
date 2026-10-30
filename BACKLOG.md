# My Food AI — Backlog†

Last edited: Friday 2026-10-30 at 22:37 MYT (UTC+08:00) by Codex

## Backlog

## For the designer

### #195 Designer frames show a second photo marked Not eaten at 390×844

A user who photographs a whole cake and then eats part of it cannot say that the second photo shows what remains.

The owner wants it very clear which photo is the not-eaten one: a toggle on the second photo only, or a + at the end of the carousel reached by swiping right on the card. The app never shows the word "left", so the label reads "Not eaten". Design the + in the carousel, the toggle on and off, the label on the slide, and how the card shows what was consumed. Done when frames at 390x844 for adding the second photo, the toggle states and a card with a not-eaten slide are delivered.

### #198 Saved meals and Log again have designer frames at 390×844

Saved meals and Log again cannot be built because no frame shows them.

#172 adds a bookmark on post detail that saves a meal, a list of saved meals and "Log again" in the post menu to copy a meal to a chosen time. The + now spins out five entries (frames 2c and 2d), so the designer decides where saved meals sit beside them. Done when frames at 390x844 are delivered for the bookmark on post detail, the saved-meals list, and "Log again" with its time choice.

### #210 Frames for a nutrition label and for correcting a scanned product

Frame 2i draws a barcode found, but no frame shows a nutrition label read, a barcode not found or a way to correct a scanned product.

The owner ruled on Oct 29 to keep the Photo | Barcode toggle of frame 2i, so a user can see that a scanner exists, while the camera also identifies a barcode or a label in Photo mode without the toggle being used. Draw, in the style of frame 2i, the card for a nutrition label read, the card for a barcode not found, and the correction of a scanned product, because many barcodes come back with names in another language such as Spanish. Done when frames at 390x844 are delivered for a nutrition label read, a barcode not found and the correction.

### #211 Frames for the day's hydration on a drink post's card

A drink becomes a post, but no frame shows what its card says.

The owner ruled on Oct 29 that a drink post's card shows how much hydration the user has consumed all day, from drinks and from the water in food. It is a record in past tense, for example "Consumed today: 1,450 ml", with no target, comparison or percentage. Done when frames at 390x844 are delivered for the card of a water post, a coffee post and a food post that adds hydration.

## Build the round 2 frames

### #185 The feed has day separators in designer frames at 390×844

The feed is one unbroken run of cards, so a user cannot see where one day ends and the next begins.

Design the day separation for the feed: a day header or divider, the wording for today and yesterday, and how it behaves while scrolling. A day's total may appear only as a record, with no comparison, average or target. The build follows the frame. Done when the designer delivers frames at 390x844 for the feed with day separators, including a day with one post and a gap where a day has none.

### #186 The + spin-out has designer frames and motion at 390×844

The + button only opens the camera, but a meal can be logged by camera, by text, as a drink or as a coffee.

The owner wants the + to spin out from the button into four entries (camera, text, liquid beverage, coffee) plus a fifth the user can define, moving outward, and he likes that it moves. Done when the frames for the closed, opening and open states and the motion are delivered at 390x844.

### #187 The Days screen has designer frames for navigation and story exit at 390×844

From the Days tab it is unclear how to get back to the main screen: there is no back button, an earlier month is reached only by scrolling to the bottom, and tapping a day opens a story viewer with no obvious way out.

The owner sees room for two months on the screen and is unsure whether one month at a time is acceptable. The designer reworks the Days screen: how months are laid out and reached, a visible back control, and where a tapped day leads. Done when frames for the month view, the story entry and the story exit are delivered at 390x844, with the way back to the main screen visible on each.

### #188 Intake control and barcode scanner have designer frames at 390×844

Water and caffeine intake and the barcode scanner are built but have no designer's frame to check them against.

Both are merged (#111 and #165) and have not been tried on a phone. Draw the intake control and the scanner at 390x844 in light mode, in past tense, with no budget, no progress and no "left". Done when both frames are delivered.

### #191 The + sheet opens camera, text, drink, coffee and a user-defined fifth entry

The + button opens only the camera, so logging by text, a drink or a coffee takes extra steps.

Caption-only posts already work, and water and caffeine intake logging is on main (#111). Make the + open an entry list of camera, text, liquid beverage and coffee, plus one more entry the user can define, each opening its own capture directly. The spin-out look comes from the designer's frame. Done when each of the four entries logs a post starting from the +, and a user-defined fifth entry can be added.

### #212 The regular camera reads a barcode and a nutrition label

A user has to switch to a separate scanner to log a packaged food, and the scanner has not been tried on a phone.

The scanner was merged in PR #165 on the Search tab and is untested on a phone. The owner ruled on Oct 29 that a photo is a photo, whether it shows food, a barcode or a package's nutrition label, so the capture sheet identifies which whether or not the Barcode toggle of frame 2i is used; the owner ruled to keep the toggle so users can see that a scanner exists. The owner prefers a deterministic read: decode the barcode from the image first and look the digits up, and use the model only when no code is found and for the label. A barcode becomes a post whose card identifies the product with its nutrition and the pack photo; a label is read into the same kind of card. The look comes from frame 2i and the designer's frames for the label and the correction. First try the existing scanner on a phone with a real pack and report what it reads. Done when a real pack's barcode, photographed through the capture sheet on a phone, posts a card with the product's name and nutrition, and a nutrition label does the same. Current evidence: #206 subsequently merged capture-sheet barcode handling. Verify that implementation first; the phone check and nutrition-label path remain acceptance requirements.

### #213 Corrections to a barcode's product are kept

A barcode can come back from the food database with the wrong language or wrong values, and the user cannot fix it for the next scan.

Many barcodes return names in Spanish or another language. The owner wants a correction to a scanned product (name, amount, nutrition) stored against that barcode in our database and used the next time the barcode is scanned. Whether a correction applies to every user or only to its author is not decided, so the first step is to propose which and why. Done when a corrected name on a barcode appears on the next scan of the same barcode.

### #214 A drink post's card shows the day's hydration, including water from food

A drink becomes a post, but its card does not tell the user how much they have drunk in the day.

The owner ruled on Oct 29 that every drink becomes a post and that its card shows the hydration consumed that day, in past tense and as a record with no target, comparison or percentage, counting the water in food as well as in drinks. The food database lists a water amount for most foods, but how much of a day's food water to count has not been settled, so the first step is to propose it. Done when a water post's card shows the day's hydration from drinks and food in ml, and a food post adds its water to that total. Current evidence: #205 subsequently merged drink posts and food-water hydration. Check its implementation and production evidence against this requirement before scheduling further work; the dedicated designer frames remain a separate item.

## Analysis pipeline and worker

### #65 The pipeline's tests run against an offline fake Meta Model API

Meta's workshop repository ships a scripted offline model for its tests: a real OpenAI client whose requests never leave the machine and are answered from recorded outputs, including recorded SAM outputs, and which can be told to refuse a request with a 400.

Our tests are static text checks, and nothing exercises the analysis pipeline without a live key and live credit. Add a fake of the Meta Model API behind the same client, selected by a base-URL variable (MODEL\_API\_BASE\_URL, which the workshop's client also reads), that answers the SAM, Spark identify, Spark correct and transcribe calls from recorded fixtures and can be told to return a 400, a 429 or a 503. Done when the path from a posted meal to ready, a correction, a 400 failing a job at once and a 429 retrying all run in the test suite with no network and no key.

### #66 The Meta Model API client sets its retries and timeout explicitly

Meta's workshop client sets four retries and a 180-second timeout on the OpenAI SDK client, and the SDK waits as long as the API asks on a 429 or a 503, so a brief rate limit costs no job attempt.

Set the retry count and the timeout on our client explicitly, in one file, within the serverless function's time limit, so the worker's own retry delay only handles failures that outlast the SDK's. Done when the settings sit in one file and a test through the fake API shows a 429 that carries a wait is retried inside one job attempt.

### #67 Each post keeps a trace of its model calls, readable on the admin page

Meta's workshop ships an Agent Console that shows every turn: what the model was asked, what it returned, the tokens used and which checks passed.

A judge looking at ours sees only the end result. Record, in a new table that only admins can read, one row per call a post made (SAM, Spark identify, Spark correct, FDC lookup, transcribe) with the time, the duration, the tokens, the request text without the image, the returned text, and the FDC id where one matched. Show a post's trace on the admin page and never in the user's app. Done when a post made on production has a trace listing each call it made, and a non-admin cannot read the table.

### #139 Renewing the worker lease actually extends a lease its own holder still holds

Context: found while fixing the pipeline harness (PR #96). src/lib/queue/lease.ts renewLease calls try_acquire_worker_lease again, but that SQL function (migration 0001) only takes the row when worker_lease.expires_at is null or already past, regardless of holder, so a renewal by the current, unexpired holder returns false and changes nothing; runWorker ignores the result (renewLease(...).catch(() => {})). With today's numbers (a 300 s TTL against 60 s of work) nothing breaks, but the renewal calls are no-ops and a longer run would lose the lease silently. The harness in #96 works around it by updating the row directly.

Done when: renewing a held, unexpired lease by the same holder extends expires_at and returns true, another holder still cannot take it, and runWorker detects a failed renewal, shown by a database test.

### #177 Queued meals keep being analysed after the first worker run, with no one polling

Found by the production load test for #24 (2026-10-28, production at b025d13). Twenty posts were created six seconds apart. The worker analysed nine of them in about five and a half minutes, then stopped: 11 analyze jobs sat queued (attempts 0, run_after in the past, no lease held) until a manual GET /api/jobs/tick started the worker again. next_worker_wake() still returned a time in the past, so the self re-tick chain in runWorker (tickSelf) ended without a failure being recorded, and nothing else wakes the worker when no client is polling (the only periodic tick is the browser's QueueTicker). A user who posts and closes the app would see the meal stay queued.

Done when: with the app closed after posting, 20 posts at six-second spacing all reach ready or failed without any manual tick or open client, shown by a load-test run against production; the cause of the broken re-tick chain is recorded in the PR.

### #190 docs/eval.md records production results for ten licensed meal photos

There is no measured result yet for how well the app finds the items in a real meal.

The ten licensed meal photos, their expected items and the eval script are merged (PR #78), but the script has not run against production. Run it as the test account, commit the table to docs/eval.md and link it from the README. Done when the table shows for every photo which items were found, missed or invented.

### #225 One unmatched food does not blank a meal's totals

One food without nutrition can turn an otherwise quantified meal into dashes for every total.

The breakfast in #189 contains known nutrition for several items and null nutrition for coffee; the complete meal total became unknown. Preserve the available calculated nutrition and make the missing item's uncertainty explicit instead of replacing all available values with dashes. Done when one unmatched item does not hide the known totals or imply that unknown nutrition is zero. Evidence: https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6522506987

### #226 Japanese dishes match the right foods

Japanese meal names can select unrelated food-database records.

Investigate matching using Japanese dishes and the breakfast evidence on #189. Toast selected dried persimmons and other selections did not match the named food. Match food identity and preparation rather than a shared descriptive word, and retain evidence for each selection. Done when the investigated Japanese examples select appropriate records or explicitly remain unmatched, with reproducible item and database-match evidence. https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6522506987

### #227 A photo that does not upload never becomes a post without one

A user who selected a meal photo can end up with a published post that has no usable photo after an upload fails.

Trace the ordinary upload/publish ordering and failures, including a slow connection and ambiguous responses. A deliberate caption-only meal remains valid; a selected photo that failed to upload must not silently become one. Done when failed photo uploads show a recoverable error and never publish a photo-less substitute, and a successfully published photo remains fetchable. Related: #137 covered retrying an object that was not yet readable.

### #228 A meal summary's numbers are the calculated totals

A model-written meal summary can disagree with the nutrition calculated from its items.

Inspect how thread summaries, feed summaries and results cards obtain their numeric values. Render nutrition numbers from the stored calculations rather than trusting numbers invented in model prose. Done when every displayed meal-summary number agrees with the calculated item totals after initial analysis and after a correction, with unknown values represented explicitly.

### #229 Non-admin request to a trace page returns 200 with not-found content instead of 404.

A non-admin request to a trace page returned HTTP 200 even though the page rendered not-found content and no trace.

Production check for #67: the second test account requested /admin/posts/a9ee8fa4-f7b8-44e5-a8e5-d977c61f811f. The response status was 200, not-found content was present, and no trace rendered. Database access also returned no trace rows for that account. Evidence: https://github.com/aibraincoach/my-food-ai/issues/67#issuecomment-6522507681. Done when a non-admin request returns HTTP 404 with no trace rendered; retain the existing database access restriction.

### #230 Breakfast matches toast to dried persimmons and coffee null blanks the meal total

The production breakfast test selected dried persimmons for toast and a fast-food side salad for salad; coffee had null nutrition and the whole meal total became unknown.

Evidence: https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6522506987. Post ac5f19f2-1579-47c9-a097-b409ef90bd49: Japanese toast 60 g matched FDC 169942 (Persimmons, japanese, dried); green salad 40 g matched FDC 172074 (McDONALD'S, Side Salad); black coffee 240 g matched FDC 1904507 (BLACK COFFEE) with null nutrition. The other quantified items produced a known subtotal of 257.6 kcal, but the complete meal total was null. Reproduce the selections and investigate food identity and unit compatibility before changing them. Done when this breakfast has appropriate food matches and a truthful calculated summary that preserves known nutrition while identifying any unknown item. This records the observed regression; the broader Japanese-matching and unmatched-item-total issues cover the general rules.

## Logging and editing meals

### #172 Meals can be saved and logged again

A bookmark on post detail saves a meal; the + sheet lists saved meals; "Log again" in the post menu copies a meal to a chosen time.

Done when: a saved coffee logs in two taps at Now, and at an earlier time via the picker.

### #173 A photo can be added to an existing post

The new photo joins the carousel and triggers a re-estimate that arrives as a thread reply.

Done when: a second photo appears in the carousel and the thread shows a revised summary.

### #174 A post can be deleted after confirmation

Deleting a post asks for confirmation, then removes the post and its media. (Only needs_input meals can be discarded today.)

Done when: a confirmed delete removes the post, its items, thread and stored media, and it no longer appears in Feed, Days or Search.

### #223 A user can edit a post caption

A user cannot correct a meal's caption after posting it.

Provide an edit-caption action with the existing product style and clear save/error behavior. Keep authorization scoped to the author and define how the edit affects analysis without silently losing previous analysis. Done when an edited caption persists through reload in feed and detail, another user cannot edit it, and a failed save is visible.

### #224 Times use the user's time zone

Meal times and day membership can disagree with the time zone the user is actually in.

Audit capture time, eaten-at editing, feed labels, day headers, Days, Search and intake records using the user's detected time zone. Store instants consistently and format/group them in that zone. Done when the same meal has a consistent local time and local day across these screens, including after travel and near midnight. Related: #118 and #119 track narrower time-zone cases.

## Meal screens and feed

### #18 Days

The row at the top of Home is seven day bubbles, today on the right, each showing the day's first photo or a blank ring if nothing was eaten.

Tapping a day plays that day's posts full screen in sequence with tap-to-advance and swipe-left/right between days, and the last card shows "Consumed on Tuesday: 1,840 kcal" with the macro line. A sum of what was eaten is a record, not a goal; no comparison to any other day, no average, no target. The Days tab in the bottom bar opens a month grid that scrolls back. Done when a week with three logged days plays as three stories and the bubbles match.

### #20 Profile

A grid of post thumbnails, newest first, three across, tapping opens the detail.

Above it the handle and a Sign out button. Nothing else: no weight, no streak, no badge, no count of anything beyond posts. Done when the grid loads the user's posts and nothing on the screen suggests progress toward anything.

### #29 Results card as a carousel slide

Not every post has a photo, and a photo post loses its numbers once the analysis is one line of small type.

When the worker sets a post to ready, generate a results card image from the stored items and totals: a clean square card with the item names, portions and totals in the app's type and colours. For a photo post the card is appended as the next slide of the carousel, after the photo or photos. For a caption-only post the card is the post's image, so every post has something to show in the feed and the profile grid. Render the card from data with code (server-side HTML or SVG to PNG), not with an image-generation model: this build is limited to the Meta Model API models SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, and a rendered card cannot misspell a number. Store it as a post_media row with a kind column (photo or card, added in a new migration), regenerate it when a correction supersedes the items, and keep every rule from the analysis block: consumed wording only, no goal, no rings or percentages. Done when a logged photo shows the photo and then the card as swipeable slides, a caption-only post shows the card as its image, and a correction changes the numbers on the card.

### #175 Days shows intake-only days

A day with only water or caffeine logged has no story or marker in Days.

Done when: a day with only water or caffeine appears in Days with a marker.

### #192 A processing post's photo loads once with no visible reload

The photo on a post reloads again and again while the analysis is running, which looks broken.

The cause is not known. Each card polls its row every 3 seconds while the post is unsettled, and a refresh may be fetching the signed image address again; check that first and confirm it by observation. Fix it so the image loads once and the rest of the card updates around it. Done when a post made on production shows its photo with no visible reload from posting until it is ready.

### #215 Thumbs up and down respond at the tap

The thumbs-up and thumbs-down buttons look dead when tapped, the change shows up some time later, and they feel clunky.

The owner reported this on Oct 29 while using the app. The cause is not known; a likely one is that the button waits for the server before it shows anything, but verify that by observation. Fix it so the button shows its pressed state at the tap, settles when the verdict is saved, and shows an error and reverts if the save fails. Done when a tap on either thumb changes the button visibly before the server answers on production, the saved verdict survives a reload, and a failed save is shown.

### #216 Sign out finishes

Tapping Sign out on Profile shows “Signing out…” and never completes, so the user stays signed in.

The owner reported this on Oct 29 at 15:09 on production, in desktop Chrome, on an account he had just created; signing out of his earlier account had worked a few minutes before. The cause is not known, so first observe whether the sign-out request is sent, whether it fails, and whether the page is waiting on something else, before changing anything. Done when Sign out on Profile signs the user out and returns to the sign-in page on production, on a newly created account and on an older one, and a failure shows a message instead of waiting forever.

### #219 Every screen has a visible way home

A user can reach a screen without seeing how to return to the feed.

Audit every screen and sheet, including detail and stories, for a visible exit that returns to the expected parent and a visible route to the feed. Preserve entered data when appropriate. Done when every screen has an obvious way home and each route works in production at 390x844.

### #220 Every meal has a short nutrition summary

A user cannot quickly read a meal's nutrition when its summary is missing or too long.

Show a short, readable summary of the recorded nutrition using calculated values and past-tense Consumed wording. Keep detailed nutrition available in detail. Done when a photo meal and a caption-only meal each show a concise summary consistent with their stored totals; do not invent values for unknown nutrition.

### #222 Photos and cards load fast

Photos and results cards can take too long to appear, especially on a slow mobile connection.

Measure initial display, bytes transferred and repeat navigation on a throttled connection before identifying the cause. Cover original photos, feed derivatives and rendered cards; preserve full-size detail quality. Done when the investigation records timings, the identified delays are resolved, and the production feed displays the appropriate assets promptly without repeated downloads. Related: #192 concerns processing-time flicker specifically.

## Match the frames

### #2 App shell and navigation

The app needs a frame before any feature can be placed in it.

Build a Next.js App Router PWA (manifest, service worker, installable from iPhone Safari, app name "My Food AI") with a five-slot bottom bar in this order: Home, Search, +, Days, Profile. Each slot is a route; + opens the capture screen as a full-screen sheet over whichever tab is current. Layout is mobile-first at 390 px wide with no horizontal scroll; desktop centres the same column. No onboarding, no interstitials, no splash beyond the browser's. Done when all five routes render placeholder content and the PWA installs on a phone.

### #3 Sign in and sign up

The first screen is the brand, a username field, a password field, Sign in, and a Sign up link, matching what Instagram shows a signed-out visitor; Continue with Facebook sits beneath, because this is a Meta hackathon and Facebook Login is Meta's own SDK.

Use Supabase Auth for email+password and for the Facebook provider (needs a Meta app ID and secret from developers.facebook.com, dev mode is enough for test users). On first successful sign-up create a `profiles` row and land the user on an empty feed with one line, "Post your first meal", and the + highlighted. No profile photo step, no find-friends, no notification prompt. Done when a new user reaches the empty feed in two screens.

### #6 Capture screen

This is the + sheet and the ten-second path from sign-in to first post.

Open the rear camera with the browser capture API (file input with `capture="environment"` is the reliable path on iOS Safari); show a shutter, a thumbnail strip of shots taken so far (several shots make a carousel), a caption field with placeholder "What did you eat?", and Post. Caption alone with no photo is a valid post. Post creates the `posts` row with status queued, uploads media, enqueues a job, closes the sheet, and returns to the feed where the new post is already at the top. Done when a timed run from the sign-in screen to a post in the feed is under 15 seconds on a phone.

### #28 Design system from the designer's style sheet

The repository has no design system, and none exists elsewhere for this project, so without one every screen gets styled ad hoc.

The visual direction is a mainstream photo-feed app: square photos, quiet type, one-column cards, a bottom bar with a centre +, and nothing that reads as a dashboard. The product, its copy and the repo never name the app it resembles. The designer delivers one style sheet (type scale, colour tokens, spacing, corner radius, item outline colours) and all ten screens in a single pass, in light mode only, with a generic brand mark and app icon; the brand mark is a stand-in and does not need to be final. These are the screens of a working app, not illustrative mockups. Turn the style sheet into Tailwind theme tokens named by role (surface, text, muted, accent) and a small set of shared components, so later screens use tokens and never raw values. Done when the theme file exists, the five routes from the app shell use it, and changing one colour token changes it everywhere.

### #193 Every screen is compared to designer frames and differences are listed

No screen has been compared with the designer's frames, and the intake control and the barcode scanner have no frame at all.

Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### #196 The coder signs in to production as the test account with no person involved

The coder cannot sign in to the production app, so it cannot run a page look or the demo script itself and has to stop at the sign-in step.

A planner report of Oct 28 said the coder's browser tool refuses to type a password even for the test account, and production sign-in has stayed with the owner since. The coder reaches production only through a session helper for API checks. The owner's rule is that a test run needs no human step. Make the test account's sign-in work for the coder from start to finish. Done when the coder signs in to production as the test account, posts a meal and reaches the feed with no person involved, and the page looks and the demo script run the same way.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196; the owner adds what he feels on his phone, because emulation cannot show that. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items, and the owner's own list has no open entry.

### #221 Sign-in is kept on every phone

A user should not have to sign in again each time the app is opened on a phone.

Investigate session persistence and renewal on phone browsers and the installed app, including closing and reopening. Keep each device's valid session until explicit sign-out or actual expiry. Done when returning to the app stays signed in on each supported phone, while explicit sign-out still ends that session. Use test accounts only.

## Late features

### #23 First-run hints

The three things a new user has never seen are the + sheet, the thread label, and the thumbs.

On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

### #168 Desktop browser layout is usable at 1280x800 and 1920x1080

The app is built phone-first. At 1024px and wider it should show a centred feed column; the bottom bar becomes a side or top nav; post detail opens beside the feed; keyboard navigation works; capture works by webcam or file upload.

Done when: at both sizes the feed, detail, capture, Days, Search and Profile are usable by mouse and keyboard with no horizontal scroll.

### #169 An MCP server and HTTP API let an agent log and read meals

Add a streamable-HTTP MCP server at /mcp and a documented HTTP API with the tools log_meal (caption, optional photo, optional eaten_at), list_meals (date range), get_meal and correct_meal. Auth is a per-user token created from a "Connect an agent" row on Profile, stored hashed and revocable; every call is scoped to the token owner and rate-limited; records only, past tense, no targets. No weight or exercise tools.

Done when: an MCP client logs a caption-only "coffee" with an eaten_at hours in the past and reads it back; a second user's token cannot read it; a revoked token is refused; docs/agents.md documents setup.

## Submission

### #26 Demo video and submission

The submission needs a public repo, a video, and a write-up that names what was built during the event.

Script: open on the Cal AI timeline ("50 screens and 22 minutes before my first log, 11:45 to 12:07"), cut to sign-in → camera → post in ten seconds, show the SAM outlines on the detail, make a correction and show the thread keeping both versions, show the needs-input strip, close on Days. Write-up states everything was built Oct 26 to Nov 4 on the Meta Model API with SAM 3.1 and Muse Spark 1.3, lists the three Meta model calls, and says what the app does not do. Done when the video is under three minutes and the write-up is in README.md.

### #60 The public repository holds no personal names, account detail or internal history

The submission requires a public repository, and the plan's public-docs rule says nothing under docs or in the README carries host names, account or billing detail, personal names or personal data.

The docs pull request merged into main on 2026-10-28 brought in the agents' contracts, the review policy, the Wall of Stupid file, the review skills and tools, the handover material and notes on the earlier database, and the planner reports that some of these carry the owner's initials and internal history. Decide with the owner which of these files stay on main (the review skills and tools are read from main by the coder and may stay if clean), move the rest out of the repository, and replace the README's missing start-here content with a short public one. Removing a file from main leaves it in the git history; whether history is rewritten is the owner's decision and is recorded in this item's pull request. Done when a search of every file on main for personal names, account identifiers, host names and billing detail returns nothing, the process documents the owner chose to withdraw are gone from main, and the review skills still run from main.

## Other open work

### #4 Schema with row-level security

The database is empty after the 2026-10-27 wipe and every table must be created with RLS on in the same statement, default deny.

Tables: `profiles` (id = auth user id, handle, role default 'user', created_at); `posts` (id, user_id, caption, eaten_at, visibility default 'private', status enum queued | processing | needs_input | ready | failed, created_at); `post_media` (id, post_id, storage_path, position, width, height); `post_items` (id, post_id, name, portion_text, portion_grams, mask_path, confidence, source enum model | user, created_at); `item_nutrition` (post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg, micronutrients jsonb, source_ref); `post_comments` (id, post_id, author enum user | model, body, created_at) with insert and select policies only, no update or delete, so corrections are never overwritten; `post_feedback` (post_id, user_id, verdict enum up | down, created_at); `jobs` (id, post_id, kind, priority smallint default 100, status, attempts, created_at, started_at, finished_at, error) with no client policies at all, reached only from server code with the secret key. Client policies grant `auth.uid() = user_id` (through post_id for child tables). Private storage bucket `media` with policies limiting each user to `media/{auth.uid()}/`. Write it as one migration under `supabase/migrations`, show the SQL before applying, apply with psql against `$SUPABASE_DB_URL`. Done when every table in `public` shows `rowsecurity = true` and a second test user cannot read the first user's rows.

### #5 Media upload

A photo taken on the capture screen must reach storage before the post is created, and it must be served fast on the feed.

Upload originals to `media/{user_id}/{post_id}/{position}.jpg` with a signed upload from the client; store width and height in `post_media`. Serve through Supabase image transforms (or Vercel image optimisation) at feed width so the feed never loads an original. Strip EXIF location. Done when a 12 MP phone photo uploads, appears in the feed under 300 KB, and the original is readable only by its owner.

### #7 Job queue and worker

Analysis is not instantaneous and free users wait longest; this has to be in the scaffolding, not bolted on later.

The `jobs` table is the queue: a Vercel cron or a route handler drains it, taking the lowest `priority` number first, then oldest, marking `started_at`, running the pipeline, and writing `finished_at` or `error` with `attempts` incremented; a job past three attempts sets the post to failed. Free users enqueue at priority 100; the schema allows lower numbers for later tiers but nothing in this version assigns them. The worker uses the Supabase secret key and never runs in the browser. Done when ten posts queued at once drain in order and a deliberately failing job lands in failed after three tries.

### #8 SAM 3.1 segmentation step

Every item on the plate needs an outline so the post detail can show where each estimate came from.

Call Meta Model API `sam-3.1` with the post's first image and a text prompt such as "food item" to get masks and boxes for every match; store each mask as a PNG under `media/{user_id}/{post_id}/masks/{n}.png` and the box in `post_items.mask_path` and a boxes column or jsonb. If SAM returns nothing (a photo of a receipt, a sock), record zero items and let the mismatch step handle it. Done when a plate with three distinct items yields three masks that align with the photo in the detail view.

### #9 Item naming and portions

Masks say where food is, not what it is.

Send the image, the caption, and each mask's box to Muse Spark 1.3 and ask for, per mask, a name, a portion in plain words and in grams, and a confidence; also ask it to reconcile the caption with the masks (caption "two eggs and toast" with two masks means one mask is probably both eggs). Write one `post_items` row per item with source model. The prompt and its schema live in one file so later sessions can tune it without touching the worker. Done when the three-item test plate comes back with correct names and portions within what a person would accept.

### #10 Nutrition lookup

Names and grams become calories, macros, and micronutrients from USDA FoodData Central, which is public domain and therefore safe under the Participant Guide's rights clause.

For each item, search FDC (API key from api.data.gov), pick the best match (Foundation and SR Legacy first, then Branded), scale per 100 g values to `portion_grams`, and write `item_nutrition` with `source_ref` = the FDC id. Cache FDC responses in a table keyed by query so the same food never hits the API twice. Store the full nutrient array in `micronutrients` so vitamins and minerals are available without a schema change. Done when a logged banana shows calories, the four macros, fibre, sugar, sodium, and potassium, each traceable to an FDC id.

### #44 Dedicated test account for browser checks of signed-in production app

Checking the live app after a change means signing in, and the coder cannot use the owner's personal login: browser tools often refuse to sign in to a site with someone's own username and password, so nothing behind the sign-in screen gets checked on the production site.

Create a dedicated test account that is an ordinary user of the app. Make it server-side with the Supabase secret key so no confirmation mail is needed, and keep its email and password only in `.env.local` as `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`, with the names added to `.env.example` and the values never committed. The coder signs in with it through the normal sign-in page in a browser. The account has no special rights, row-level security applies to it like any other user, and the app gets no route, flag or header that skips sign-in. Done when the coder can open the production site in a browser, sign in with the test account, post a meal and see it in the feed, and a second ordinary account cannot see that post.

## Tracked findings

### #116 An abandoned job on a meal recovers within ten minutes even when no page is open

Context: jobs are processed by a request-driven worker (the decided design). If a worker invocation is killed at its 300 s function limit while a job is running, the job is recovered only when a later call to /api/jobs/tick acquires the expired or unheld worker lease (recover_abandoned_jobs requires the job to be at least 360 s old). Today the ticks come from pages open under the tabs layout (QueueTicker ticks every 60 s and on focus) and from post/comment requests, so a meal someone is watching recovers about six minutes after it started; with no open page and no other request nothing ticks, so the job stays running until the next visitor. Raised by PPLX on PR #86 and waived by the PM as the decided request-driven design.

Vercel Cron limits, verified against the official docs on 2026-10-28 (vercel.com/docs/cron-jobs and /docs/cron-jobs/usage-and-pricing): cron is available on all plans; 100 cron jobs per project on every plan; Hobby: minimum interval once per day with per-hour precision (a daily job may fire anywhere within its hour), and a more frequent expression fails the deployment with 'Hobby accounts are limited to daily cron jobs'; Pro and Enterprise: minimum interval once per minute with per-minute precision; the schedule is always UTC; Vercel makes an HTTP GET to the project's production deployment URL at the configured path with user agent vercel-cron/1.0 and an x-vercel-cron-schedule header; the invoked function is an ordinary Vercel Function, so its usual duration and pricing limits apply. Which plan this project is on is not verified. Done when: a meal whose worker invocation was killed with no page open is retried or terminally failed within ten minutes, shown by a test that terminates a running job, makes no user request, and observes recovery from an independent scheduled call (for example a minutely cron on Pro, or an equivalent trigger if the project stays on Hobby).

### #117 Meal detail refreshes when the thread's first load already sees a completed correction

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #86 at head 34080f8a52ded32fbf8b6ef344ccee3773ae8945 and reported the finding below. The PM waived it as tracked, not blocking.

> Finding > [P2] Refresh meal details when the first thread load observes a newer completed analysis > Location: src/components/Thread.tsx, lines 24–27, where initialized, knownModels, and knownStatus establish the initial baseline. > The first successful thread load never refreshes the server-rendered meal details. Both refresh conditions require a previous observation: > tsx > if (initialized && models.some(row => !knownModels.has(row.id))) > router.refresh(); > if (knownStatus && knownStatus !== post.status) > router.refresh(); > That leaves a race between rendering the detail page and loading the client-side thread: > The server renders the meal while analysis or a correction is still processing. > The worker commits the updated items, model reply, and ready status before the thread’s first successful load. > That load sees the completed reply and ready status, but treats both as its initial baseline. > Subsequent polls see the same model IDs and status, so neither refresh condition fires. > The user can consequently see the new analysis reply alongside stale meal items or missing nutrition totals until they manually reload. The polling fallback does not repair this state because it only refreshes on changes relative to that first client-side observation. > Suggested fix: pass the server-rendered meal status and a revision identifier into Thread, then compare the first fetched snapshot against that baseline. Alternatively, perform a one-time router.refresh() after the initial successful load, taking care not to introduce a refresh/remount loop. > Regression test: render the page with a processing-state snapshot, have the first thread fetch return an already-completed correction, and verify that the meal details refresh without requiring another database event. Done when: a meal detail page rendered while a correction is still processing refreshes its items and nutrition when the thread's first load already sees the completed reply, shown by a test that returns a completed correction on the first fetch.

### #118 A UTC browser's first Home visit saves its detected time zone so day links carry it

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #87 at head 47ccb84cd97f93ccf1e0908643286fa8e32ddf43 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. P2 — A first Home visit in UTC never persists the detected timezone > Location: src/components/DayBubbles.tsx, lines 13–17. > The timezone cookie is written only when the browser timezone differs from the server’s zone: > tsx > if (local && local !== zone) { > document.cookie = ...; > router.refresh(); > } > When no cookie exists, the server defaults to "UTC". For a browser whose detected timezone is also "UTC", that condition never runs. Consequently, zoneKnown remains false and Home’s day links omit tz. > This matters when following a Home link from another timezone: > A UTC user copies a Home bubble link for a particular day. > The link contains neither a timezone parameter nor any timezone context. > A recipient opens it in another timezone. > LocalTimeZone applies the recipient’s timezone, potentially showing a different collection of meals for that date. > The new withZone behavior explicitly distinguishes an unknown fallback from a known timezone, but this branch never marks a detected UTC timezone as known. > Suggested fix: persist any successfully detected browser timezone, even when it equals the fallback. Refresh once when the cookie was previously unknown so subsequent links include the known zone. Reusing a single timezone-initialization component would also avoid the difference between Home and direct calendar/story entry. > Regression test: start Home without a timezone cookie in a UTC browser; verify that a cookie is saved and rendered day links eventually contain tz=UTC. Done when: a first Home visit in a UTC browser with no cookie saves the time-zone cookie and the rendered day links contain tz=UTC, shown by a test.

### #119 A time zone merely carried in a Days link does not stop the browser's zone from correcting it after travel

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #87 at head 47ccb84cd97f93ccf1e0908643286fa8e32ddf43 and reported the finding below. The PM waived it as tracked, not blocking.

> 2. P2 — Automatically propagated timezone parameters prevent timezone correction after travel > Locations: > src/lib/posts/days.ts, withZone > src/components/LocalTimeZone.tsx, line 10 > src/app/(tabs)/days/page.tsx, line 23 > src/app/days/[date]/page.tsx, line 26 > withZone adds tz to links whenever the timezone came from either a cookie or an explicit query parameter. The destination then treats any query parameter as an explicit user choice: > tsx > <LocalTimeZone ... explicit={Boolean(params.tz)} /> > LocalTimeZone immediately skips browser detection when explicit is true. > As a result, an automatically generated timezone becomes permanently authoritative during calendar/story navigation. For example, a user opens the calendar in one timezone, travels, and continues using its links in another timezone. Even a reload of that URL preserves the old zone: detection never runs, grouping remains in the previous timezone, and “today” can be wrong. Home behaves differently because its detection does not have this guard. > Suggested fix: distinguish an intentionally pinned viewing timezone from a timezone merely propagated from browser detection. Preserve explicit shared-link semantics if desired, but do not silently treat every cookie-derived navigation parameter as a deliberate override. > Regression test: navigate through a generated calendar link, change the browser timezone, reload, and assert the intended behavior for automatic versus explicitly pinned timezones. Done when: after changing the browser time zone and reloading a generated calendar or story link, the grouping and today marker follow the new zone, while an explicitly pinned shared link keeps its zone, shown by a test.

### #120 Days and stories refresh without re-reading every meal's items, nutrition and photos each minute

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #87 at head 47ccb84cd97f93ccf1e0908643286fa8e32ddf43 and reported the finding below. The PM waived it as tracked, not blocking.

> 3. P2 — The minute-by-minute reconciliation reloads every meal’s nutrition and signs every photo again > Locations: > src/components/PostReadinessListener.tsx, reconcileTimer > src/lib/posts/days.ts, getDays > Every visible tab page triggers router.refresh() once per minute, independently of whether any meal changed. On the calendar route, each refresh calls getDays for the whole month. > For each ready meal, getDays reads: > Current items. > Nutrition for those items, when items exist. > Media metadata. > A signed photo URL, when a media path exists. > For a month with 90 meals, all with items and photos, one reconciliation therefore performs approximately 360 per-meal backend operations, plus the posts pagination reads. Bounded concurrency limits simultaneous requests; it does not reduce their total or the repeated work. The calendar then renders only the first meal’s photo for each date, although every meal’s photo URL was signed. > Suggested fix: > Separate calendar summaries from full story hydration. > Batch current-item/nutrition reads where possible. > Resolve only the representative image needed for each calendar date. > Avoid unconditional full-month refreshes for midnight detection; refresh at the relevant date boundary or invalidate on actual changes. Done when: an unchanged populated month left open for several minutes does not re-hydrate every meal or re-sign every photo; calendar summaries, one representative image per date and boundary-based midnight refresh replace the unconditional minute refresh, shown by an instrumented test.

### #121 The search migration backfills search_tsv in batches instead of one table-wide update

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #88 at head eaf375cba5efb1a27f885483ed517ec1be65d64c and reported the finding below. The PM waived it as tracked, not blocking.

> 1. Incomplete Database Migration Rollback and Trigger Overhead > In 0009_posts_search.sql, running: > sql > update public.posts set caption = caption; > runs the newly created posts_search trigger across the entire table in a single transaction. On production databases with large meal histories, this backfill will lock the posts table and cause replication lag or statement timeouts. > Recommendation: > Consider computing search_tsv using a generated column (GENERATED ALWAYS AS ... STORED) if only on caption, or backfill in batched background workers rather than an unconditional table update in the schema migration. Done when: migration 0009 (or a follow-up) fills search_tsv without a single statement that rewrites every post row, shown by a test on a table of several thousand posts that stays under the statement timeout.

### #122 Search cards are hydrated in a few bulk queries instead of several reads per result

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #88 at head eaf375cba5efb1a27f885483ed517ec1be65d64c and reported the finding below. The PM waived it as tracked, not blocking.

> 1. N+1 RPC/Database Hydration Pattern > In src/lib/search/query.ts: > ts > const page = rows.slice(0, SEARCH_PAGE_SIZE); > const posts: (FeedPost | null)[] = []; > for (let start = 0; start < page.length; start += SEARCH_HYDRATE_CONCURRENCY) > posts.push(...await Promise.all( > page.slice(start, start + SEARCH_HYDRATE_CONCURRENCY).map(row => getPostCard(db, row.id)) > )); > While chunking by SEARCH_HYDRATE_CONCURRENCY = 6 limits client-side connection pooling exhaustion, fetching 24 cards still triggers 24 sequential/batched round trips with multiple joins each. > Improvement: Modify search_own_posts or create a batched getPostCards(db, ids[]) helper that fetches posts, items, and slides in 2–3 bulk queries using WHERE id = ANY(...). Done when: a 24-result search issues a constant small number of table reads (posts, media, items, nutrition fetched with id = ANY), shown by an instrumented test that the read count does not grow with the page size.

### #123 A feedback vote is rejected while the meal is queued or processing, even from an older card

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #90 at head b22a7cfbf8f09971cd29d0a741a49a3f384bc77e and reported the finding below. The PM waived it as tracked, not blocking.

> 1. [P2] Enforce the pending-state restriction inside the vote transaction > Location: supabase/migrations/0007c_feedback_revision.sql, save_revision_feedback, lines 35–41; src/app/api/posts/[id]/feedback/route.ts, lines 9–18. > The UI disables voting when hydration does not supply a revision, but neither the API nor the database function checks that the meal is still ready. The RPC locks the owned post, then validates only the comment’s membership and the item fingerprint. > A reproducible sequence is: > Load a ready meal and retain its revision ID and fingerprint. > Submit a correction, moving the meal into a pending state. > Before the worker changes the items or nutrition, submit feedback from the previously loaded card. > The vote succeeds because the old comment still exists and the item fingerprint has not changed. > This violates the PR’s stated rule that pending cards cannot submit a vote. A client-side check cannot close the gap because the card can become stale after rendering. > Suggested fix: read and validate posts.status = 'ready' while holding the same post lock used by save_revision_feedback. Return a recognizable conflict response so the client can refresh instead of displaying a generic save failure. Add a database test that changes only the status to a pending state and then attempts a vote using the previously valid fingerprint. Done when: save_revision_feedback checks status = 'ready' under the post lock and returns a conflict the client turns into a refresh, shown by a database test that changes only the post status and then attempts a vote with the previously valid fingerprint.

### #124 A slow initial feedback read never overwrites a newer successful vote

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #90 at head b22a7cfbf8f09971cd29d0a741a49a3f384bc77e and reported the finding below. The PM waived it as tracked, not blocking.

> 2. [P2] An initial feedback read can overwrite a newly saved vote > Location: src/components/ThumbsFeedback.tsx, lines 10–12. > The initial refresh() request and the post-feedback event both update verdict, but there is no ordering protection between them. The live flag prevents updates after effect cleanup; it does not prevent an older read from overwriting a newer event within the same effect. > A reproducible sequence is: > Mount the component and delay its initial post_feedback response. > Submit a thumbs-up or double-tap vote successfully. > sendFeedback dispatches post-feedback, setting the selected verdict to up. > Release the initial response, containing the previous verdict or no vote. > The read’s .then() overwrites the newly saved selection. > The database remains correct, but the visible thumbs state becomes wrong. With double-tap, this component does not perform another read afterward, so the mismatch can persist until remount. > Suggested fix: track a local mutation/event generation and apply a read result only if no newer feedback event has occurred since that read started. Also add a component test with a deferred initial response, a successful vote event, and then the stale response. Done when: ThumbsFeedback ignores a read that started before a successful feedback event, shown by a component test with a deferred initial response, a successful vote, then the stale response.

### #125 A meal at the same place with no caption or photo match never becomes a prior-meal hint

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #85 at head 489a695643d253685cf3dd7ea2bad8d01da83729 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. P2 — Unrelated meals at the same location qualify as prior-meal hints > Location: src/lib/pipeline/prior.ts:11–17 and supabase/migrations/0010_post_media_phash.sql:9–13 > priorScore() normalizes over whatever signals are available—including location alone: > ts > priorScore({ > text_score: null, > photo_score: null, > distance_m: 0, > }) // 1 > This occurs when a captionless current photo has no matching historical photo hash—for example, an older meal logged before this migration—but both posts have locations within 150 metres. > That candidate exceeds both thresholds without any evidence that the foods match. If the historical meal is caption-only, photo loading then falls back to its historical hint. As a result, an unrelated meal from the same home or restaurant supplies names and gram amounts to identification. The confirmation gate prevents direct copying in this case, but does not prevent the unrelated hint from influencing analysis. > Suggested fix: require an available text or photo signal before a candidate can qualify. Treat location as supporting evidence rather than sufficient evidence of meal identity. > Regression test: a candidate with only a nearby location must produce no prior hint or copied analysis. Done when: a candidate whose only signal is a nearby location produces no prior hint or copied analysis, a photo-only exact match is still eligible, and a same-place candidate with genuine text/photo mismatches does not qualify, shown by tests.

### #126 A rejected prior-meal confirmation falls through to the next ranked candidate

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #85 at head 489a695643d253685cf3dd7ea2bad8d01da83729 and reported the finding below. The PM waived it as tracked, not blocking.

> 2. P2 — Confirmation rejects a candidate without trying a valid runner-up > Location: src/lib/pipeline/prior.ts:28–32, 48 > The candidate loop stops at the first candidate with active items. The same-meal check happens afterward, and a negative result immediately returns: > ts > if ( > result.status !== "completed" || > !result.outputText || > JSON.parse(result.outputText).same_meal !== true > ) return { hint: "" }; > Consequently, a rejected top-ranked meal blocks every other candidate, even when the next candidate is an exact repeat. For example, several meals can have identical captions, nearby locations, and similar photo hashes, while only one has the correct portion. The visual check can correctly reject the first meal, but the implementation never considers the correct one. > Suggested fix: perform confirmation inside a bounded candidate loop. Continue after an explicit same_meal: false, while preserving the current propagation of retryable transport errors. > Regression test: two strong candidates, the first rejected and the second approved; verify that the second candidate’s items and nutrition are returned. Done when: with two strong candidates where the first is rejected and the second approved, findPrior returns the second candidate's items and nutrition, while retryable transport errors still propagate, shown by a test.

### #127 The prior-meal confirmation tests serve distinct current and past photos by post

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #85 at head 489a695643d253685cf3dd7ea2bad8d01da83729 and reported the finding below. The PM waived it as tracked, not blocking.

> 3. P2 — The confirmation-retry fixture no longer reaches confirmation > Location: tests/prior-hint.test.mjs, test "same-meal confirmation retries the gateway's transient 404 like identification does" > The fixture returns: > ts > storage_path: "u/p/photo.jpg" > But loadFirstPhoto() uses the supplied Supabase client’s storage download method, whereas this test provides a fake client rather than the real client/path-guard integration. The fixture therefore does not exercise the namespace guard that the PR description says these tests cover. > There is a second, concrete mismatch: the fake metadata query always returns that same historical path even when loading "current". This makes both confirmation images the same fixture object and would conceal a regression that downloads the wrong post’s photograph. > Suggested fix: make media responses depend on the requested post ID and use distinct current/past image bytes with paths such as u/current/0.jpg and u/p/0.jpg. Assert that the confirmation request contains both distinct images. If namespace-guard compatibility is the intended regression, use the real Supabase client fixture pattern already used in prior-captions.test.mjs. Done when: the confirmation-retry fixture returns media paths and bytes that depend on the requested post, and the test asserts the confirmation request carries both distinct images.

### #128 An answered clarification stays hidden when an older refresh finishes late

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #93 at head 5c4e7ff3495bc0f589464dbd0f92d85fc15989bf and reported the finding below. The PM waived it as tracked, not blocking.

> [P2] An in-flight refresh can restore an answered question and allow duplicate submission > Location: src/components/NeedsInputStrip.tsx, refresh() and remove(). > The strip’s refresh reads the current needs_input posts, then awaits media lookups and signed URLs before calling setPosts(). Meanwhile, successfully answering or discarding a meal calls remove(), which only filters the current React state. Nothing invalidates an already-running refresh or prevents it from installing its older result. NeedsInputStrip.tsx > A reproducible sequence is: > A refresh reads meal A while its status is needs_input, then pauses during its media requests. > The user submits an answer. The request succeeds, and remove(A) hides the question. > The older refresh finishes and reinstalls meal A from its stale result. > The user can reopen the question and submit another answer before the next successful refresh removes it. > The answer sheet sends every submission as a new comment, and append_post_comment() appends the text and schedules correction work; this is not an idempotent answer operation. Consequently, the stale UI can create an additional correction message, rather than merely displaying an obsolete question. NeedsInputSheet.tsx append_post_comment > Suggested fix: > Invalidate in-flight refreshes when an answer or discard succeeds, using a generation counter. > Ensure only a refresh started after that mutation can install new state. > Also reconcile selected with refreshed question state, so an open sheet cannot continue displaying a question that another tab has resolved or replaced. > Regression test: Hold a refresh after its posts query, complete an answer, release the old refresh, and assert that the question remains absent. Then verify that a subsequent fresh server result can display a genuinely new clarification for the same meal. Done when: a refresh that started before an answer or discard cannot reinstall that question, a later refresh can still show a genuinely new clarification for the same meal, and an open sheet reflects a question resolved elsewhere, shown by a component test with a held refresh.

### #129 The thumbs hint is claimed only by a card the reader can actually see

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #92 at head 5c65233f703b3c69c58776b570243cf5ea3b8dae and reported the finding below. The PM waived it as tracked, not blocking.

> Off-Screen Feed Items Prematurely Claim Thumbs Hint > In src/components/FirstRunHint.tsx and its integration in ThumbsFeedback.tsx: > tsx > void getHintState(hint).then((state) => { > if (!live || !state || state.seen) return; > const key = `${state.userId}:${hint}`; > if (claimed.has(key)) return; > claimed.add(key); identity = key; setVisible(true); > document.addEventListener("pointerdown", hide, true); > document.addEventListener("keydown", hide, true); > }).catch(() => {}); > In feed lists containing multiple meal cards, each card renders ThumbsFeedback. > The first card to resolve getHintState("thumbs") acquires the claim immediately upon mount, even if positioned below the fold or inside an unscrollable region. > Because document.addEventListener("pointerdown", hide, true) captures any tap or keypress globally, the first tap anywhere on the screen (such as scrolling or opening a different item) triggers hide() and registers dismissal before the tooltip is ever brought into the viewport . > Recommendation: Only register and mount FirstRunHint when the host container intersects the viewport (e.g., using an IntersectionObserver) and the target action buttons are interactive. Done when: an off-screen thumbs card cannot claim or dismiss the one-time hint; the hint mounts only when its host intersects the viewport and its controls are usable, shown by a test with one off-screen and one on-screen card.

### #130 A hint dismissal that fails to save is retried instead of lost until reload

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #92 at head 5c65233f703b3c69c58776b570243cf5ea3b8dae and reported the finding below. The PM waived it as tracked, not blocking.

> Unhandled Dismissal Failures Lock Session State > In src/components/FirstRunHint.tsx: > tsx > const hide = () => { > if (!identity || dismissed) return; > dismissed = true; > setVisible(false); > // Keep the session claim while retrying a transient action failure. > void dismissHint(hint).catch(() => dismissHint(hint)).catch(() => {}); > }; > hide() sets dismissed = true immediately before the remote persistence call completes. > In useEffect cleanup: > tsx > if (identity && !dismissed) claimed.delete(identity); > If network requests fail across both retry attempts, claimed retains ${userId}:${hint} for the remaining duration of the Single Page App session . > Because cleanup checks !dismissed, the failed dismissal is never retried upon component remount, and the hint will not display again until a full browser reload. > Recommendation: Queue unpersisted dismissals with exponential backoff or retry upon window focus/online status recovery rather than silently dropping failures after two immediate attempts. Done when: when both immediate attempts fail, the dismissal is queued and retried on focus, online recovery or remount, and the session claim is released only after a confirmed write, shown by a test that rejects two writes and then restores the connection.

### #131 Flipping the camera requires the requested facing, so a flip can never silently keep the same camera

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #103 at head 8a1d368a9aabbb4e37aee08e530bb1066f4124ba and reported the finding below. The PM waived it as tracked, not blocking.

> [P2] A successful request does not guarantee that the camera actually flipped > Location: src/lib/media/camera.ts, open() and the success path in flip(). > ts > const open = (mode: Facing) => > navigator.mediaDevices.getUserMedia({ > video: { facingMode: mode }, > audio: false, > }); > A plain facingMode value expresses a preference, not a requirement. The browser may successfully return a different camera—including the currently active camera. MDN explicitly distinguishes this form from { exact: ... }, which requires the requested facing direction. > developer.mozilla > That matters to the new acquire-first flow: > The rear camera is active. > flip() requests the front camera while retaining the rear-camera stream. > If the browser fulfills that request using the rear camera again, the promise resolves rather than entering the contention fallback. > The code stops the original stream and sets its internal facing to "user", even though the new stream still shows the rear camera. > The result is a silent no-op flip and internal facing state that no longer describes the selected camera. The next flip can request the rear camera again, making the control appear unresponsive. > Suggested fix: > Keep a best-effort preference for initial camera acquisition if that is intentional. > Require the target facing direction when switching, using facingMode: { exact: next }, or select a verified target device. > Treat an unavailable target as a recoverable flip failure without updating facing. > Add coverage for a request that resolves with the wrong-facing camera; the current mocks verify requested constraints, but not the selected camera. > Using a required facing constraint also makes the intended release-and-retry path meaningful: it cannot be bypassed merely because the browser successfully supplies the wrong camera. Releasing the current camera before switching is a documented requirement on some devices. > developer.mozilla Done when: flip() asks for facingMode exact for the target side (initial acquisition may stay a preference), treats an unavailable target as a recoverable flip failure without changing the recorded facing, and a test shows a request that resolves with the wrong-facing camera is not accepted as a flip.

### #134 After a failed card regeneration the meal never shows an outdated card beside new nutrition

Context: markReady now logs a card render/upload failure and marks the meal ready anyway (PR for item 17 follow-up). If the meal already has a stored card and a correction or recompute changes its nutrition, a failed regeneration leaves the old card attached, so the feed can show outdated calories and macros beside the new analysis, and enqueue_card_backfill only selects ready meals with no card, so nothing repairs it. A design that fixes this was built and reviewed on branch card-best-effort (closed PR #133, head fa99089): migration 0015 adds complete_post_without_card, which completes the meal and detaches its old card atomically under the post lock and worker-ownership check, returns the detached object path only when it is a generated card of that owner's meal, and leaves the card-less meal eligible for backfill.

Done when: a ready meal with a stored card whose regeneration fails after a correction shows the live nutrition (no outdated card) and gets a repair job, shown by a test that fails the render after a nutrition change and asserts the old card is no longer attached and the backfill selects the meal.

### #138 The pipeline integration tests run against a dedicated test Supabase project, not the shared database

Context: the offline pipeline harness (PR #96) runs against the project's single Supabase database with the test account. To keep deployed workers away from its fixture jobs it holds the global worker lease for the whole run, which pauses every live worker (a run killed before cleanup leaves the lease until it expires, 15 minutes). PPLX asked for a dedicated test project and the PM waived that finding as tracked, not blocking. Until then the harness refuses to run unless ALLOW_SHARED_DB_TESTS=1 is set, and it must not run during a demo (README).

Done when: the pipeline and database tests run against a separate Supabase project selected by configuration, they do not touch the worker lease of the production database, and ALLOW_SHARED_DB_TESTS is no longer needed.

### #140 The SAM caller keeps terminal transport causes terminal instead of turning them into a retryable 500

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #98 at head 39a59133dcebe2d78db4e6352873cedf5e7cdfd8 and reported the finding below. The PM waived it as tracked, not blocking.

> P2 — The SAM caller discards terminal SDK causes and turns them into retryable HTTP 500 errors > Location: src/lib/meta/sam.ts, toMetaApiError() and the catch around client.responses.create(); reached through the changed createMetaClient() call. > The new SDK classification tests establish that TLS/configuration failures should remain terminal after the SDK exhausts its internal retry. However, the actual segmentation path wraps the resulting error before the worker can classify it: > ts > const status = > typeof (error as { status?: unknown }).status === "number" > ? ((error as { status: number }).status as number) > : 500; > return new MetaApiError(status, `sam: ${message}`); > An SDK connection error with a terminal cause such as CERT_HAS_EXPIRED has no HTTP status. This wrapper therefore: > Substitutes status 500. > Drops the original error and its cause chain. > Makes isRetriable() return true because the replacement error has status 500. > Consequently, a certificate/configuration failure that the new direct-client test correctly classifies as terminal becomes retryable when it occurs during segmentFoodRegions(). The current test calls createMetaClient().models.list() directly, so it does not cover this application boundary. > The wrapper predates this PR, but it prevents the newly introduced client/classifier policy from holding for the SAM integration changed here. > Suggested fix: preserve statusless transport errors rather than manufacturing an HTTP status for them. For example: > ts > function toMetaApiError(error: unknown, fallback: string): Error { > if (error instanceof MetaApiError) return error; > const status = > typeof error === "object" && error !== null > ? (error as { status?: unknown }).status > : undefined; > const message = error instanceof Error ? error.message : fallback; > if (typeof status === "number") { > return new MetaApiError(status, `sam: ${message}`); > } > return new Error(`sam: ${message}`, { cause: error }); > } > This lets the existing cause-walking classifier distinguish an exhausted SDK timeout from a terminal TLS failure. Merely attaching a cause while keeping the synthetic 500 is insufficient: the classifier retains the outer HTTP status. > Regression test to add: drive the mocked transport through segmentFoodRegions() and assert: > A terminal TLS/configuration cause remains non-retryable at the caller boundary. > An exhausted SDK timeout remains retryable. > Actual HTTP 400, 408, and 409 remain terminal. Done when: toMetaApiError in src/lib/meta/sam.ts preserves a statusless SDK error with its cause (so a certificate or configuration failure stays non-retryable and an exhausted timeout stays retryable) and real HTTP 400, 408 and 409 stay terminal, shown by tests driven through segmentFoodRegions().

### #141 A voice recording that the worklet never acknowledges stops itself and unlocks the composer

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #91 at head 9fe7343864bb350e57372e10d4d35006dd54c342 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. P2 — Stopping can leave the composer permanently locked if the worklet does not acknowledge > Location: src/components/VoiceRecorder.tsx:12–29 > stop() sets locked.current = true and switches to sending, but all subsequent cleanup and unlocking depend on receiving data.stopped from the worklet. There is no acknowledgement deadline or processor-error recovery path. If the worklet fails or its context stops processing before acknowledging, the recorder stays in “Transcribing…” even though the HTTP request has not started. The parent’s voice-active flag also remains true, preventing the user from submitting an otherwise valid typed comment. [github_mcp_direct] > Suggested fix: > Add a bounded deadline for the stop acknowledgement. > Handle AudioWorkletNode.onprocessorerror. > Route both failures through an idempotent finalizer that stops tracks, closes the context, releases the lock, and calls onActiveChange(false). > Show a recoverable recording error rather than remaining in the sending state. > Regression test: simulate a worklet that never acknowledges stop; verify that capture resources are released and the composer becomes usable again. Done when: stop() has a bounded acknowledgement deadline and an onprocessorerror path that release tracks, the audio context and the parent's active flag exactly once and show a recoverable error, shown by a test with a worklet that never acknowledges.

### #142 Dictated text is never silently cut at the 4,000-character comment limit

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #91 at head 9fe7343864bb350e57372e10d4d35006dd54c342 and reported the finding below. The PM waived it as tracked, not blocking.

> 2. P2 — Appending a transcript silently discards dictated text at the comment limit > Location: src/components/CommentComposer.tsx:21 > The transcript callback appends the recognized text and then immediately applies .slice(0,4000). If the draft already contains 4,000 characters, the entire transcript disappears without an error. If it is close to the limit, only a prefix survives, potentially cutting a correction mid-sentence. The recorder then returns to idle without preserving the full transcript for recovery. [github_mcp_direct] > Suggested fix: > Check the combined length before replacing the draft. > Preserve an over-limit transcript separately and explain that the user needs to shorten the draft. > Alternatively, provide an explicit review/replace interaction instead of silently truncating. > Regression tests: append a transcript to a 4,000-character draft and to a nearly full draft; verify that no recognized text is silently lost. Done when: appending a transcript to a full or nearly full draft keeps the whole transcript available (or asks the reader to shorten the draft) instead of discarding it, shown by tests for a 4,000-character draft and a nearly full draft.

### #143 A model-call trace shows how many provider attempts a retried call took and the statuses in between

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #95 at head 04af3cf6ce42f69a445f4e35720fe3b3ac828132 and reported the finding below. The PM waived it as tracked, not blocking.

> P2 — Provider retries disappear into a single successful trace > Location: src/lib/meta/client.ts, createResponse() and metaFetch(); src/lib/meta/transcribe.ts, transcribe(). > The new recordCall() wrappers surround the complete logical operation, outside metaFetch()’s retry loop. Consequently, a provider request that receives a retryable failure and then succeeds produces just one trace with error: null. > The existing transcription regression test provides a concrete example: > The first provider request returns HTTP 429. > metaFetch() retries and receives a successful transcript. > recordCall() stores only the successful result. > The duration includes both attempts and the retry wait, but the trace contains no attempt count or intermediate failure status. > An administrator therefore cannot distinguish an ordinary slow success from a rate-limited operation that needed multiple provider requests. This loses information directly relevant to the feature’s purpose: diagnosing model-call latency and failures. The current implementation and two-attempt test are visible in the > #95 — PR changes (diff). > Suggested fix: retain logical-operation tracing, but add attempt count, retry statuses, and accumulated retry-wait duration. Alternatively, record individual attempts under a shared logical-call identifier. Make the distinction between an operation and a provider attempt explicit in the admin UI. > Regression test: simulate 429 → 200, then assert that the persisted trace exposes two attempts and the intermediate 429, while the caller still receives the successful result. > This is an observability defect, not evidence that meal processing itself fails. Done when: a call that gets 429 then 200 stores a trace exposing two attempts, the intermediate 429 and the accumulated retry wait (or one trace per attempt under a shared call id), and the admin page distinguishes a logical call from a provider attempt, shown by a test that simulates 429 then 200.

### #145 A registration in flight at sign-out cannot recreate the old account's push subscription

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #94 at head a782775 and reported the finding below; the PM waived it as tracked, not blocking, on two conditions that #94 now meets (the push payload is generic text only, and the subscribe route upserts on endpoint so a new owner takes the endpoint from any previous owner).

> 1. P1 — Aborting registration does not prevent a late server upsert after logout cleanup > Location: src/lib/push/lifecycle.ts, pushSignOutStarted() / postPushSubscription(); src/app/api/push/subscribe/route.ts, POST. > Registration and logout share a browser lock, but the server-side registration is not protected by that lock. Aborting its fetch releases the client-side operation without guaranteeing that the server has stopped processing the POST. > A possible sequence is: > A registration POST authenticates and begins processing. > Logout aborts the client fetch, causing the registration operation to release the lifecycle lock. > Logout’s DELETE finishes and attempts browser unsubscription. > The already-running POST completes its admin upsert afterward, restoring the subscription row for the old account. > If browser unsubscription succeeds, that restored row is merely stale. If unsubscription fails—the failure path this implementation explicitly tolerates—the old account can remain deliverable after sign-out. The origin-wide Web Lock therefore does not fully establish the registration-before-detachment ordering claimed in the code comments. > Suggested fix: enforce ordering on the server, using a per-installation generation or revocation record checked atomically by registration and advanced by detachment. A canceled client request must not be able to recreate a detached generation. > Regression test: pause the POST before its upsert, abort the client request, complete DELETE, then resume POST. Assert that the old registration cannot become active again, including when browser unsubscribe() fails. > Source locations: lifecycle implementation, subscription route. Done when: registration is ordered against detachment on the server (a per-installation generation or revocation record checked atomically by the subscribe upsert and advanced by detachment), so a registration request that was in flight when the user signed out cannot recreate the old account's subscription, including when browser unsubscribe() fails, shown by a test that pauses the POST before its upsert, aborts the client request, completes the DELETE, then resumes the POST.

### #146 sendPostPush rejects a postId that is not a UUID before querying

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #94 at head 9e0aff69e5dc26df3ab67af3bf805daeb397abce and reported the point below. The PM waived it as tracked, not blocking.

> Unvalidated UUID Format in Worker Push Queries > File: src/lib/push/send.ts > Problem: public/sw.js explicitly validates UUIDs via /^[0-9a-f-]{36}$/i.test(...), but sendPostPush directly executes: > ts > await admin.from("posts").select("user_id,status,needs_input").eq("id", postId).maybeSingle(); > If an invalid or non-UUID postId enters this call, Supabase/PostgreSQL will throw a 22P02 invalid input syntax for type uuid error. > Recommendation: Guard postId with a quick regex or Zod validator before executing DB queries. Done when: sendPostPush returns without a database error for a non-UUID post id, shown by a test.

### #147 Apple push endpoints on regional push.apple.com hosts are accepted

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #94 at head 9e0aff69e5dc26df3ab67af3bf805daeb397abce and reported the point below. The PM waived it as tracked, not blocking.

> Restricted Push Gateway Hostname Allowlist > File: src/lib/push/send.ts (validSubscription) > Problem: The validation checks: > ts > url.hostname === "fcm.googleapis.com" || > url.hostname === "web.push.apple.com" || > url.hostname === "updates.push.services.mozilla.com" || > url.hostname.endsWith(".notify.windows.com") > Impact: Apple Web Push uses regional subdomains (e.g., *.push.apple.com such as web.push.apple.com, but also region-specific gateways depending on iOS Safari versions and macOS targets). Testing strictly on web.push.apple.com will fail for endpoints like *.push.apple.com. > Recommendation: Use url.hostname === "web.push.apple.com" || url.hostname.endsWith(".push.apple.com"). Done when: validSubscription accepts the Apple Web Push hostnames Apple documents (checked against Apple's documentation first) and still rejects other hosts, shown by tests.

### #148 A user can register only a small number of push devices

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #94 at head 9e0aff69e5dc26df3ab67af3bf805daeb397abce and reported the point below. The PM waived it as tracked, not blocking.

> Unbounded Endpoint Length / Rate Limiting on Push Subscription > File: src/app/api/push/subscribe/route.ts > Observation: POST uses createAdminClient() (bypassing RLS) to upsert subscriptions into push_subscriptions. An authenticated user could spam different valid-looking push endpoints to bloat the database or overwrite another user's device endpoint (since endpoint is the conflict target). > Recommendation: Add per-user rate limiting or cap active subscriptions per user (e.g., max 5 devices). Done when: POST /api/push/subscribe caps active subscriptions per user and rejects the rest with a clear error, shown by a test.

### #149 push_subscriptions has an index on user_id

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #94 at head 9e0aff69e5dc26df3ab67af3bf805daeb397abce and reported the point below. The PM waived it as tracked, not blocking.

> Recommended Database Optimization > In supabase/migrations/0012_push_subscriptions.sql: > sql > CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id); > Since sendPostPush queries .eq("user_id", post.user_id) on every completed meal analysis and clarification request, adding an index on user_id avoids table scans as subscription volume grows. > 15 sources Done when: migration 0012 (or a follow-up) creates an index on push_subscriptions(user_id), shown by a catalog check.

### #153 Changing a meal's eaten time in another tab reorders an already-open feed

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #152 at head 97a23b01d6de508cbec473114fa7c6c40abaff98 and reported the finding below. The PM waived it as tracked, not blocking.

> P2 — Propagate eaten-time changes to the parent feed > Location: src/components/EatenAtEditor.tsx:20, interacting with src/components/Feed.tsx and src/components/RealtimePost.tsx. > The new editor saves eaten_at and calls router.refresh(), but feed ordering lives in Feed’s client-side baseline and cards collections. mergeFeedPosts() sorts those collections; it does not see the fresher post held inside an individual RealtimePost. > When a realtime UPDATE arrives, RealtimePost fetches the updated meal and updates only its own snapshot. It does not notify Feed that the sorting key changed. Consequently, a card can display its new eaten time while remaining in its old position. The discovery poll does not repair this: it fetches IDs and skips meals already present in baseline or cards. > Reproduction: > Open the feed in one tab with two meals: A eaten at 12:00 and B eaten at 09:00. > In another tab, edit A’s eaten time to 08:00 and save. > Return to the feed tab. > A’s card can refresh to show 08:00, but the parent still renders A above B, using its cached 12:00 sorting key. > This undermines the PR’s central behavior: ordering meals by when they were eaten. > Suggested fix: propagate refreshed posts—or a specific eaten-time change notification—to the parent feed, update its canonical post data, and republish through mergeFeedPosts(). A local event alone is insufficient for the cross-tab case unless the realtime refresh also informs the parent. > Regression test: start with [A(12:00), B(09:00)], deliver an update changing A to 08:00, and assert that the rendered order becomes [B, A] without reloading the page. Done when: a realtime update to a loaded meal's eaten_at is passed to the parent feed, which re-sorts through mergeFeedPosts without a reload, shown by a test that moves A from 12:00 to 08:00 below B at 09:00.

### #155 A drag that comes back to where it started is never taken for a tap on a photo

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #154 at head d27f803fa21e28f07799a1800f2c89af60d6da65 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. P2 — A drag that returns near its starting point is treated as a tap > Location: src/lib/posts/tap.ts:29–35; pointer handlers in src/components/DoubleTap.tsx. > The controller checks movement only by comparing the pointer-down and pointer-up positions: > ts > if (!from || Math.hypot(x - from.x, y - from.y) > TAP_MOVE_PX) > There is no pointer-move handler or tracking of maximum movement during the gesture. Consequently, this sequence is accepted as a tap: > Press on the photo. > Move significantly away from the initial position. > Move back within eight pixels of the initial position. > Release. > If the browser has not emitted pointercancel, the controller queues navigation—or votes if the release qualifies as a second tap. This contradicts the controller’s stated guarantee that dragging cannot open the meal. The existing drag test covers only a release far from the starting point. > Suggested fix: Track movement throughout the gesture. Once movement exceeds TAP_MOVE_PX, invalidate that gesture permanently and cancel pending navigation. Wire this through onPointerMove. > Regression test: Down at (100, 100), move to (140, 100), return to (100, 100), then release. Advancing timers should produce neither navigation nor a vote. Done when: the tap controller tracks movement through the whole gesture (pointermove), so leaving the tap radius invalidates that gesture for good and cancels a queued open, shown by a test: down, move away, move back, release produces neither an open nor a vote.

### #156 The photo on a card is a real link for keyboard and assistive technology

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #154 at head d27f803fa21e28f07799a1800f2c89af60d6da65 and reported the finding below. The PM waived it as tracked, not blocking.

> 2. P2 — The newly clickable photo has no keyboard-accessible link behavior > Location: src/components/DoubleTap.tsx:23–26; photo branch in src/components/Carousel.tsx. > Photo navigation is implemented through pointer handlers on a plain <div>. That element has no link semantics, focusability, or keyboard activation. The carousel’s tabIndex={0} focuses the scrolling container, not a control that opens the photo’s meal. > This leaves different behavior across the new navigation surfaces: > Stored nutrition cards use Link. > Caption-only nutrition cards use Link. > Photos look and behave as navigation targets for pointer users but expose no equivalent photo control to keyboard users. > The separate “Details ›” link means the meal remains reachable, so this is not a complete navigation blocker. It is nevertheless an accessibility gap in the newly introduced photo interaction. > Suggested fix: Expose the photo’s navigation through a real link, preserving normal keyboard activation and link behavior while explicitly handling pointer single/double taps. Ensure the gesture logic does not also trigger native navigation after a double tap. > Regression tests: Verify that the photo link is keyboard-focusable, Enter opens the meal, and a pointer double tap votes without navigating. Done when: the photo renders as a link that is focusable and opens the meal on Enter and on modified clicks, while pointer single and double taps keep their delayed open and vote without a second native navigation, shown by tests.

### #158 The installed app keeps controls out of the notch area in landscape

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #157 at head fb04b1ef9c8fc52802b05a578c07cde4d64bab84 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. [P2] Landscape safe areas remain unprotected > Location: src/app/globals.css:17–23, together with src/app/layout.tsx:16. > The PR enables viewportFit: "cover" globally, but all seven new utilities account only for the top or bottom inset. There is no corresponding handling of safe-area-inset-left or safe-area-inset-right. > On a notched iPhone in landscape, this leaves edge-aligned content unprotected where the app extends into the side unsafe areas. For example: > TopBar keeps its existing horizontal px-screen-x spacing for back and close controls. > StoryPlayer keeps its horizontal controls and content at ordinary screen padding. > CaptureSheet uses those same horizontal gutters for its controls. > The practical consequence is that rotating the installed app can still put controls or content into the notch area, despite this PR’s safe-area fix. The effect depends on whether the viewport is wider than the centered max-w-phone container; existing centering may already provide enough clearance on some devices. > Suggested fix: account for left and right insets at the edge-reaching layout boundaries, preserving the existing design gutters. Avoid blindly adding viewport insets to every centered container, which could introduce unnecessary padding where outer margins already provide clearance. Done when: left and right safe-area insets are applied at the edge-reaching layout boundaries (top bars, story player, capture sheet) without adding padding where the centred container already clears them, verified on a notched iPhone in both landscape orientations.

### #162 Home's intake totals roll over at local midnight and when the page becomes visible again

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #161 at head 04b977785f10b2a9826c2c92094539cda9b16110 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. [P2] “Today’s totals” remain yesterday’s after midnight > Location: src/components/IntakeBar.tsx:20–22, 35–39 > The component calculates the current day’s boundaries when read() runs, but automatically reads only on mount. There is no midnight rollover, focus, or visibility-change refresh. > Reproduction: > Open Home and log water in the evening. > Leave the page mounted across local midnight, including by backgrounding and reopening the browser. > The component continues displaying yesterday’s intake as today’s totals. > Adding a new entry triggers a read with the new day’s boundaries, suddenly changing which day the display represents. > Refresh when the local date changes and when the page becomes visible again. Track the date associated with the displayed totals so yesterday’s data cannot continue appearing as today’s while a replacement read is pending. Add a fake-clock test that crosses midnight without remounting. [github_mcp_direct] Done when: IntakeBar refreshes when the local date changes or the page returns to visible and never shows yesterday's totals as today's, shown by a fake-clock test that crosses midnight without remounting.

### #163 Home's intake total is exact however many rows the day has

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #161 at head 04b977785f10b2a9826c2c92094539cda9b16110 and reported the finding below. The PM waived it as tracked, not blocking.

> 2. [P2] Home can silently display a truncated intake total > Location: src/components/IntakeBar.tsx:23–25 > Home selects all matching intake rows in one request and immediately sums the returned data. Unlike the new story loader, it has no pagination or server-side aggregation. > When a day exceeds the API’s configured response-row cap, a successful response contains only part of that day’s intake. Home nevertheless presents the sum as complete. Subsequent additions may also appear not to change the total if their rows fall outside the returned subset. The PR already recognizes this failure mode in getDays() and includes a 2,500-row pagination test there, but the equivalent Home path remains unprotected. > Use a shared paginated reader with deterministic logged_at, id ordering, or a server-side aggregate that preserves owner isolation. Test that Home and the day story return identical totals when the result spans multiple pages. [github_mcp_direct] Done when: Home reads its day's intake with the same paginated, ordered reader (or a server-side aggregate) as the day story, shown by a test that Home and the story return the same total for a day spanning several pages.

### #164 A failed intake read in the day story shows as unavailable, not as zero

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #161 at head 04b977785f10b2a9826c2c92094539cda9b16110 and reported the finding below. The PM waived it as tracked, not blocking.

> 3. [P2] A failed story intake query is indistinguishable from no logged intake > Location: src/lib/posts/days.ts:85–98; src/components/StoryPlayer.tsx:73 > Each day starts with emptyIntake(). If any intake page returns an error, getDays() breaks out and returns those zero-valued defaults. StoryPlayer then suppresses the intake line because intakeLine(emptyIntake()) is empty. > Consequently, a user with saved intake sees it disappear from the story during an intake-query failure, with no indication that the data could not be loaded. Home explicitly distinguishes “not read or failed” from zero; the story should preserve the same distinction. > Represent unavailable intake separately—for example, with intake: IntakeTotals | null—and show a small unavailable/retry state while keeping the meal story usable. Test both first-page and later-page failures, ensuring neither becomes a valid empty total. [github_mcp_direct] > Scope and verification > I did not count intake-only days lacking a story or calendar marker as a finding: the PR explicitly declares that limitation. > The returned check-run list contains one successful check, “Vercel Preview Comments.” It does not establish that the new unit or database/RLS tests passed. > No review comments or changes were posted to GitHub. [github_mcp_direct] > Fix the midnight rollover issue in IntakeBar.tsx Done when: LoggedDay.intake is null when any intake page fails and the story shows a small unavailable state while the meals stay usable, shown by tests for a first-page and a later-page failure.

### #166 A barcode FDC does not hold costs up to nine sequential FDC requests

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #165 at head ef7a2d774d71bf3bd599d94da14c9a34638740c4 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. [P3] lookupBarcode Sequential Candidate Querying > In src/lib/fdc/barcode.ts, lookupBarcode iterates sequentially through candidates and pages: > typescript > for (const gtin of candidates) { > for (let page = 1; page <= MAX_PAGES; page += 1) { > // fetch FDC /foods/search > } > } > If an unknown barcode produces 3 candidate variations (e.g., raw, zero-padded, trimmed), it could issue up to > 3×MAX_PAGES=9 > 3×MAX_PAGES=9 sequential HTTP requests before returning null . > Because FDC rate limits free API keys (typically 1,000 requests/hour), consecutive missed lookups could exhaust quota quickly. > Recommendation: Consider prioritizing the most canonical format (or limiting candidate variations to 2), or adding an overall abort timeout (AbortSignal.timeout(8000)) so mobile network latency does not hang the search state. Done when: lookupBarcode bounds the requests for one scan (fewer candidate forms or an overall timeout) so a missed scan cannot spend much of the FDC hourly quota or hang on a slow network.

### #167 Successful barcode lookups are cached by GTIN

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #165 at head ef7a2d774d71bf3bd599d94da14c9a34638740c4 and reported the finding below. The PM waived it as tracked, not blocking.

> 3. [P3] Server Route Header Caching > In src/app/api/fdc/barcode/route.ts: > Positive and negative responses both return Cache-Control: private, no-store . > While preventing stale user data is sensible, caching successful lookups by GTIN (either via Next.js fetch caching or an in-memory/KV store) would eliminate duplicate upstream hits for staple branded foods. > Testing & Verification > Added tests in tests/barcode.test.mjs thoroughly cover GTIN validation, UPC-E algorithmic reconstruction, nutrient parsing, synthetic 1D barcode raster decoding via ZXing, and multi-page pagination handling . > Pending Physical Smoke Test: As noted in the pull request description, real iOS Safari hardware validation remains required to confirm video element aspect-ratio layout and camera feed orientation in production . Done when: A repeated scan of the same product is served from a cache (like fdc_cache) without another FDC request.

### #180 Household serving strings with parentheses or a leading weight parse to the right unit

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #179 at head 6ca992a78d1173d97186e02bd9933d442d425607 and reported the finding below. The PM waived it as tracked, not blocking.

> 1. [P3] FDC Household Serving Regex Parser Nuance > In src/lib/nutrition/units.ts: > ts > const match = /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s+([a-z][a-z .-]*)/i.exec(household); > For FDC branded foods where householdServingFullText includes parentheticals before or after units (e.g. 1 slice (approx. 28g) or 1/2 cup (cooked)), match[2] captures slice (approx or cup (cooked). > The piece check does: > ts > else if (!MASS_OR_VOLUME.test(word.split(/[\s(]/))) push("piece", amount, serving); > While split(/[\s(]/)[0] safely isolates the leading token, entries formatted like 1 (120g) apple or 1 package (about 2 cups) could either fail the regex match or parse the wrong unit token. > Recommendation: Add a couple of real-world edge case strings from USDA Branded food items to tests/servings.test.mjs to ensure household description variations parse as intended. Done when: portionsFromDetail handles real Branded householdServingFullText forms such as '1 slice (approx. 28g)', '1/2 cup (cooked)' and '1 package (about 2 cups)', shown by tests with strings taken from USDA data.

### #181 A food with several cup or piece portions uses the right one

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #179 at head 6ca992a78d1173d97186e02bd9933d442d425607 and reported the finding below. The PM waived it as tracked, not blocking.

> 2. [P3] Multiple Portion Matches for Cup or Piece > In src/lib/nutrition/units.ts: > ts > export function toGrams(quantity: number, unit: Unit, portions: FoodPortion[]): number | null { > ... > const portion = portions.find((entry) => entry.unit === unit); > return portion ? quantity * portion.gramsPerUnit : null; > } > In USDA Foundation and SR Legacy data, foods often report multiple portion sizes under the same category (e.g., 1 cup, chopped, 1 cup, diced, 1 cup, sliced, or small/medium/large pieces). > portionsFromDetail appends each matching entry into FoodPortion[], but toGrams always picks the first matching entry via .find(...). > Recommendation: While deterministic, consider ensuring the portion parsing prioritizes standard base measures or surface available modifiers in a future iteration. Done when: toGrams prefers the standard base measure (or the user picks the modifier) when FDC lists several cup or piece portions, shown by a test with chopped, diced and sliced cups.

### #182 The servings stepper does not act on a stale value while the page refreshes

Context: PPLX (Gemini 3.8 Flash, runner proof model_preference = gemini38flash) reviewed PR #179 at head 6ca992a78d1173d97186e02bd9933d442d425607 and reported the finding below. The PM waived it as tracked, not blocking.

> 3. [P3] Stepper Race Condition on Rapid Clicks > In src/components/ServingsControl.tsx: > ts > const change = async (direction: 1 | -1) => { > if (busyRef.current) return; > busyRef.current = true; setBusy(true); setError(""); > try { > const response = await fetch(`/api/posts/${postId}/servings`, { > method: "POST", > headers: { "Content-Type": "application/json" }, > body: JSON.stringify({ servings: stepServings(servings, direction) }) > }); > if (!response.ok) throw new Error(...); > router.refresh(); > } catch (e) { ... } > finally { busyRef.current = false; setBusy(false); } > }; > stepServings computes the target value using the prop servings. > Because Next.js router.refresh() is asynchronous, busyRef.current is cleared before router.refresh() finishes re-rendering the server component with the updated prop. If a user clicks immediately after the fetch completes, the second click may evaluate against the stale servings value, repeating the same POST request. > Recommendation: Track optimistic servings locally in state or disable the buttons until router.refresh() completes. > Review Summary > Area Status Notes > Database Migration Passed Uses explicit transaction locking (FOR UPDATE), sets default values, and validates permissions. > API Endpoints Passed Validates UUIDs, rejects unauthorized requests, and returns clear 422 errors for unmapped units. > Unit Conversions Passed Exact conversion for oz (28.349523125 g); proper fallback to 422 when piece/cup weights are unavailable. > UI Controls Minor Suggestion Prevent re-triggering step actions against stale props before server revalidation completes. > Focus on the database migration and rollback safety > Examine the FDC household serving regex edge cases > Check for race conditions in the UI stepper controls > Review the test coverage for invalid unit conversions Done when: ServingsControl keeps the new value locally or stays disabled until router.refresh() has delivered it, shown by a test of two quick clicks.

## Blocked

### #114 Public sign-in with Facebook works in production mode

Facebook Login works in development mode for the developer's own and test accounts, which is enough for the demo. Public sign-in with Facebook needs the Meta app submitted for review and approved. This item stays blocked until that review is done.

Blocked: Meta app review. Done when: a person who is not a developer or test account of the Meta app can sign in with Facebook on the production site.

### #115 Dark mode renders every screen from the same tokens

The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

Blocked: scope; the first design pass is light mode only. Done when: every screen renders in a dark set of the same role-named tokens, with no raw colour values in components.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked: after the hackathon and until the owner explicitly rules on the claims restriction. A share of intake is a percentage, and the app currently permits no percentage that reads as progress. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn. This issue authorizes no implementation or exception to the current records-only product rule.

---

† Generated from the current open GitHub issues in aibraincoach/my-food-ai. Each issue appears once; closed issues are omitted. Designer work appears first, followed by the existing work groups, other open work, tracked findings and blocked work. The issue is the source of truth for its full context and done condition.
