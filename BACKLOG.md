# My Food AI — Backlog†

Last edited: Thursday 2026-10-29 at 08:22 JST (UTC+09:00) by Claude, successor PM

## Backlog

Ordered by what moves the product ahead next. Each item carries its GitHub issue number from aibraincoach/my-food-ai; an item stays here until its issue is closed by a merged pull request. Items requested but not yet filed are listed without a number. Items that cannot be worked on sit under Blocked.

### #106 Log from the camera roll and set the time a meal was eaten

People remember a coffee hours later or log a photo taken earlier, and capture today accepts only the camera and stamps the time of posting. Add "Choose from library" to the capture sheet for one or several photos, and a "When" row set to Now that opens a time picker; a caption-only post such as "coffee" can be given a past time. Eaten-at defaults to the photo's capture time when the browser provides it, and post detail gets an edit-time control. The feed, Days and Search order by eaten-at. Done when a post logged now with a time of 8:30 this morning appears at 8:30 on today's bubble.

### #107 Every card has a visible way to open post detail

A new user has to guess that tapping the text opens detail. Add a "Details ›" control on every card, and make the photo and the analysis block tappable too. Done when a new user opens detail without being told how.

### #108 The app fits an iPhone screen when installed to the home screen

The installed app does not respect the status bar, the notch and the home indicator: the clock collides with content and the bottom bar is clipped. Set viewport-fit=cover and pad the header, the bottom bar and every sheet with env(safe-area-inset-\*). Done when nothing overlaps the clock or the home indicator at 390x844 and 430x932.

### #109 Today's day bubble shows a marker when a post exists today

The bubble for today looks the same as empty days although a post exists. Find why and fix it. Done when a day with a post shows the marker and a day without one does not.

### #137 A real photo post never fails with "photo not found"

One production post failed with "photo download failed: Object not found" 1.3 seconds after posting, which suggests the job can run before the upload is readable. Make the worker treat a missing object within a minute of post creation as retryable, and fix the ordering if the post is enqueued first. Done when three posts made through the capture sheet's exact upload sequence on production all reach ready.

### #139 A held worker lease renews for its full time

Renewing a held lease does not extend it; a 300-second time-to-live against 60 seconds of work hides it today. Fix the renewal and add a test. Done when a lease held past its first term is still held and a test proves it.

### Production evaluation of ten real meal photos

The eval script exists but has not run against production, so no result is committed. Run it as the test account, commit the table to docs/eval.md and link it from the README. Done when the table shows for every photo which items were found, missed or invented.

### Page looks for every screen against the designer's frames

No screen has been compared with the frames, and the intake control and the barcode scanner have no frame. Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### Servings and unit-aware amounts on a meal

Cal AI lets the user edit a servings count and amounts; ours edits grams per item only. Add a servings control on post detail that scales every item and the totals, and per-item amounts in g, oz, piece or cup; edits append to the thread. Done when 2 servings doubles the totals and 80 g recomputes an item's nutrition from FDC per 100 g.

### Food search without the model

Typing a food should offer database matches before any model call. Add "Search foods" to the + sheet running an FDC text search with per-serving calories; picking a result creates a ready post with a servings control and no model call, and "Describe it instead" falls back to the model. Done when searching "croissant" and picking one logs a ready post in under three seconds.

### Saved meals and Log again

Habits repeat. Add a bookmark on post detail that saves a meal, a list of saved meals in the + sheet, and "Log again" in the post menu to copy a meal to a chosen time. Done when a saved coffee logs in two taps at Now and at an earlier time through the picker.

### Add a photo to an existing post

A meal sometimes needs a second photo after posting. Add "Add photo" to the post menu; the photo joins the carousel and triggers a re-estimate as a thread reply. Done when a second photo appears in the carousel and the thread shows a revised summary.

### Delete a post

Add "Delete" to the post menu with a confirmation that removes the post and its media. Done when a deleted post is gone from the feed, Days, Search and storage.

### Days shows days that hold only water or caffeine

A day with only intake entries has no story or marker. Done when such a day appears on Days with a marker.

### Desktop browser layout

The app is a phone column. At 1024 px and wider, use a centred feed column, replace the bottom bar with a side or top navigation, open post detail beside the feed, support keyboard navigation, and capture by webcam or file upload. Done when the feed, detail, capture, Days, Search and Profile are usable with a mouse and keyboard at 1280x800 and 1920x1080 with no horizontal scroll.

### Agent surface: an MCP server and documented HTTP API

Agents should be able to log and read meals. Add a streamable-HTTP MCP at /mcp with log\_meal, list\_meals, get\_meal and correct\_meal, authenticated by a per-user revocable token created from a "Connect an agent" row on Profile and rate-limited. Records only, past tense, no targets, no weight or exercise tools. Done when an MCP client logs a caption-only "coffee" with a past eaten-at and reads it back, a second user's token cannot read it, a revoked token is refused, and docs/agents.md documents setup.

### #2 Shell screen matches the designer's frame and installs as a PWA

