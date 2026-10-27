# My Food AI — Backlog†

Last edited: Tuesday 2026-10-27 at 15:51 JST (UTC+09:00) by Claude, PM session 1

## Backlog

Ordered by what moves the product ahead next. Each item carries its GitHub issue number from aibraincoach/my-food-ai (#2 to #26, #28, #29, #44 and #45; #1 is the docs PR). Blocked items have no issue. Build stance: minimal. Nothing in this build depends on a paid add-on or a host feature that costs extra, and the app's own code decides when its work runs.

### #2 App shell and navigation

The frame, the bottom bar and the five routes are merged and live; what remains is the PWA part of the brief below (manifest, service worker, install from iPhone Safari). Build a Next.js App Router PWA (manifest, service worker, installable from iPhone Safari, app name "My Food AI") with a five-slot bottom bar in this order: Home, Search, +, Days, Profile. Each slot is a route; + opens the capture screen as a full-screen sheet over whichever tab is current. Layout is mobile-first at 390 px wide with no horizontal scroll; desktop centres the same column. No onboarding, no interstitials, no splash beyond the browser's. Done when all five routes render placeholder content and the PWA installs on a phone.

### #44 Test account for browser checks

Checking the live app after a change means signing in, and the coder cannot use the owner's personal login: browser tools often refuse to sign in to a site with someone's own username and password, so nothing behind the sign-in screen gets checked on the production site. Create a dedicated test account that is an ordinary user of the app. Make it server-side with the Supabase secret key so no confirmation mail is needed, and keep its email and password only in `.env.local` as `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`, with the names added to `.env.example` and the values never committed. The coder signs in with it through the normal sign-in page in a browser. The account has no special rights, row-level security applies to it like any other user, and the app gets no route, flag or header that skips sign-in. Done when the coder can open the production site in a browser, sign in with the test account, post a meal and see it in the feed, and a second ordinary account cannot see that post.

### #28 Design system from the designer's style sheet

The repository has no design system, and none exists elsewhere for this project, so without one every screen gets styled ad hoc. The visual direction is a mainstream photo-feed app: square photos, quiet type, one-column cards, a bottom bar with a centre +, and nothing that reads as a dashboard. The product, its copy and the repo never name the app it resembles. The designer delivers one style sheet (type scale, colour tokens, spacing, corner radius, item outline colours) and all ten screens in a single pass, in light mode only, with a generic brand mark and app icon; the brand mark is a stand-in and does not need to be final. The set also covers what the build needs and the ten screens alone do not show: the sign-up screen (email, handle, password); a card with no food found and a card that could not be analysed; a post with a caption and no photo, in the feed and in the profile grid; one line of text explaining why the app asks for location; the typeface name with its open licence, so the results card image can bundle the font; and the app icon exported as PNG at 192 and 512 pixels. These are the screens of a working app, not illustrative mockups. Turn the style sheet into Tailwind theme tokens named by role (surface, text, muted, accent) and a small set of shared components, so later screens use tokens and never raw values. Done when the theme file exists, the five routes from the app shell use it, and changing one colour token changes it everywhere.

### #45 Location and time signals on each post

People eat the same meals in the same few places, so where a post was made is one of the strongest hints for naming and for repeated meals. A photo taken through a web page does not reliably carry it: reports from iOS show camera captures delivered to a web page without GPS metadata, and the media upload item strips location from stored photos anyway. So capture it separately. At the first post, ask for browser location permission once, with one line on why; if granted, read latitude, longitude and accuracy with the Geolocation API at the moment of posting and store them on the post next to the capture time (new migration, nullable columns, same row-level security as the rest of the post). If permission is denied the post works exactly as before and the app does not ask again that session. The interface shows nothing about location yet. Done when a post made with permission carries coordinates and accuracy, a post made without it still posts, and the repeated-meals step can read the coordinates.

### #11 Feed

Home is the user's own posts, newest first, in cards that look and move like a photo feed. Each card: photo or swipeable carousel, caption, time eaten, and an analysis block beneath. A post in queued or processing shows a shimmer in the analysis block and a small "Processing, traffic low" line; when the worker writes `ready`, the card updates in place through Supabase Realtime without a refresh. Pagination by cursor on created\_at. The word "left" and any target never appear. Done when a post placed from the capture screen appears at the top instantly and its analysis fills in without the user touching anything.

### #29 Results card as a carousel slide

Not every post has a photo, and a photo post loses its numbers once the analysis is one line of small type. When the worker sets a post to ready, generate a results card image from the stored items and totals: a clean square card with the item names, portions and totals in the app's type and colours. For a photo post the card is appended as the next slide of the carousel, after the photo or photos. For a caption-only post the card is the post's image, so every post has something to show in the feed and the profile grid. Render the card from data with code (server-side HTML or SVG to PNG), not with an image-generation model: this build is limited to the Meta Model API models SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, and a rendered card cannot misspell a number. Store it as a post\_media row with a kind column (photo or card, added in a new migration), regenerate it when a correction supersedes the items, and keep every rule from the analysis block: consumed wording only, no goal, no rings or percentages. Done when a logged photo shows the photo and then the card as swipeable slides, a caption-only post shows the card as its image, and a correction changes the numbers on the card.

### #13 Post detail with item outlines

Judges need to see where every number came from. The detail view shows the photo full width with each item's SAM mask drawn as a coloured outline; a toggle hides and shows the outlines. Below, the full nutrition table: calories, protein, carbs, fat, fibre, sugar, sodium, then every micronutrient present. Tapping an outline selects the item and opens an edit sheet: rename (with FDC search), change portion, remove, or Add item for something SAM missed (draw a box or just type it). Every user edit writes a new `post_items` row with source user and the old row is kept with a superseded flag, so the model's original is never lost. Done when a judge can tap an outline, change a portion, and watch the totals update while the original estimate remains visible in the thread.

### #14 Comment or correct thread

Corrections are the product's memory and must never overwrite. Under each post is a thread labelled "Comment or correct". The first entry is the model's analysis summary, author model. A user reply in plain language ("that was two eggs not three") is stored as author user, then the worker re-runs naming and nutrition with the thread as context and posts its revised summary as the next model entry, updating `post_items` through the supersede mechanism above. `post_comments` has no update or delete policy. Done when a correction produces a visible model reply within the queue wait and the thread shows both the original and the revision.

### #15 Thumbs feedback

The model needs a cheap signal that an estimate was right, and the user needs a one-tap way to give it. Each analysis block carries a thumbs up and thumbs down; double-tapping the photo is thumbs up, as a heart would be. Thumbs up writes `post_feedback` up and marks the model's thread entry accepted; thumbs down writes down and opens the comment field with focus so the correction follows. One verdict per user per post, replaceable. Done when both gestures write the row and thumbs down lands the cursor in the comment field.

### #16 Mismatch and needs-input strip

When the caption and the photo disagree, or SAM finds no food, the model must ask one question instead of guessing, and the ask must look like a failed upload on a photo app. The naming step returns a `needs_input` flag with a single question ("Caption says curry, this looks like stew. Which is it?"). The post gets status needs\_input and leaves the feed; a strip appears at the top of Home with the thumbnail, the question's short form ("Clarification needed"), and an X to discard the post. Tapping the strip opens the question with the model's two or three options plus free text; the answer is written to the thread as a user comment and the job re-enqueues. A photo with no food at all gets "No food found" and the same strip. Done when a photo of a sock captioned "carrot" produces the strip and answering it produces a post or a discard.

### #17 Repeated meals

People eat the same things over and over, and the numbers must not drift between Tuesday's bowl and Thursday's. Before naming, compare the new photo and caption (text similarity on caption and item names, plus a perceptual hash of the photo; the Meta Model API documents no embeddings endpoint and this build uses only its three models) against the user's own past `ready` posts for a near match; if one scores above the threshold, pass its items and portions to Muse Spark as the prior ("this user logged this as X last time; keep it unless the photo clearly differs"). Where the post was made, from the location item, is a ranking signal: a past post made at the same place ranks higher, with the distance threshold chosen by the coder and recorded in the code. A correction on one post applies to that post only. Done when the same plate photographed twice yields identical items and totals.

### #18 Days

The row at the top of Home is seven day bubbles, today on the right, each showing the day's first photo or a blank ring if nothing was eaten. Tapping a day plays that day's posts full screen in sequence with tap-to-advance and swipe-left/right between days, and the last card shows "Consumed on Tuesday: 1,840 kcal" with the macro line. A sum of what was eaten is a record, not a goal; no comparison to any other day, no average, no target. The Days tab in the bottom bar opens a month grid that scrolls back. Done when a week with three logged days plays as three stories and the bubbles match.

### #19 Search

One field, plain language, no filters. "ramen", "what did I eat Saturday", "last time I had a big breakfast" all work. Implement as Postgres full-text search over caption and item names plus a date parser for day names and relative dates, with a Muse Spark fallback that turns a free-text question into a structured query when the first pass returns nothing. Results are the same cards as the feed. Done when the three example queries return the right posts from a seeded week.

### #20 Profile

A grid of post thumbnails, newest first, three across, tapping opens the detail. Above it the handle and a Sign out button. Nothing else: no weight, no streak, no badge, no count of anything beyond posts. Done when the grid loads the user's posts and nothing on the screen suggests progress toward anything.

### #21 Queue traffic indicator and admin view

Users wait, and they should know roughly why without being shown a number. Compute queue depth when a request asks for it, cached for 60 seconds; map it to low (under 10 jobs), medium (10 to 50), high (over 50) and show it on every processing card as "Processing, traffic medium". A user whose `profiles.role` is admin sees a /admin page with the raw queue depth, oldest waiting job age, jobs per minute, failure count, and the last ten errors. Done when the indicator changes as the test queue is loaded and the admin page shows the matching numbers.

### #22 Push notifications

When the user has left the app, the only way they learn the analysis landed is a push. Register a Web Push subscription on first post (not at sign-up), store it keyed by user, and send "Your meal is ready" with the post thumbnail when the worker sets ready; send the question text when it sets needs\_input. iOS requires the PWA to be installed to the home screen for push, so the subscription prompt appears only when installed. Done when a post placed, then the app backgrounded, produces a notification that opens the post.

### #23 First-run hints

The three things a new user has never seen are the + sheet, the thread label, and the thumbs. On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

### #24 Rate limit and load test

The judges' live run will hit the Meta Model API in a burst, and $150 of credit is irrelevant if the per-minute limit is. Read the limits on Meta's pricing and rate-limits page, write them in docs/load-test.md, then run twenty posts through the queue in two minutes and record wait times and any 429s. If limits bite, the worker's concurrency becomes a setting and the traffic indicator covers the gap. Done when the numbers are in docs/load-test.md and the demo plan picks a concurrency that holds.

### #25 Voice correction

Typing a correction with one hand holding a fork is slow. Add a microphone button to the comment field; record, send the audio to Muse Voice Transcribe 1.0, drop the transcript into the field for the user to confirm before it posts. Later: voice caption on the capture screen through the same path. Done when a spoken correction appears as text in the field within three seconds.

### #26 Demo video and submission

The submission needs a public repo, a video, and a write-up that names what was built during the event. Script: open on the Cal AI timeline ("50 screens and 22 minutes before my first log, 11:45 to 12:07"), cut to sign-in → camera → post in ten seconds, show the SAM outlines on the detail, make a correction and show the thread keeping both versions, show the needs-input strip, close on Days. Write-up states everything was built Oct 26 to Nov 4 on the Meta Model API with SAM 3.1 and Muse Spark 1.3, lists the three Meta model calls, and says what the app does not do. Done when the video is under three minutes and the write-up is in README.md.

## In Flight

Handed to the coder on 2026-10-27 at 13:30 JST as Run 1 of the build plan. An item leaves the backlog when its pull request has merged. Part a of #11 (basic card) is in flight too; the rest of #11 stays in the list above.

### #8 SAM 3.1 segmentation step

Every item on the plate needs an outline so the post detail can show where each estimate came from. Call Meta Model API `sam-3.1` with the post's first image and a text prompt such as "food item" to get masks and boxes for every match; store each mask as a PNG under `media/{user_id}/{post_id}/masks/{n}.png` and the box in `post_items.mask_path` and a boxes column or jsonb. If SAM returns nothing (a photo of a receipt, a sock), record zero items and let the mismatch step handle it. Done when a plate with three distinct items yields three masks that align with the photo in the detail view.

### #9 Item naming and portions

Masks say where food is, not what it is. Send the image, the caption, and each mask's box to Muse Spark 1.3 and ask for, per mask, a name, a portion in plain words and in grams, and a confidence; also ask it to reconcile the caption with the masks (caption "two eggs and toast" with two masks means one mask is probably both eggs). Write one `post_items` row per item with source model. The prompt and its schema live in one file so later sessions can tune it without touching the worker. Done when the three-item test plate comes back with correct names and portions within what a person would accept.

### #10 Nutrition lookup

Names and grams become calories, macros, and micronutrients from USDA FoodData Central, which is public domain and therefore safe under the Participant Guide's rights clause. For each item, search FDC (API key from api.data.gov), pick the best match (Foundation and SR Legacy first, then Branded), scale per 100 g values to `portion_grams`, and write `item_nutrition` with `source_ref` = the FDC id. Cache FDC responses in a table keyed by query so the same food never hits the API twice. Store the full nutrient array in `micronutrients` so vitamins and minerals are available without a schema change. Done when a logged banana shows calories, the four macros, fibre, sugar, sodium, and potassium, each traceable to an FDC id.

### #12 Analysis block on the card

The card must show what was eaten without turning into a dashboard, and a paragraph under a photo is not acceptable. At rest, under the caption, the card shows one quiet line: "Consumed: 612 kcal". Tapping that line expands it in place into one line per item in the form "Grilled chicken breast · 150 g · 248 kcal" followed by the macro line "48 g protein · 31 g carbs · 29 g fat"; tapping again collapses it. Small type, muted, no rings, no bars, no percentages. The expanded block links to the post detail, which holds the full nutrition table. Done when a card at rest shows the photo, the caption and one analysis line, a tap expands the item lines, and nothing on the card implies a goal.

## Blocked

### Facebook Login in production mode

Blocked by Meta app review. Dev mode works for the developer's own and test accounts, which is enough for the demo. Public sign-in with Facebook needs the app submitted for review, which takes longer than the event.

### Dark mode

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

---

† **What this backlog is.** The one shared, ordered list of work for My Food AI. It outlives any single PM session: each session reads it first, edits it in place, and rewrites the "Last edited" line with the full date and time. On request it is copied into the codebase as `BACKLOG.md`. Items are ordered by what moves the project ahead next; the In Flight section sits above Blocked and holds items handed to the coder that have not merged yet, and an item is removed from the backlog once its pull request has merged; the Blocked section holds items that cannot be worked on and says why. Every item has exactly three parts. (1) A GitHub issue number, assigned only when the issue exists in the project's GitHub repository; until then the item is listed without one. (2) A title a person can read. (3) One paragraph that states the problem and carries enough context for a person to solve it unaided: the relevant context, not everything ever collected about the issue. An item without all three parts is not on the backlog.
