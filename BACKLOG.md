# My Food AI — Backlog†

Last edited: Tuesday 2026-11-03 at 15:34 WIB (UTC+07:00) by Claude, PM

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

### #379 Phone checks of the installed app over mobile data

Every Run 7 and Run 8 timing check ran in emulation. No physical phone has tested the feed, the photos, installation or posting.

Check on each of the owner's three phones, installed from the home screen, over mobile data: the feed and the first photo show within two seconds (#222, #305); the last feed shows at once and fresh posts appear without jumping (#304); a warm revisit reuses cached photos and the photos look acceptable (#305); the camera, the keyboard and a post from the phone work, with the right photo kept (#6); a post completes through the worker (#322). Done when each check passes on each of the three phones and each failure is reported to the coder with its number.

## Engineering backlog

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

Unverified planner finding. The app's sign-up and sign-in run as server actions on Vercel, and the middleware refreshes sessions from Vercel. The Run 8 hammer was refused at request 31, but it called Supabase directly from the coder's machine, so it did not test the app's path (docs/auth-protection.md). Nobody has checked which IP address Supabase records for a server-action sign-in, or whether the server client forwards the user's address. Observe first: send 35 sign-ups through the production sign-up form from one machine, then sign in from a second machine. Use throwaway @example.com accounts only. Done when the report states which IP address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #369 The public repository does not show Run 8, and its test claims are stale

Judges read the README and the evidence on main, and main still shows Run 7.

All Run 8 evidence and the updated CLAUDE.md are in open docs PR #333, and the Fleet 9 evidence is in open docs PR #344. The README still describes Run 7 and says 17 database tests passed. The database gate now passes 20 of 20. The touched barcode test file fails with a fake USDA key (two failures, reproduced on the original main), and the full lint run shows 34 errors and 20 warnings (docs/run8-final-report.md). Done when #333 and #344 are merged, the README states the current test counts with the known failures, and every README evidence link points at a current document on main.

### #370 The camera view stays open for a long time after a photo is taken

After a photo is taken, the camera view stays on screen for a long time before the post shows in the feed. People will not wait that long.

The capture sheet sends its post-created event and closes only after a successful post, so it waits on the upload and the server. The owner reports the wait on his phone. Observe first: time the tap to the sheet closing and to the new post showing, on a phone over mobile data, and record the size in bytes of each photo the phone uploads. Then close the sheet at the tap and show the new post at the top of the feed in its processing state while the upload finishes. Done when the sheet closes within one second of the tap on a throttled connection, the post appears at the top of the feed in its processing state, and a failed upload is shown on that post.

### #371 Thumbs show "Feedback could not be saved." on production

Tapping a thumb on a production post shows "Feedback could not be saved." The message appears twice, once over the photo and once under the buttons.

Seen on the owner's phone after the Run 7 merges, where #314 shows an error and reverts when a verdict save fails. The cause of the failed save is unknown. Observe the verdict request and its response on production first. Done when a tap on either thumb saves on production, the saved verdict survives a reload, and a failed save shows one message.

### #372 Feed photos are too large for a phone on mobile data

A feed photo downloads at a size far larger than a phone card shows, so the first photo arrives late and every revisit pays for it again.

The sampled feed image is 152,193 bytes and its response carries no Cache-Control header (docs/media-loading.md). Several cards cost megabytes on mobile data, and the cold first photo measured 2.10 s against the 2 s target. The feed photo route (src/app/api/media/feed/\[owner\]/\[post\]/\[media\]/v1.webp/route.ts) reads the original from Storage on every request. Find the largest size a feed card needs on a phone and serve that instead of the original. Keep the original where post detail needs it. Done when the bytes per feed photo before and after are in docs, the first photo of the feed shows within two seconds on mobile data, and the photos look the same on a phone.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

Run 8 cut the feed's Supabase traffic per opening from 5.06 MB to 0.523 MB, 89.7%, by reading day totals once. The app and the worker use Supabase's HTTPS APIs, not SQL connections, so the pooler setting does not apply. Managed services (PostgREST, Storage, Realtime) account for many of the connections the Infrastructure page counts, and the historical 31 of 60 is unexplained, as is the 70% RAM on the Micro instance. Log-ingestion bytes are unattributed, since only row counts exist. Done when the billed log-ingestion bytes are attributed to their sources on the usage page and the RAM use on the Micro instance is explained.