The frame, the bottom bar and the five routes are merged and live, but the bar and the three placeholder tabs (Search, Days, Profile) render unstyled and the app cannot be installed. Restyle the bar and the three placeholder tabs from the designer's frame using the theme tokens and shared components, and add the PWA remainder: a manifest named "My Food AI" with the designer's icons, a service worker that caches the shell and serves navigations network-first, and the meta tags iPhone Safari needs to install it. No onboarding, no interstitials, no splash beyond the browser's. Done when the bar and the placeholder tabs match the frame at 390 px wide in light mode and the PWA installs on a phone.

### #28 Sign-in and sign-up screens match the designer's frames

The live sign-in page and the sign-up page render unstyled. Restyle both from the designer's frames using the theme tokens and shared components: the brand mark, the email, handle and password fields, the primary button, the line that switches between the two screens, and the Facebook button only under the existing flag. Done when both pages match the frames at 390 px wide in light mode, built from tokens and shared components, and signing in and signing up still work.

### #28 Home screen matches the designer's frames

Home renders unstyled. Restyle it from the frames using the theme tokens and shared components: the title bar, the seven day bubbles as an empty row drawn from today's date, the card at rest, the expanded analysis block, the shimmer with its traffic line, the no-food card, the could-not-be-analysed card, the caption-only card drawn with the results card component, and the empty state with the one-time tooltip over the +. The analysis block from #12 is on main, and this item restyles it to the frame. Done when every state matches the frames at 390 px wide in light mode from tokens and shared components, and a new post still fills in without a refresh.

### #28 Capture screen matches the designer's frame

The capture sheet renders unstyled. Restyle it from the frame using the theme tokens and shared components: the dark sheet, the top bar, the camera area, the shutter and gallery buttons, the thumbnail strip, the caption field, the location line as static copy, and the Post button. After a successful post the sheet sends a post-created event before it closes, which later items listen for. Done when the sheet matches the frame at 390 px wide and a post still completes.

### #29 Rendered results-card image added to each post's carousel

Not every post has a photo, and a photo post loses its numbers once the analysis is one line of small type. When the worker sets a post to ready, generate a results card image from the stored items and totals: a clean square card with the item names, portions and totals in the app's type and colours. For a photo post the card is appended as the next slide of the carousel, after the photo or photos. For a caption-only post the card is the post's image, so every post has something to show in the feed and the profile grid. Render the card from data with code (server-side HTML or SVG to PNG), not with an image-generation model: this build is limited to the Meta Model API models SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, and a rendered card cannot misspell a number. Store it as a post\_media row with a kind column (photo or card, added in a new migration), regenerate it when a correction supersedes the items, and keep every rule from the analysis block: consumed wording only, no goal, no rings or percentages. Done when a logged photo shows the photo and then the card as swipeable slides, a caption-only post shows the card as its image, and a correction changes the numbers on the card.

### #13 Post detail with SAM outlines, full nutrition table and item editing

Judges need to see where every number came from. The detail view shows the photo full width with each item's SAM mask drawn as a coloured outline; a toggle hides and shows the outlines. Below, the full nutrition table: calories, protein, carbs, fat, fibre, sugar, sodium, then every micronutrient present. Tapping an outline selects the item and opens an edit sheet: rename (with FDC search), change portion, remove, or Add item for something SAM missed (draw a box or just type it). Every user edit writes a new `post_items` row with source user and the old row is kept with a superseded flag, so the model's original is never lost. Done when a judge can tap an outline, change a portion, and watch the totals update while the original estimate remains visible in the thread.

### #14 Comment-or-correct thread that re-runs the analysis and keeps every version

Corrections are the product's memory and must never overwrite. Under each post is a thread labelled "Comment or correct". The first entry is the model's analysis summary, author model. A user reply in plain language ("that was two eggs not three") is stored as author user, then the worker re-runs naming and nutrition with the thread as context and posts its revised summary as the next model entry, updating `post_items` through the supersede mechanism above. `post_comments` has no update or delete policy. Done when a correction produces a visible model reply within the queue wait and the thread shows both the original and the revision.

### #15 Thumbs up and down on each analysis, double-tap as thumbs up

The model needs a cheap signal that an estimate was right, and the user needs a one-tap way to give it. Each analysis block carries a thumbs up and thumbs down; double-tapping the photo is thumbs up, as a heart would be. Thumbs up writes `post_feedback` up and marks the model's thread entry accepted; thumbs down writes down and opens the comment field with focus so the correction follows. One verdict per user per post, replaceable. Done when both gestures write the row and thumbs down lands the cursor in the comment field.

### #18 Days stories row and month grid of past posts

The row at the top of Home is seven day bubbles, today on the right, each showing the day's first photo or a blank ring if nothing was eaten. Tapping a day plays that day's posts full screen in sequence with tap-to-advance and swipe-left/right between days, and the last card shows "Consumed on Tuesday: 1,840 kcal" with the macro line. A sum of what was eaten is a record, not a goal; no comparison to any other day, no average, no target. The Days tab in the bottom bar opens a month grid that scrolls back. Done when a week with three logged days plays as three stories and the bubbles match.

