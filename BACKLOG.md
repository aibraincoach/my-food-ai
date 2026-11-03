# My Food AI — Backlog†

Last edited: Tuesday 2026-11-03 at 10:42 WIB (UTC+07:00) by Claude, PM

## Backlog for Owner

### #212 Barcode and nutrition-label scanning is untested on a phone

Nobody has tried logging a packaged food from its barcode or nutrition label on a phone with a real pack. Every check so far ran in emulation.

The capture sheet swipes between Photo, Barcode and Text (PR #298). A barcode photographed in Photo mode is also read: the app decodes the barcode from the image first and looks up the digits, and uses the model only when it finds no barcode and for labels. Photograph a real pack's barcode through the capture sheet; the card should show the product's name, its nutrition and the pack photo. Then photograph a nutrition label; it should give the same kind of card. Done when both give a correct card on the owner's phone.

### #285 Test the half-eaten plate again on a phone

The app works out how much was eaten from a leftovers photo. Nobody has confirmed on a phone that the consumed number is right.

Photograph a meal before and after eating it, then check the consumed number. If it is wrong, report it to the coder. The video includes the not-eaten plate, so this has to work first. Done when a fresh before-and-after test gives the right consumed number. If it does not, the plate stays out of the video.

### #318 Read the README before recording

Judges read the README first, and the owner has not read it yet.

The README (#287) is written in Run 7. Read it after it merges. Done when the README is read and everything wrong in it is listed.

### #26 The demo video and the submission do not exist yet

Nothing is submitted until the video is recorded and the submission is in. The deadline is Nov 4 at 9 PM EST (Nov 5 at 09:00 WIB).

The submission needs the public repository, the video link and a list of everyone who worked on it. Judges stop watching at three minutes. Every feature built is in the video, the not-eaten plate included. Post the video to X as soon as it exists: the Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. Whether the post must exist before the submission deadline is unconfirmed. No merges or deploys run from the start of recording until the submission is in. Done when a video under three minutes is on X and the submission is in.

## Backlog for Designer

### #289 Frames for logging a drink by photo, by tap or by caption

The card for a drink does not show a can of cola's caffeine, and logging a drink does not feel smooth.

The cola can counts as caffeine but its card shows none. No one is pushed down one flow: a photo of a coffee, a photo of a glass of water, a tap on the drink sheet and a caption must each work. A photo of water is estimated and added to hydration. A photo of a caffeine-forward drink is estimated, added and shows its caffeine on the card. One photo can hold several drinks, such as five lined up before a workout, and the card must show every drink and its caffeine. High Coffee is the reference for logging caffeine smoothly and WaterMinder for logging liquids. Records only, past tense, no targets, no ring or percentage. Done when frames at 390x844 are delivered for the drink card with its caffeine, a photo of water, a photo of a can, a photo with several drinks, a quick tap and the drink sheet.

### #290 Frames for the capture sheet's modes with Barcode as an obvious choice

People cannot tell that the app scans barcodes, because the Barcode choice is easy to miss.

Keep a Barcode toggle, and reach the modes by swiping with Barcode an obvious option. That advertises the feature without forcing anyone down it. A photo is still a photo (#212). Done when frames at 390x844 are delivered for the capture sheet showing the swipe between modes, Barcode selected, and a first-time hint.

### #291 Frames for removing and redoing

A user cannot take back something added to a post, and nothing shows how to remove a post.

People need to delete an item and its result so they can redo it. The small cases are a leftovers photo or a correction added by mistake. The large case is a whole post. #174 adds Delete to the post menu. Done when frames at 390x844 are delivered for deleting a post with its confirmation, removing a leftovers photo or a correction from a post, and the post after either.

### #108 The installed app overlaps the iPhone clock and home indicator

Installed to an iPhone home screen, the clock overlaps content and the bottom bar is clipped.

The installed app does not respect the status bar, the notch or the home indicator. The designer draws the header, the bottom bar and every sheet inside the safe areas, so that nothing overlaps the clock or the home indicator. Engineering then builds it with viewport-fit=cover and env(safe-area-inset-\*) padding. Done when frames at 390x844 and 430x932 show the header, the bottom bar and every sheet inside the safe areas.

## Engineering backlog

### The production database is over its free egress and log quota

The Supabase free plan shows egress at 8.66 of 5 GB and log ingestion at 1.10 of 1 GB, the grace period is over, and the project is depleting its Disk IO budget. Supabase restricts a project that exceeds its quota after the grace period, so the app can stop answering requests while judges use it.

Usage already spent stays counted until the billing cycle resets (Supabase billing FAQ), so cutting reads only stops further growth. Suspected sources, none measured: one feed opening fires 120 to 160 requests and the day-totals refresh re-reads every loaded day (#222); the tick route wakes the database on every app open, tab focus and once a minute (#322); the Days reader runs two queries per post plus a signed address per photo (#327); feed images carry no Cache-Control header, so every revisit downloads them again (#305). Load tests against production count toward the same quota. The Infrastructure page shows 31 of 60 connections and 70% RAM on the Micro instance; find what holds them. Find what drives egress and log ingestion, and cut it. Done when the usage page shows which requests dominate egress and log ingestion, and the egress of one feed opening is measured before and after the cuts and is in docs.

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears. When it opens, photos and cards take a long time to show, so the app feels broken and slow.

In 100 openings on the largest test account (146 posts), 3 showed a server error (digest 3642131196) and 15 showed no feed after 45 seconds. A cold start takes about a minute. Causes found in the code: one opening fires 120 to 160 concurrent requests; the day-totals refresh re-reads every loaded day, so its cost grows with the feed; the server render of Home's last-five-days totals throws the digest errors; the blank openings are client requests that never settle. The per-day read from #296 and the service worker are cleared as causes. The cold-open causes in #322, #323, #324 and #326 are part of this item. The runtime logs return 403 for the coder, so the stack for the digest exists only in the Vercel console. Done when the feed opens every time in 100 controlled openings on the largest test account, the first photo shows within two seconds on a phone over mobile data, the feed shows something within two seconds of opening the app, and the sizes and times before and after are in docs.

### #304 The app opens on the last feed it showed and updates behind it

Opening the app shows a blank screen until the server answers. The owner sees ten seconds with nothing on it.

The service worker (public/sw.js) loads each page from the network first. It never shows the last signed-in feed while it waits, and it falls back to a cached anonymous page only when the request fails outright. Show the last feed the phone received at once, then replace it with fresh posts when they arrive. Nothing the user taps waits for the refresh. Done when opening the installed app on a throttled connection shows the last feed within two seconds and the new posts appear behind it without the page jumping.

### #305 The first card's photo loads first and the photos below it wait

On a slow connection the first card's photo arrives late, and nobody has shown whether the photos below it are the reason.

The sampled feed image is 152,193 bytes and its response carries no Cache-Control header (docs/media-loading.md), so several cards cost megabytes on mobile data and a revisit downloads them again. Load the first card's photo with priority, load the others as the user scrolls toward them, and let the phone keep photos between visits. Whether the feed already loads lazily is not known, so observe first. Done when the first photo of the feed shows within two seconds on mobile data, the photos below it do not delay it, and a second visit loads the same photos from the phone.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

Use Muse Spark Open (meta-models/muse-spark-open-1026) through Baseten's OpenAI-compatible endpoint, https://inference.baseten.co/v1, for the identify-and-portions call. The key works only with that model and never goes in the repository, an issue or this backlog. Confirm the coder can sign in to Baseten with the key before the trial. The model always reasons, so check output caps that include reasoning. The Meta client hardcodes model names, and the ten-photo harness cannot choose a model host. Trial first in a throwaway clone that swaps only that call, and spend at most 5 US dollars. SAM and transcription stay on the Meta API, and the USDA lookup is unchanged. Compare the ten meal photos and one caption, "I ate half the rice", against the current path. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and the owner has seen it work on production.

### #316 The Facebook button is shown grayed out and does nothing

A judge who taps the Facebook button on the sign-in page would see an error, because the Facebook app is in Development mode.

Meta's app review takes longer than the event, so Facebook sign-in cannot go live (#114). Show the Facebook button on the sign-in and sign-up pages, grayed out, and do nothing when it is tapped. Done when the Facebook button on the sign-in and sign-up pages is grayed out, tapping it does nothing, and no error shows.

### #306 Every tap that saves shows its result at once

Some taps that save something look dead until the server answers, so the app feels slow.

The thumbs (#215) are one case. The bookmark, Save meal, Log again and Edit caption (#223) may also wait for the server; observe which do. Each should show its new state at the tap, settle when the save lands, and show an error and revert if it fails. #217 measures every control; this item fixes the ones that wait. Done when each of those taps changes the screen before the server answers on a throttled connection, the saved state survives a reload, and a failed save is shown.

### #307 A card shows the foods the app has found while the numbers are still being worked out

A new post shows a shimmer for most of its wait, though the app knows what the foods are long before it knows their nutrition.

Identification finishes in 3.3 to 8.1 seconds while the active worker time of the whole job is 16.5 to 25.2 seconds (docs/production-performance.md), so for most of the wait the foods are known and only their nutrition is missing. Show the food names as soon as identification finishes, fill in each food's nutrition as it lands, and keep the total unavailable until all of it is in. Every wording and claims rule stays. Done when a post made on production shows its food names before its totals are ready, and no total appears until all of its foods are calculated.

### #139 A held worker lease renews for its full time

A worker that renews its lease does not actually extend it, so a long job can lose the lease while it is still running.

The lease SQL does not extend the lease when a worker renews it. A 300-second time-to-live against about 60 seconds of work hides the defect today. Fix the renewal and add a test. Done when a lease held past its first term is still held and a test proves it.

### #282 The live app keeps working while judges use it

Judging runs Nov 4 to Nov 8, and if the Meta API credits run out first, a judge who posts a meal sees a failed analysis.

USDA FoodData Central allows 1,000 requests an hour. A meal takes about 4.7 requests, so the app handles roughly 200 meals an hour, and the sushi photo needs up to 36 requests when cold. When USDA answers 429, the worker retries at 30 and 60 seconds, ignores Retry-After and then fails the post. The 16-food gate alone made 38 model calls and 69,169 output tokens. Done when a post made while the Meta Model API refuses a call, or while USDA answers 429, shows the user a clear message and can be retried, and a USDA 429 waits as USDA asks.

### #287 The README shows judges the three Meta models, the technical depth and what the app does not do

A judge reads the repository and watches the video, and the README does not yet put in front of them the evidence the four scoring criteria ask for.

Show evidence for each scoring criterion: Impact 30%, Use of Meta AI Tooling 25%, Demo 25% and Technical Depth 20%. Name SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, the job each does and where its model ID is logged, and add Muse Spark Open if #281 lands. Summarise what was built from Oct 26 to Nov 4. The evidence is the test count, the ten-photo evaluation with its stated limits, the real-model gates, the worker timing and the item history that keeps every correction. State plainly that the app records what was eaten, never advises, sets no targets and makes no health claims. State only what the coder's reports prove, and carry no private account detail. Done when the README has those parts and each claim links to its evidence.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature merges, one pass replaces the default README with a short start-here page (#287). All working files stay on main, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed or scrubbed. Done when the README is the start-here page and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Unverified review finding. The tick route statically imports the worker drain. The drain statically imports all six job modules. Those pull in the food-analysis pipeline, the Meta model SDK, the SAM parser, the PNG library and the push library. The files are src/app/api/jobs/tick/route.ts, src/lib/worker/handlers.ts and src/components/QueueTicker.tsx. The suggested fix loads each job module with a dynamic import inside the job runner, keyed by job kind, so tick boots with only the queue code. Tests pass their own job table and are untouched. This change touches the worker path, so it needs a deploy and a real phone check before the demo. Done when a cold tick call answers without loading the job modules, and the cold open times before and after are in docs.

### #323 Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

Unverified review finding. Files: src/middleware.ts, src/app/(tabs)/page.tsx. Fix: the middleware writes the verified user id into a request header that it overwrites unconditionally. Pages read that header and skip the second check. The middleware still validates the token, so a client cannot fake the header. API routes are not matched by the middleware, so they keep their own check. Done when a page open makes one sign-in call, and an unsigned request still cannot reach a protected page.

### #324 Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

Unverified review finding. Files: src/app/(tabs)/page.tsx, src/components/Feed.tsx. Fix: pass the server's totals into the feed and skip the feed's own call for days already covered. It overlaps the Run 7 change that bounds refreshTotals. Done when a home open queries today's totals once.

### #326 Fonts ship as four full TrueType files, about 390KB (part of #222)

First paint on a phone downloads up to 390KB of font files. Four Manrope weights, about 97KB each, are served as they are.

Unverified review finding. Files: src/lib/theme/font.ts, src/assets/fonts/. The font loader does not convert the files to the smaller web format or trim unused characters. Fix: convert them to the web format and trim them to the Latin character set. Done when first paint downloads the fonts at a much smaller size, the text looks the same, and the sizes before and after are in docs.

### #327 The Days page runs a query for every meal

The Days reader fetches the month's posts. Then it runs an items query and a photo query for each post, in batches of 8. A month with 40 meals costs about 80 extra queries, plus a signed web address call per photo. The page gets slower the more the app is used.

Unverified review finding. File: src/lib/posts/days.ts. The month summary in the same file does the same job in one joined query. Fix: give the Days reader the same shape. Done when the Days page for a month loads with a fixed number of queries, however many meals it holds.

### #328 The spending routes have no per-user call cap

Only the agent-token routes cap calls, at 60. The label reader, voice transcription, food search and post creation routes have no per-user cap. A stuck loop calling the label reader burns one Meta model call per hit with nothing to stop it. The same holds for transcription and food search quota.

Unverified review finding. Files: src/lib/agents/tokens.ts, src/app/api/label/read/route.ts, src/app/api/transcribe/route.ts. These routes require sign-in, so the risk is a runaway client, not anonymous abuse. Fix: reuse the agent-token call-count pattern as a per-user cap on the spending routes. Done when a loop calling each of those routes is refused after the cap.

### #329 Upload signing accepts invalid shot sizes and positions

The upload route writes the caller's position, width and height straight into the media rows. A caller can store position -1 or 9999, width 0, or duplicate positions. Later code assumes sane values for ordering and display, so crafted uploads can order or display oddly.

Unverified review finding. File: src/app/api/media/sign-upload/route.ts. Fix: reject negative positions, zero sizes and duplicate positions. Done when each of those uploads is refused.

### #330 No loading screen appears when you move between screens

When you move between screens, nothing shows until the next screen is ready. On a slow open this looks like a frozen app.

Unverified review finding. Done when each tab shows a loading state at once while its page loads.

### #331 The health endpoint cannot tell whether the app works

The health endpoint reports only whether the configuration names are set. It does not tell whether the database or the model path works.

Unverified review finding. Done when the health endpoint reports whether the database and the model path answer.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

Supabase Auth limits requests per IP address and supports the hCaptcha and Cloudflare Turnstile CAPTCHAs (Supabase docs), and some of its limits can be changed in the dashboard. Nobody has recorded what the production project has set, whether a CAPTCHA is on, or whether a new account's posts, which spend Meta credits, are limited. The owner chose hCaptcha: turn it on for sign-up and sign-in through Supabase Auth's CAPTCHA protection. The owner holds the site key and the secret. The secret goes only into the Supabase dashboard, never into the repository, an issue, an order or this backlog. Observe first: report the Auth limits the production project has set, the CAPTCHA state, what a script that sends sign-ups and sign-ins faster than a person receives, and how many posts a new account can make. A hammering test against production could lock out the demo accounts, so the test must not use the demo accounts and no limit may lock them out. Done when those are reported, hCaptcha is on for sign-up and sign-in, and a script that hammers sign-up and sign-in is refused.

### #223 Check that an edited caption shows everywhere

A caption could not be changed after posting; a stray "R" stayed on the owner's caption.

"Edit caption" is in the post menu (PostMenu.tsx). Editing the caption does not re-run the estimate or change the items. Check it on production with a test account. Done when an edited caption shows its new text on the feed card, post detail, Days and Search after a reload on production.

### #228 A meal summary may state numbers that differ from the calculated totals

Written text on a card could state calorie or macro numbers that differ from the calculated totals.

A ChatGPT code review claims the model-written summary is checked for wording but not compared with the calculated totals, and that a formatter that works from the totals already exists. Nobody has verified either claim. Read the summary code and try to produce a summary whose number differs from the totals, then report. If it can differ, publish only nutrition text formatted from the totals, leave the caption's own numbers (such as "two eggs") alone, and make every screen that shows these numbers agree after rounding. Done when a model summary saying 900 kcal against calculated totals of 600 kcal publishes 600 everywhere, or the report shows it cannot happen.

### #272 The food matcher gives different answers for the same words

The same words for a food can match different references from one call to the next, and one miss turns a whole meal's total into unavailable.

The coder's probes recorded the matcher's reason for every match. Identical lowercase input selected different references across calls, so the variation is in the choice, not only in capital letters. The dipping sauce matched "Dip, NFS" at 432 kcal per 100 g, about 130 kcal for 30 g. A cheeseburger with lettuce, tomato, onion and pickle matched in one answer and not in another; its total of 1,296 kcal became unavailable, with a known subtotal of 467 kcal. Done when the same words give the same match on repeated calls.

### #65 The pipeline's tests cannot run offline

Nothing exercises the analysis pipeline without a live key and live credit.

Meta's workshop repository ships a scripted offline model: a real OpenAI client whose requests never leave the machine. It answers from recorded outputs, including recorded SAM outputs, and it can refuse a request with a 400. A fake already exists in tests/fake-meta and MODEL\_API\_BASE\_URL is already wired into the client. Add the tests that use the fake. Done when the path from a posted meal to ready, a correction, a 400 failing a job at once and a 429 retrying all run in the test suite with no network and no key.

### #66 Nothing tests that a brief Meta rate limit is retried

A brief rate limit from the Meta Model API should not cost a job attempt, and no test shows that it does not.

Meta's workshop client sets four retries and a 180-second timeout on the OpenAI SDK client, and the SDK waits as long as the API asks on a 429 or a 503. Our client already sets its retry count and timeout explicitly in client.ts. Add the missing test. Done when a test through the fake API shows that a 429 which carries a wait is retried inside one job attempt.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The label "leftovers (not eaten)" reads awkwardly. The planner reviews the app's terms with AGY as a second opinion and lists each term, where it appears and a recommended replacement. The terms include the leftovers label, "Consumed", "Log again", "Saved meals", "Additional food", the needs-input question and the Days names. Every rule stays: consumed past tense, no target, goal, ring or percentage, and no "left" as a word for a remaining amount. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears.

### #107 Every card has a visible way to open post detail

A new user has to guess that tapping a card's text opens the meal's detail view. Nothing on the card says so.

The detail view is where the SAM outlines, the full nutrition table and item editing live, so a user who never finds it never sees where the numbers came from. Add a "Details ›" control on every card, and make the photo and the analysis block tappable too. Done when a new user opens detail without being told how.

### #175 Days shows days that hold only water or caffeine

A day on which only water or caffeine was logged shows nothing on Days.

Water and caffeine are intake entries and are allowed; weight and exercise are not. Done when such a day appears on Days with a marker.

### #224 Times on a card are in the user's own time zone

A post shows its time twice in two different zones, one labelled UTC and one in local time.

Show every time in the device's time zone: card header, post detail, the thread and the Days stories. The current card and detail components show no UTC label, so the cause may have moved; observe first. Done when a post made at 5:20 PM in Japan reads 5:20 PM everywhere a time shows, and no screen labels a time UTC.

### #215 Thumbs up and down respond at the tap

The thumbs-up and thumbs-down buttons look dead when tapped, the change shows up some time later, and they feel clunky.

The cause is unknown; a likely one is that the button waits for the server before it shows anything, so verify by observation. Show the pressed state at the tap, settle when the verdict is saved, and show an error and revert if the save fails. Done when a tap on either thumb changes the button visibly before the server answers on production, the saved verdict survives a reload, and a failed save is shown.

### #29 Rendered results-card image added to each post's carousel

Not every post has a photo, and a photo post loses its numbers once the analysis is one line of small type.

results-card.tsx renders the card from the stored items and totals and stores it as a post\_media row of kind card. Caption-only posts use the card as their image. The card is a clean square with item names, portions and totals in the app's type and colours. Code renders it from data, not an image-generation model, because this build is limited to SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0 (plus Muse Spark Open if #281 lands). It uses consumed wording only, with no goal, rings or percentages, and is regenerated when a correction supersedes the items. Done when a logged photo shows the photo and then the card as swipeable slides, a caption-only post shows the card as its image, and a correction changes the numbers on the card.

### #283 A saved card image shows its whole footer

A results card saved as a PNG cuts off its footer.

The clipping was seen after PR #271. Which footers clip, on which cards, and whether the card image shown in the feed clips too are not known. Observe first, then fix. Done when a saved card's PNG shows its footer in full for a meal with one photo and for a meal with leftovers photos.

### #18 Days stories row and month grid of past posts

A user cannot look back over what they ate on earlier days.

The row at the top of Home is seven day bubbles, today on the right, each showing the day's first photo or a blank ring if nothing was eaten. Tapping a day plays that day's posts full screen in sequence with tap-to-advance and swipe-left/right between days, and the last card shows "Consumed on Tuesday: 1,840 kcal" with the macro line. A sum of what was eaten is a record, not a goal; no comparison to any other day, no average, no target. The Days tab in the bottom bar opens a month grid that scrolls back. Done when a week with three logged days plays as three stories and the bubbles match.

### #20 Profile grid of the user's post thumbnails with sign out

Profile gives a user no overview of their own posts.

Show a grid of post thumbnails, newest first, three across; tapping one opens the detail. Above it the handle and a Sign out button. Nothing else: no weight, no streak, no badge, no count of anything beyond posts. Done when the grid loads the user's posts and nothing on the screen suggests progress toward anything.

### #2 Shell screen matches the designer's frame and installs as a PWA

The bottom bar and the three placeholder tabs (Search, Days, Profile) render unstyled, and the app cannot be installed to a phone.

The frame, the bottom bar and the five routes are merged and live. Restyle the bar and the three placeholder tabs from the designer's frame using the theme tokens and shared components, and add the PWA remainder: a manifest named "My Food AI" with the designer's icons, a service worker that caches the shell and serves navigations network-first, and the meta tags iPhone Safari needs to install it. No onboarding, no interstitials, no splash beyond the browser's. Done when the bar and the placeholder tabs match the frame at 390 px wide in light mode and the PWA installs on a phone.

### #3 Sign-in and sign-up screens match the designer's frames

The sign-in page and the sign-up page render unstyled.

Restyle both from the designer's frames using the theme tokens and shared components: the brand mark, the email, handle and password fields, the primary button, the line that switches between the two screens, and the Facebook button only under the existing flag. Done when both pages match the frames at 390 px wide in light mode, built from tokens and shared components, and signing in and signing up still work.

### #11 Home screen matches the designer's frames

Home renders unstyled.

Restyle it from the frames using the theme tokens and shared components: the title bar, the seven day bubbles as an empty row drawn from today's date, the card at rest, the expanded analysis block, the shimmer with its traffic line, the no-food card, the could-not-be-analysed card, the caption-only card drawn with the results card component, and the empty state with the one-time tooltip over the +. The analysis block from #12 is on main, and this item restyles it to the frame. Done when every state matches the frames at 390 px wide in light mode from tokens and shared components, and a new post still fills in without a refresh.

### #6 Capture screen matches the designer's frame

The capture sheet renders unstyled.

Restyle it from the frame using the theme tokens and shared components: the dark sheet, the top bar, the camera area, the shutter and gallery buttons, the thumbnail strip, the caption field, the location line as static copy, and the Post button. After a successful post the sheet sends a post-created event before it closes, which later items listen for. Done when the sheet matches the frame at 390 px wide and a post still completes.

### #193 Page looks for every screen against the designer's frames

No screen has been compared with the designer's frames, and the intake control and the barcode scanner have no frame at all.

Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

### #23 One-time hint tooltips for the + sheet, the thread and the thumbs

The three things a new user has never seen are the + sheet, the thread label and the thumbs, and nothing tells them what these are.

On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Done when a fresh account sees exactly three tooltips across its first session.

## Interdit (Not part of Hackathon)

### #114 Facebook Login in production mode

Public sign-in with Facebook needs the app submitted for Meta app review, which takes longer than the event.

Blocked by Meta app review. Development mode works for the developer's own and test accounts, which is enough for the demo. While a Facebook app is in Development mode only people with a role on the app can sign in, and everyone else sees an "App Not Setup" error (Supabase docs). Instagram has no sign-in for consumer apps: Meta shut the Instagram Basic Display API on Dec 4, 2024 and tells developers to use Facebook Login. No Instagram button is added. The button stays grayed out and inert until review passes (#316).

### #115 Dark mode

The app has no dark mode.

Blocked by scope. The first design pass is light mode only. Dark mode is designed after the ten screens are built, and the colour tokens in the design system item are named by role so a dark set can be added without touching components.

### #218 Hydration as a share of daily intake

The owner wants the app eventually to show how much of the user's daily intake is hydration.

Blocked until after the hackathon, and blocked by the claims rule: the app shows no percentage that reads as progress, and a share of intake is a percentage. The owner decides whether this one figure may break that rule. Done when the owner has lifted the rule for this figure and its design is drawn.

---

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its issue is closed by a merged pull request; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role: Backlog for Owner, Backlog for Designer and Engineering backlog, ordered within a section by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph that states the problem in plain language and in enough depth that a person could fix it; (3) a second paragraph with all the context that helps a person solve the problem, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. Write short sentences in the active voice, as the Google developer documentation style guide asks. An item without all three parts is not on the backlog.
