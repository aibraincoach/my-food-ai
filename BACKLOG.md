# My Food AI — Backlog†

Last edited: Tuesday 2026-10-27 at 10:33 JST (UTC+09:00) by Claude, PM session 1; synced to repo with issues #28–#29 by Cursor agent 2026-10-26 MDT

## Backlog

Ordered by what moves the product ahead next. Each item carries its GitHub issue number from aibraincoach/my-food-ai (#2–#26, #28–#29; #1 is the docs PR). Issue #27 was closed as non-engineering housekeeping. Blocked items have no issue.

### #2 App shell and navigation

The app needs a frame before any feature can be placed in it. Build a Next.js App Router PWA (manifest, service worker, installable from iPhone Safari, app name "My Food AI") with a five-slot bottom bar in this order: Home, Search, +, Days, Profile. Each slot is a route; + opens the capture screen as a full-screen sheet over whichever tab is current. Layout is mobile-first at 390 px wide with no horizontal scroll; desktop centres the same column. No onboarding, no interstitials, no splash beyond the browser's. Done when all five routes render placeholder content and the PWA installs on a phone.

### #28 Design system from the designer's style sheet

The repository has no design system, and none exists elsewhere for this project, so without one every screen gets styled ad hoc. The visual direction is a mainstream photo-feed app: square photos, quiet type, one-column cards, a bottom bar with a centre +, and nothing that reads as a dashboard. The product, its copy and the repo never name the app it resembles. The designer delivers one style sheet (type scale, colour tokens, spacing, corner radius, item outline colours) and all ten screens in a single pass, in light mode only, with a generic brand mark and app icon; the brand mark is a stand-in and does not need to be final. These are the screens of a working app, not illustrative mockups. Turn the style sheet into Tailwind theme tokens named by role (surface, text, muted, accent) and a small set of shared components, so later screens use tokens and never raw values. Done when the theme file exists, the five routes from the app shell use it, and changing one colour token changes it everywhere.

### #3 Sign in and sign up

The first screen is the brand, a username field, a password field, Sign in, and a Sign up link, matching what the Exemplar shows a signed-out visitor; Continue with Facebook sits beneath, because this is a Meta hackathon and Facebook Login is Meta's own SDK. Use Supabase Auth for email+password and for the Facebook provider (needs a Meta app ID and secret from developers.facebook.com, dev mode is enough for test users). On first successful sign-up create a `profiles` row and land the user on an empty feed with one line, "Post your first meal", and the + highlighted. No profile photo step, no find-friends, no notification prompt. Done when a new user reaches the empty feed in two screens.

### #4 Schema with row-level security

The database is empty after the 2026-10-27 wipe and every table must be created with RLS on in the same statement, default deny. Tables: `profiles` (id = auth user id, handle, role default 'user', created_at); `posts` (id, user_id, caption, eaten_at, visibility default 'private', status enum queued | processing | needs_input | ready | failed, created_at); `post_media` (id, post_id, storage_path, position, width, height); `post_items` (id, post_id, name, portion_text, portion_grams, mask_path, confidence, source enum model | user, created_at); `item_nutrition` (post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg, micronutrients jsonb, source_ref); `post_comments` (id, post_id, author enum user | model, body, created_at) with insert and select policies only, no update or delete, so corrections are never overwritten; `post_feedback` (post_id, user_id, verdict enum up | down, created_at); `jobs` (id, post_id, kind, priority smallint default 100, status, attempts, created_at, started_at, finished_at, error) with no client policies at all, reached only from server code with the secret key. Client policies grant `auth.uid() = user_id` (through post_id for child tables). Private storage bucket `media` with policies limiting each user to `media/{auth.uid()}/`. Write it as one migration under `supabase/migrations`, show the SQL before applying, apply with psql against `$SUPABASE_DB_URL`. Done when every table in `public` shows `rowsecurity = true` and a second test user cannot read the first user's rows.

### #5 Media upload

A photo taken on the capture screen must reach storage before the post is created, and it must be served fast on the feed. Upload originals to `media/{user_id}/{post_id}/{position}.jpg` with a signed upload from the client; store width and height in `post_media`. Serve through Supabase image transforms (or Vercel image optimisation) at feed width so the feed never loads an original. Strip EXIF location. Done when a 12 MP phone photo uploads, appears in the feed under 300 KB, and the original is readable only by its owner.

### #6 Capture screen

This is the + sheet and the ten-second path from sign-in to first post. Open the rear camera with the browser capture API (file input with `capture="environment"` is the reliable path on iOS Safari); show a shutter, a thumbnail strip of shots taken so far (several shots make a carousel), a caption field with placeholder "What did you eat?", and Post. Caption alone with no photo is a valid post. Post creates the `posts` row with status queued, uploads media, enqueues a job, closes the sheet, and returns to the feed where the new post is already at the top. Done when a timed run from the sign-in screen to a post in the feed is under 15 seconds on a phone.

### #7 Job queue and worker

Analysis is not instantaneous and free users wait longest; this has to be in the scaffolding, not bolted on later. The `jobs` table is the queue: a Vercel cron or a route handler drains it, taking the lowest `priority` number first, then oldest, marking `started_at`, running the pipeline, and writing `finished_at` or `error` with `attempts` incremented; a job past three attempts sets the post to failed. Free users enqueue at priority 100; the schema allows lower numbers for later tiers but nothing in this version assigns them. The worker uses the Supabase secret key and never runs in the browser. Done when ten posts queued at once drain in order and a deliberately failing job lands in failed after three tries.

### #8 SAM 3.1 segmentation step

Every item on the plate needs an outline so the post detail can show where each estimate came from. Call Meta Model API `sam-3.1` with the post's first image and a text prompt such as "food item" to get masks and boxes for every match; store each mask as a PNG under `media/{user_id}/{post_id}/masks/{n}.png` and the box in `post_items.mask_path` and a boxes column or jsonb. If SAM returns nothing (a photo of a receipt, a sock), record zero items and let the mismatch step handle it. Done when a plate with three distinct items yields three masks that align with the photo in the detail view.

### #9 Item naming and portions

Masks say where food is, not what it is. Send the image, the caption, and each mask's box to Muse Spark 1.3 and ask for, per mask, a name, a portion in plain words and in grams, and a confidence; also ask it to reconcile the caption with the masks (caption "two eggs and toast" with two masks means one mask is probably both eggs). Write one `post_items` row per item with source model. The prompt and its schema live in one file so later sessions can tune it without touching the worker. Done when the three-item test plate comes back with correct names and portions within what a person would accept.

### #10 Nutrition lookup

Names and grams become calories, macros, and micronutrients from USDA FoodData Central, which is public domain and therefore safe under the Participant Guide's rights clause. For each item, search FDC (API key from api.data.gov), pick the best match (Foundation and SR Legacy first, then Branded), scale per 100 g values to `portion_grams`, and write `item_nutrition` with `source_ref` = the FDC id. Cache FDC responses in a table keyed by query so the same food never hits the API twice. Store the full nutrient array in `micronutrients` so vitamins and minerals are available without a schema change. Done when a logged banana shows calories, the four macros, fibre, sugar, sodium, and potassium, each traceable to an FDC id.

### #11 Feed

Home is the user's own posts, newest first, in cards that look and move like a photo feed. Each card: photo or swipeable carousel, caption, time eaten, and an analysis block beneath. A post in queued or processing shows a shimmer in the analysis block and a small "Processing, traffic low" line; when the worker writes `ready`, the card updates in place through Supabase Realtime without a refresh. Pagination by cursor on created_at. The word "left" and any target never appear. Done when a post placed from the capture screen appears at the top instantly and its analysis fills in without the user touching anything.

### #12 Analysis block on the card

The card must show what was eaten without turning into a dashboard, and a paragraph under a photo is not acceptable. At rest, under the caption, the card shows one quiet line: "Consumed: 612 kcal". Tapping that line expands it in place into one line per item in the form "Grilled chicken breast · 150 g · 248 kcal" followed by the macro line "48 g protein · 31 g carbs · 29 g fat"; tapping again collapses it. Small type, muted, no rings, no bars, no percentages. The expanded block links to the post detail, which holds the full nutrition table. Done when a card at rest shows the photo, the caption and one analysis line, a tap expands the item lines, and nothing on the card implies a goal.

### #29 Results card as a carousel slide

Not every post has a photo, and a photo post loses its numbers once the analysis is one line of small type. When the worker sets a post to ready, generate a results card image from the stored items and totals: a clean square card with the item names, portions and totals in the app's type and colours. For a photo post the card is appended as the next slide of the carousel, after the photo or photos. For a caption-only post the card is the post's image, so every post has something to show in the feed and the profile grid. Render the card from data with code (server-side HTML or SVG to PNG), not with an image-generation model: this build is limited to the Meta Model API models SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, and a rendered card cannot misspell a number. Store it as a post_media row with a kind column (photo or card, added in a new migration), regenerate it when a correction supersedes the items, and keep every rule from the analysis block: consumed wording only, no goal, no rings or percentages. Done when a logged photo shows the photo and then the card as swipeable slides, a caption-only post shows the card as its image, and a correction changes the numbers on the card.

### #13 Post detail with item outlines

Judges need to see where every number came from. The detail view shows the photo full width with each item's SAM mask drawn as a coloured outline; a toggle hides and shows the outlines. Below, the full nutrition table: calories, protein, carbs, fat, fibre, sugar, sodium, then every micronutrient present. Tapping an outline selects the item and opens an edit sheet: rename (with FDC search), change portion, remove, or Add item for something SAM missed (draw a box or just type it). Every user edit writes a new `post_items` row with source user and the old row is kept with a superseded flag, so the model's original is never lost. Done when a judge can tap an outline, change a portion, and watch the totals update while the original estimate remains visible in the thread.

### #14 Comment or correct thread

Corrections are the product's memory and must never overwrite. Under each post is a thread labelled "Comment or correct". The first entry is the model's analysis summary, author model. A user reply in plain language ("that was two eggs not three") is stored as author user, then the worker re-runs naming and nutrition with the thread as context and posts its revised summary as the next model entry, updating `post_items` through the supersede mechanism above. `post_comments` has no update or delete policy. Done when a correction produces a visible model reply within the queue wait and the thread shows both the original and the revision.

### #15 Thumbs feedback

The model needs a cheap signal that an estimate was right, and the user needs a one-tap way to give it. Each analysis block carries a thumbs up and thumbs down; double-tapping the photo is thumbs up, as a heart would be. Thumbs up writes `post_feedback` up and marks the model's thread entry accepted; thumbs down writes down and opens the comment field with focus so the correction follows. One verdict per user per post, replaceable. Done when both gestures write the row and thumbs down lands the cursor in the comment field.

### #16 Mismatch and needs-input strip

When the caption and the photo disagree, or SAM finds no food, the model must ask one question instead of guessing, and the ask must look like a failed upload on a photo app. The naming step returns a `needs_input` flag with a single question ("Caption says curry, this looks like stew. Which is it?"). The post gets status needs_input and leaves the feed; a strip appears at the top of Home with the thumbnail, the question's short form ("Clarification needed"), and an X to discard the post. Tapping the strip opens the question with the model's two or three options plus free text; the answer is written to the thread as a user comment and the job re-enqueues. A photo with no food at all gets "No food found" and the same strip. Done when a photo of a sock captioned "carrot" produces the strip and answering it produces a post or a discard.

### #17 Repeated meals

People eat the same things over and over, and the numbers must not drift between Tuesday's bowl and Thursday's. Before naming, embed the new photo and caption and search the user's own past `ready` posts for a near match; if one scores above the threshold, pass its items and portions to Muse Spark as the prior ("this user logged this as X last time; keep it unless the photo clearly differs"). A correction on one post applies to that post only. Done when the same plate photographed twice yields identical items and totals.

### #18 Days

The row at the top of Home is seven day bubbles, today on the right, each showing the day's first photo or a blank ring if nothing was eaten. Tapping a day plays that day's posts full screen in sequence with tap-to-advance and swipe-left/right between days, and the last card shows "Consumed on Tuesday: 1,840 kcal" with the macro line. A sum of what was eaten is a record, not a goal; no comparison to any other day, no average, no target. The Days tab in the bottom bar opens a month grid that scrolls back. Done when a week with three logged days plays as three stories and the bubbles match.

### #19 Search

One field, plain language, no filters. "ramen", "what did I eat Saturday", "last time I had a big breakfast" all work. Implement as Postgres full-text search over caption and item names plus a date parser for day names and relative dates, with a Muse Spark fallback that turns a free-text question into a structured query when the first pass returns nothing. Results are the same cards as the feed. Done when the three example queries return the right posts from a seeded week.

### #20 Profile

A grid of post thumbnails, newest first, three across, tapping opens the detail. Above it the handle and a Sign out button. Nothing else: no weight, no streak, no badge, no count of anything beyond posts. Done when the grid loads the user's posts and nothing on the screen suggests progress toward anything.

### #21 Queue traffic indicator and admin view

Free users wait, and they should know roughly why without being shown a number. Compute queue depth every minute; map it to low (under 10 jobs), medium (10 to 50), high (over 50) and show it on every processing card as "Processing, traffic medium". A user whose `profiles.role` is admin sees a /admin page with the raw queue depth, oldest waiting job age, jobs per minute, failure count, and the last ten errors. Done when the indicator changes as the test queue is loaded and the admin page shows the matching numbers.

### #22 Push notifications

When the user has left the app, the only way they learn the analysis landed is a push. Register a Web Push subscription on first post (not at sign-up), store it keyed by user, and send "Your meal is ready" with the post thumbnail when the worker sets ready; send the question text when it sets needs_input. iOS requires the PWA to be installed to the home screen for push, so the subscription prompt appears only when installed. Done when a post placed, then the app backgrounded, produces a notification that opens the post.

### #23 First-run hints

The three things a new user has never seen are the + sheet, the thread label, and the thumbs. On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

### #24 Rate limit and load test

The judges' live run will hit the Meta Model API in a burst, and $150 of credit is irrelevant if the per-minute limit is. Read the limits on Meta's pricing and rate-limits page, write them in CLAUDE.md, then run twenty posts through the queue in two minutes and record wait times and any 429s. If limits bite, the worker's concurrency becomes a setting and the traffic indicator covers the gap. Done when the numbers are in docs/load-test.md and the demo plan picks a concurrency that holds.

### #25 Voice correction

Typing a correction with one hand holding a fork is slow. Add a microphone button to the comment field; record, send the audio to Muse Voice Transcribe 1.0, drop the transcript into the field for the user to confirm before it posts. Later: voice caption on the capture screen through the same path. Done when a spoken correction appears as text in the field within three seconds.

### #26 Demo video and submission

The submission needs a public repo, a video, and a write-up that names what was built during the event. Script: open on the Cal AI timeline ("50 screens and 22 minutes before my first log, 11:45 to 12:07"), cut to sign-in → camera → post in ten seconds, show the SAM outlines on the detail, make a correction and show the thread keeping both versions, show the needs-input strip, close on Days. Write-up states everything was built Oct 26 to Nov 4 on the Meta Model API with SAM 3.1 and Muse Spark 1.3, lists the three Meta model calls, and says what the app does not do. Done when the video is under three minutes and the write-up is in README.md.

## Blocked

### Sign in with ChatGPT and Google

Blocked until after the hackathon. The post-event product lets people bring their own inference and sign in with ChatGPT or Google. Out of scope for the Meta submission by design: the hackathon build stays on Meta's auth and Meta's models.

### Social feed and sharing

Blocked by scope. The `visibility` column and per-user keys exist so following and public posts can be added without a migration, but no sharing ships in the hackathon slice, and no one else's food ever appears in a user's feed until they follow someone.

### Paid tiers and faster queue

Blocked by the free-first decision. The `jobs.priority` column supports it; nothing in the UI or copy mentions paying, and no tier other than free is assigned.

### Facebook Login in production mode

Blocked by Meta app review. Dev mode works for the developer's own and test accounts, which is enough for the demo. Public sign-in with Facebook needs the app submitted for review, which takes longer than the event.

### Dark mode

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

---

† **What this backlog is.** The one shared, ordered list of work for My Food AI (hackathon name; becomes My Fitness AI after the event). It outlives any single PM session: each session reads it first, edits it in place, and rewrites the "Last edited" line with the full date and time. On request it is copied into the codebase as `BACKLOG.md`. Items are ordered by what moves the project ahead next; the Blocked section holds items that cannot be worked on and says why. Every item has exactly three parts. (1) A GitHub issue number, assigned only when the issue exists in the project's GitHub repository; until then the item is listed without one. (2) A title a person can read. (3) One paragraph that states the problem and carries enough context for a person to solve it unaided: the relevant context, not everything ever collected about the issue. An item without all three parts is not on the backlog.