### #20 Profile grid of the user's post thumbnails with sign out

A grid of post thumbnails, newest first, three across, tapping opens the detail. Above it the handle and a Sign out button. Nothing else: no weight, no streak, no badge, no count of anything beyond posts. Done when the grid loads the user's posts and nothing on the screen suggests progress toward anything.

### #22 Web Push when an analysis is ready or a question is waiting

When the user has left the app, the only way they learn the analysis landed is a push. Register a Web Push subscription on first post (not at sign-up), store it keyed by user, and send "Your meal is ready" with the post thumbnail when the worker sets ready; send the question text when it sets needs\_input. iOS requires the PWA to be installed to the home screen for push, so the subscription prompt appears only when installed. Done when a post placed, then the app backgrounded, produces a notification that opens the post.

### #23 One-time hint tooltips for the + sheet, the thread and the thumbs

The three things a new user has never seen are the + sheet, the thread label, and the thumbs. On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

### #24 Meta API rate-limit check and twenty-post load test

The judges' live run will hit the Meta Model API in a burst, and $150 of credit is irrelevant if the per-minute limit is. Read the limits on Meta's pricing and rate-limits page, write them in docs/load-test.md, then run twenty posts through the queue in two minutes and record wait times and any 429s. If limits bite, the worker's concurrency becomes a setting and the traffic indicator covers the gap. Done when the numbers are in docs/load-test.md and the demo plan picks a concurrency that holds.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository. The coder's read-only assessment of main on 2026-10-28 found no committed secret, and the owner ruled that nothing is removed or scrubbed during the build. After the last feature merges, one pass replaces the default README with a short start-here page and the owner records which working files (the agents' contracts, the Wall of Stupid file, the review policy and the review tools) stay on main. Done when the README is the start-here page, the owner has recorded which files stay, and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #65 The pipeline's tests run against an offline fake Meta Model API

Meta's workshop repository ships a scripted offline model for its tests: a real OpenAI client whose requests never leave the machine and are answered from recorded outputs, including recorded SAM outputs, and which can be told to refuse a request with a 400. Our tests are static text checks, and nothing exercises the analysis pipeline without a live key and live credit. Add a fake of the Meta Model API behind the same client, selected by a base-URL variable (MODEL\_API\_BASE\_URL, which the workshop's client also reads), that answers the SAM, Spark identify, Spark correct and transcribe calls from recorded fixtures and can be told to return a 400, a 429 or a 503. Done when the path from a posted meal to ready, a correction, a 400 failing a job at once and a 429 retrying all run in the test suite with no network and no key.

### #66 The Meta Model API client sets its retries and timeout explicitly

Meta's workshop client sets four retries and a 180-second timeout on the OpenAI SDK client, and the SDK waits as long as the API asks on a 429 or a 503, so a brief rate limit costs no job attempt. Set the retry count and the timeout on our client explicitly, in one file, within the serverless function's time limit, so the worker's own retry delay only handles failures that outlast the SDK's. Done when the settings sit in one file and a test through the fake API shows a 429 that carries a wait is retried inside one job attempt.

### #67 Each post keeps a trace of its model calls, readable on the admin page

Meta's workshop ships an Agent Console that shows every turn: what the model was asked, what it returned, the tokens used and which checks passed. A judge looking at ours sees only the end result. Record, in a new table that only admins can read, one row per call a post made (SAM, Spark identify, Spark correct, FDC lookup, transcribe) with the time, the duration, the tokens, the request text without the image, the returned text, and the FDC id where one matched. Show a post's trace on the admin page and never in the user's app. Done when a post made on production has a trace listing each call it made, and a non-admin cannot read the table.

### #26 Demo video under three minutes and the submission write-up

The submission needs a public repo, a video, and a write-up that names what was built during the event. Script: open on the Cal AI timeline ("50 screens and 22 minutes before my first log, 11:45 to 12:07"), cut to sign-in → camera → post in ten seconds, show the SAM outlines on the detail, make a correction and show the thread keeping both versions, show the needs-input strip, close on Days. Write-up states everything was built Oct 26 to Nov 4 on the Meta Model API with SAM 3.1 and Muse Spark 1.3, lists the three Meta model calls, and says what the app does not do. Done when the video is under three minutes and the write-up is in README.md.

## Blocked

### #114 Facebook Login in production mode

Blocked by Meta app review. Dev mode works for the developer's own and test accounts, which is enough for the demo. Public sign-in with Facebook needs the app submitted for review, which takes longer than the event.

### #115 Dark mode

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

---

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is generated from the same open issues, so the coder and the planner read the same list. An item stays until its issue is closed by a merged pull request; the Blocked section holds items that cannot be worked on and says why. Every item has exactly three parts. (1) A GitHub issue number, assigned only when the issue exists; until then the item is listed without one. (2) A title a person can read. (3) One paragraph that states the problem and carries enough context for a person to solve it unaided, ending in a done condition. An item without all three parts is not on the backlog.