### #374 Find when the worker's empty-claim loop started and whether it caused the feed failures

Until #340, the worker treated an empty job claim as work, about once a second. The intermittent feed errors, the 31 of 60 database connections and the Disk IO drain may all come from it.

In 24 hours the loop produced 74,736 empty claims, 74,698 failures and 70,155 lease grabs. Production now shows zero. Run 7's baseline on the old code also opened 100/100, so the original 3 server errors and 15 blank feeds were never reproduced. Run 8's 100/100 ran unthrottled at low concurrency. Read the logs back day by day for the first day the claim-and-fail pattern appears, and compare it with the dates of the feed-error reports and the merges. Done when the start date and the merge that introduced the loop are named, and the report says whether the loop explains #222's original failures.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md attributes the bytes to browser-class agents but not to which files (feed JPEGs, card PNGs or originals) or which clients. Much of it may be the coder's own 100-opening measurement runs. Log-ingestion bytes were never measured; only row counts were. Done when Storage egress is broken down by file kind and by client (test automation or real users), log-ingestion bytes are measured, and the largest real-user source is cut or shown to be small.

### #376 Feed photos may download again after every session refresh

Feed photos are cached for a year, but the cache varies by cookie, and Supabase's session cookie changes on every token refresh. The browser may download every photo again after each refresh.

The service worker's own cache may cover this; nobody has checked it after a refresh. Done when a photo opened before a token refresh loads with no network bytes after it, or the cause is fixed.

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears. When it opens, photos and cards take a long time to show, so the app feels broken and slow.

Run 8 merged the cold-open fixes (#322, #323, #324, #326). In emulation, 100 of 100 browser openings passed and the five final cold photos took 1.48 to 1.83 seconds. The original failures (3 server errors and 15 blank feeds in 100 openings on the largest test account, 146 posts) never reproduced on Run 7's baseline, so their cause is not isolated; the worker's empty-claim loop is a suspect (separate item). The runtime logs return 403 for the coder, so the stack for digest 3642131196 exists only in the Vercel console. Done when the feed and the first photo show within two seconds on the owner's phone over mobile data.

### #304 The app opens on the last feed it showed and updates behind it

Opening the app shows a blank screen until the server answers. The owner sees ten seconds with nothing on it.

The service worker (public/sw.js) loads each page from the network first. It never shows the last signed-in feed while it waits, and it falls back to a cached anonymous page only when the request fails outright. Show the last feed the phone received at once, then replace it with fresh posts when they arrive. Nothing the user taps waits for the refresh. Done when opening the installed app on a throttled connection shows the last feed within two seconds and the new posts appear behind it without the page jumping.

### #305 The first card's photo loads first and the photos below it wait

On a slow connection the first card's photo arrives late, and nobody has shown whether the photos below it are the reason.

The sampled feed image is 152,193 bytes and its response carries no Cache-Control header (docs/media-loading.md), so several cards cost megabytes on mobile data and a revisit downloads them again. Load the first card's photo with priority, load the others as the user scrolls toward them, and let the phone keep photos between visits. Whether the feed already loads lazily is not known, so observe first. Done when the first photo of the feed shows within two seconds on mobile data, the photos below it do not delay it, and a second visit loads the same photos from the phone.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

Use Muse Spark Open (meta-models/muse-spark-open-1026) through Baseten's OpenAI-compatible endpoint, https://inference.baseten.co/v1, for the identify-and-portions call. The key works only with that model and never goes in the repository, an issue or this backlog. Confirm the coder can sign in to Baseten with the key before the trial. The model always reasons, so check output caps that include reasoning. The Meta client hardcodes model names, and the ten-photo harness cannot choose a model host. Trial first in a throwaway clone that swaps only that call, and spend at most 5 US dollars. SAM and transcription stay on the Meta API, and the USDA lookup is unchanged. Compare the ten meal photos and one caption, "I ate half the rice", against the current path. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and the owner has switched it on in Profile, logged a meal, and seen the Muse Spark Open line in that meal's post detail on production.

### #316 The Facebook button is shown grayed out and does nothing

A judge who taps the Facebook button on the sign-in page would see an error, because the Facebook app is in Development mode.

Meta's app review takes longer than the event, so Facebook sign-in cannot go live (#114). Show the Facebook button on the sign-in and sign-up pages, grayed out, and do nothing when it is tapped. Done when the Facebook button on the sign-in and sign-up pages is grayed out, tapping it does nothing, and no error shows.

### #306 Every tap that saves shows its result at once

Some taps that save something look dead until the server answers, so the app feels slow.

The thumbs (#215) are one case. The bookmark, Save meal, Log again and Edit caption (#223) may also wait for the server; observe which do. Each should show its new state at the tap, settle when the save lands, and show an error and revert if it fails. #217 measures every control; this item fixes the ones that wait. Done when each of those taps changes the screen before the server answers on a throttled connection, the saved state survives a reload, and a failed save is shown.

### #307 A card shows the foods the app has found while the numbers are still being worked out

A new post shows a shimmer for most of its wait, though the app knows what the foods are long before it knows their nutrition.

Identification finishes in 3.3 to 8.1 seconds while the active worker time of the whole job is 16.5 to 25.2 seconds (docs/production-performance.md), so for most of the wait the foods are known and only their nutrition is missing. Show the food names as soon as identification finishes, fill in each food's nutrition as it lands, and keep the total unavailable until all of it is in. Every wording and claims rule stays. Done when a post made on production shows its food names before its totals are ready, and no total appears until all of its foods are calculated.

### #282 The live app keeps working while judges use it

Judging runs Nov 4 to Nov 8, and if the Meta API credits run out first, a judge who posts a meal sees a failed analysis.

USDA FoodData Central allows 1,000 requests an hour. A meal takes about 4.7 requests, so the app handles roughly 200 meals an hour, and the sushi photo needs up to 36 requests when cold. When USDA answers 429, the worker retries at 30 and 60 seconds, ignores Retry-After and then fails the post. The 16-food gate alone made 38 model calls and 69,169 output tokens. Done when a post made while the Meta Model API refuses a call, or while USDA answers 429, shows the user a clear message and can be retried, and a USDA 429 waits as USDA asks.

### #287 The README shows judges the three Meta models, the technical depth and what the app does not do

A judge reads the repository and watches the video, and the README does not yet put in front of them the evidence the four scoring criteria ask for.

Show evidence for each scoring criterion: Impact 30%, Use of Meta AI Tooling 25%, Demo 25% and Technical Depth 20%. Name SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, the job each does and where its model ID is logged, and add Muse Spark Open, with how a judge switches it on: Profile, then the switch under the handle. Summarise what was built from Oct 26 to Nov 4. The evidence is the test count, the ten-photo evaluation with its stated limits, the real-model gates, the worker timing and the item history that keeps every correction. State plainly that the app records what was eaten, never advises, sets no targets and makes no health claims. State only what the coder's reports prove, and carry no private account detail. Done when the README has those parts and each claim links to its evidence.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature merges, one pass replaces the default README with a short start-here page (#287). All working files stay on main, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed or scrubbed. Done when the README is the start-here page and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Run 8 merged lazy loading of the job modules in the tick route. Rapid tick calls passed, but they hit a warm function, so a cold start is unmeasured (docs/tick-cold.md), and a post from a real phone through the worker is untested. Done when a cold start of the tick route is timed on production, before and after, with the times in docs, and a post from a real phone completes through the worker.

### #383 The Coffee tile on the drink sheet fails to post on production

Tapping the Coffee tile on the drink sheet does not post a coffee on production.

Fleet 9's production check of the Coffee tile failed. The Water tiles failed on a database guard that migration 0037 (#380) fixed, and they have not been retested. Observe the failing request and its response first. Done when the Coffee, Espresso, Tea, Coca-Cola and both Water tiles each post on production and Undo removes the post.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of USDA caffeine, but they have null beverage categories and no linked item-intake rows. #346 fixes new and re-analysed posts only, and no historical backfill ran. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #325 Regions and deployment timeouts are not declared in the repository

The function and database regions are set in the Vercel and Supabase dashboards, so the repository cannot reproduce the production deployment.

Vercel functions run in iad1 (Northern Virginia) and the database in us-east-2 (Ohio). The project's default function timeout is 300 seconds. The repository declares 300 seconds for the tick route and 20 seconds for the feed route, and vercel.json holds only its ignore rule, with no region. Done when both regions are documented and the repository's deployment and route declarations reproduce the intended production regions and timeouts.

### #323 Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

Run 8 merged one sign-in check per page: the server makes one Auth call, and a forged header is refused. Recorded browser windows still contained 10 and six /auth/v1/user requests, so the whole opening is not yet attributed. API authentication stays intact. Done when a page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page.

### #324 Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

Run 8 merged one shared server read of today's totals. Final browser windows still made one or two day-total reads, so a single read across the server and the browser together is unproved. Done when a home open queries today's totals once across the server and the browser together.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. Run 8 merged a dormant hCaptcha widget and token path (#336). Called directly from the coder's machine, Supabase refused the hammer at sign-up 31 and sign-in 32, and the 31 throwaway accounts were deleted. The owner holds the site key and the secret. The secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT\_PUBLIC\_HCAPTCHA\_SITE\_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers sign-up and sign-in is refused.

### #223 Check that an edited caption shows everywhere

A caption could not be changed after posting; a stray "R" stayed on the owner's caption.

"Edit caption" is in the post menu (PostMenu.tsx). Editing the caption does not re-run the estimate or change the items. Check it on production with a test account. Done when an edited caption shows its new text on the feed card, post detail, Days and Search after a reload on production.

### #228 A meal summary may state numbers that differ from the calculated totals

Written text on a card could state calorie or macro numbers that differ from the calculated totals.

A ChatGPT code review claims the model-written summary is checked for wording but not compared with the calculated totals, and that a formatter that works from the totals already exists. Nobody has verified either claim. Read the summary code and try to produce a summary whose number differs from the totals, then report. If it can differ, publish only nutrition text formatted from the totals, leave the caption's own numbers (such as "two eggs") alone, and make every screen that shows these numbers agree after rounding. Done when a model summary saying 900 kcal against calculated totals of 600 kcal publishes 600 everywhere, or the report shows it cannot happen.

### #272 The food matcher gives different answers for the same words

The same words for a food can match different references from one call to the next, and one miss turns a whole meal's total into unavailable.

The coder's probes recorded the matcher's reason for every match. Identical lowercase input selected different references across calls, so the variation is in the choice, not only in capital letters. The dipping sauce matched "Dip, NFS" at 432 kcal per 100 g, about 130 kcal for 30 g. A cheeseburger with lettuce, tomato, onion and pickle matched in one answer and not in another; its total of 1,296 kcal became unavailable, with a known subtotal of 467 kcal. A beef tenderloin steak topped with butter returned "Nutrition unavailable" on a production post, so the meal's total counted only its other foods. Sauteed spinach with corn returned "Nutrition unavailable" on another production post. Done when the same words give the same match on repeated calls.

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

### #193 Page looks for every screen against the designer's frames

No screen has been compared with the designer's frames, and the intake control and the barcode scanner have no frame at all.

Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

### #23 One-time hint tooltips for the + sheet, the thread and the thumbs

The three things a new user has never seen are the + sheet, the thread label and the thumbs, and nothing tells them what these are.

On the first visit to each, show a single dismissable tooltip in the style of a photo app's one-time hints, stored as seen in `profiles`. Never shown again, never a tour. Capture modes added a fourth hint type, so the count is no longer three. Done when a fresh account sees each hint exactly once across its first session.

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

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This Doc is private between the PM and the owner, and the coder cannot open it. The coder reads BACKLOG.md, which the owner copies from this Doc. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its work is merged, its done condition is met and its issue is closed; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role: Backlog for Owner and Engineering backlog, ordered within a section by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph that states the problem in plain language and in enough depth that a person could fix it; (3) a second paragraph with all the context that helps a person solve the problem, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. Write short sentences in the active voice, as the Google developer documentation style guide asks. An item without all three parts is not on the backlog.
