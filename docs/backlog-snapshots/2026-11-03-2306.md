# My Food AI — Backlog†

Last edited: Tuesday 2026-11-03 at 23:06 WIB (UTC+07:00) by Claude, PM

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

The submission needs the public repository, the video link and a list of everyone who worked on it. Judges stop watching at three minutes, and the video must show the feature working with live Meta model calls and say which open Meta model it uses and where it runs, Muse Spark Open on Baseten (Cerebral Valley, Nov 3). Every feature built is in the video, the not-eaten plate included. Post the video to X as soon as it exists: the Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. Whether the post must exist before the submission deadline is unconfirmed. No merges or deploys run from the start of recording until the submission is in. Done when a video under three minutes is on X and the submission is in.

### #379 Phone checks of the installed app over mobile data

Every Run 7 and Run 8 timing check ran in emulation. No physical phone has tested the feed, the photos, installation or posting.

Check on each of the owner's three phones, installed from the home screen, over mobile data: the feed and the first photo show within two seconds (#222, #305); the last feed shows at once and fresh posts appear without jumping (#304); a warm revisit reuses cached photos and the photos look acceptable (#305); the camera, the keyboard and a post from the phone work, with the right photo kept (#6); a post completes through the worker (#322). Done when each check passes on each of the three phones and each failure is reported to the coder with its number.

## In Flight

### #468 Big numbers lose their thousands separator on the desktop Days and Today

The same total reads "34,811" in one place and "34811" in another on the desktop screens.

In the PR #460 screenshots, the Days panel shows "Consumed: 34811 kcal" while its calendar cell shows "34,811", and the Today column uses the same formatter, so it would show "2118" beside the feed's "2,118". Done when every kcal total on desktop Days and Today is written the way the feed writes it.

### #469 The desktop Home and New post are likely to break below 1280 by 800

The layout was only tested at 1280 by 800, and the CSS suggests two other sizes break.

Between 1024 and 1147 px wide, the feed and the Today column need 844 px of room and the layout gives them less, so the Today column should overflow or force sideways scrolling. The New post window is a fixed 620 px tall with padding, so a laptop browser about 650 px high, such as 1366 by 768, clips the top or the shutter. This comes from reading the CSS and was not run. Done when Home and New post are checked at 1024 by 700 and 1366 by 650 and nothing is clipped or scrolls sideways.

### #470 On desktop, adding a photo to an existing post has no file picker

Adding a photo to an existing post, including a not-eaten plate, gives a desktop user no way to choose a file.

That flow keeps the old window, where "Choose from library" is hidden on desktop, so without a webcam the user sees only the camera area and nothing says that drag and drop or paste works. This predates PR #460. Done when, on desktop with no webcam, a photo can be added to an existing post from a file picker.

## Engineering backlog

### #473 The desktop Today column may not shrink at 1100 px wide

The Today column beside the feed may keep a fixed width where it should shrink, so Home overflows sideways on a narrower window.

In PR #462 the Today column sets a fixed width of 280 px and also a flexible width, and the review flagged that the fixed width may win. Nobody has checked the column at 1100 px. Done when Home at 1100 by 800 shows the feed and the Today column with no sideways scrolling.

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

Unverified planner finding. The app's sign-up and sign-in run as server actions on Vercel, and the middleware refreshes sessions from Vercel. The Run 8 hammer was refused at request 31, but it called Supabase directly from the coder's machine, so it did not test the app's path (docs/auth-protection.md). Nobody has checked which IP address Supabase records for a server-action sign-in, or whether the server client forwards the user's address. Observe first: send 35 sign-ups through the production sign-up form from one machine, then sign in from a second machine. Use throwaway @example.com accounts only. Done when the report states which IP address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #369 The public repository does not show Run 8, and its test claims are stale

Judges read the README and the evidence on main, and main still shows Run 7.

All Run 8 evidence and the updated CLAUDE.md are in open docs PR #333, and the Fleet 9 evidence is in open docs PR #344. The README still describes Run 7 and says 17 database tests passed. The database gate now passes 20 of 20. The touched barcode test file fails with a fake USDA key (two failures, reproduced on the original main), and the full lint run shows 34 errors and 20 warnings (docs/run8-final-report.md). Done when #333 and #344 are merged, the README states the current test counts with the known failures, and every README evidence link points at a current document on main.

### #370 The camera view stays open for a long time after a photo is taken

After a photo is taken, the camera view stays on screen for a long time before the post shows in the feed. People will not wait that long.

The capture sheet sends its post-created event and closes only after a successful post, so it waits on the upload and the server. The owner reports the wait on his phone. Observe first: time the tap to the sheet closing and to the new post showing, on a phone over mobile data, and record the size in bytes of each photo the phone uploads. Then close the sheet at the tap and show the new post at the top of the feed in its processing state while the upload finishes. Done when the sheet closes within one second of the tap on a throttled connection, the post appears at the top of the feed in its processing state, and a failed upload is shown on that post.

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

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears. When it opens, photos and cards take a long time to show, so the app feels broken and slow.

Run 8 merged the cold-open fixes (#322, #323, #324, #326). In emulation, 100 of 100 browser openings passed and the five final cold photos took 1.48 to 1.83 seconds. The original failures (3 server errors and 15 blank feeds in 100 openings on the largest test account, 146 posts) never reproduced on Run 7's baseline, so their cause is not isolated; the worker's empty-claim loop is a suspect (separate item). The runtime logs return 403 for the coder, so the stack for digest 3642131196 exists only in the Vercel console. Done when the feed and the first photo show within two seconds on the owner's phone over mobile data.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

Use Muse Spark Open (meta-models/muse-spark-open-1026) through Baseten's OpenAI-compatible endpoint, https://inference.baseten.co/v1, for the identify-and-portions call. The key works only with that model and never goes in the repository, an issue or this backlog. Confirm the coder can sign in to Baseten with the key before the trial. The model always reasons, so check output caps that include reasoning. The Meta client hardcodes model names, and the ten-photo harness cannot choose a model host. Trial first in a throwaway clone that swaps only that call, and spend at most 5 US dollars. SAM and transcription stay on the Meta API, and the USDA lookup is unchanged. Compare the ten meal photos and one caption, "I ate half the rice", against the current path. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Cerebral Valley answered on Nov 3 that Muse Spark Open counts however it runs, including through Baseten. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and the owner has switched it on in Profile, logged a meal, and seen the Muse Spark Open line in that meal's post detail on production.

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

Show evidence for each scoring criterion: Impact 30%, Use of Meta AI Tooling 25%, Demo 25% and Technical Depth 20%. Name SAM 3.1, Muse Spark 1.3 and Muse Voice Transcribe 1.0, the job each does and where its model ID is logged, and add Muse Spark Open, with how a judge switches it on: Profile, then the switch under the handle. Summarise what was built from Oct 26 to Nov 4. The evidence is the test count, the ten-photo evaluation with its stated limits, the real-model gates, the worker timing and the item history that keeps every correction. State plainly that the app records what was eaten, never advises, sets no targets and makes no health claims. State only what the coder's reports prove, and carry no private account detail. Explain how a judge supplies the open-model endpoint and key through environment values, with an example env file (.env.example names IDENTIFY\_OPEN\_API\_KEY, IDENTIFY\_OPEN\_BASE\_URL and IDENTIFY\_OPEN\_MODEL), and state that the open model, Muse Spark Open, runs on Baseten. Follow the model's own license and link it from the README. Never put the endpoint address, a key or a credential in the README (Cerebral Valley, Nov 3). Done when the README has those parts and each claim links to its evidence.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature merges, one pass replaces the default README with a short start-here page (#287). All working files stay on main, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed or scrubbed. Done when the README is the start-here page and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Run 8 merged lazy loading of the job modules in the tick route. Rapid tick calls passed, but they hit a warm function, so a cold start is unmeasured (docs/tick-cold.md), and a post from a real phone through the worker is untested. Done when a cold start of the tick route is timed on production, before and after, with the times in docs, and a post from a real phone completes through the worker.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of USDA caffeine, but they have null beverage categories and no linked item-intake rows. #346 fixes new and re-analysed posts only, and no historical backfill ran. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #323 Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

Run 8 merged one sign-in check per page: the server makes one Auth call, and a forged header is refused. Recorded browser windows still contained 10 and six /auth/v1/user requests, so the whole opening is not yet attributed. API authentication stays intact. Done when a page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page.

### #324 Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

Run 8 merged one shared server read of today's totals. Final browser windows still made one or two day-total reads, so a single read across the server and the browser together is unproved. Done when a home open queries today's totals once across the server and the browser together.

### #294 The app's words read naturally everywhere

The leftovers label reads awkwardly, and nobody has reviewed the words in the rest of the app.

The label "leftovers (not eaten)" reads awkwardly. The planner reviews the app's terms with AGY as a second opinion and lists each term, where it appears and a recommended replacement. The terms include the leftovers label, "Consumed", "Log again", "Saved meals", "Additional food", the needs-input question and the Days names. Every rule stays: consumed past tense, no target, goal, ring or percentage, and no "left" as a word for a remaining amount. Done when the list is reviewed, the owner has ruled on each term, and the wording is changed everywhere it appears.

### #193 Page looks for every screen against the designer's frames

No screen has been compared with the designer's frames, and the intake control and the barcode scanner have no frame at all.

Capture every screen at 390x844 on production and list the differences per screen, and check the intake and barcode copy against the banned wording (past tense, no budget, no progress, no "left"). Done when the differences are listed per screen and the fixes are merged.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

### #449 The food names do not show before the numbers on a new upload

A new upload shows no food names while its numbers are still being worked out.

On a new upload, the card's reader drops the pending food names, so #307 fails there. Done when a new upload shows the foods the app has found while the numbers are still being worked out, on the owner's three phones.

### #471 The recording account can hit the hourly model cap on camera

A recording with several photos on one account can run into the model's hourly limit while the video runs.

Photo drink identification adds one model call per staged photo, counted against the account's hourly cap, and the last audit on production got "You have made a lot of requests this hour." Done when a recording-length session of several photos on one account runs with no cap message, or the account's cap is raised before recording.

### #348 A photographed drink's card was not proven on production

The card for a photographed drink was closed without the production check its done condition asked for.

The Fleet 10 report says the selected drink card on screen remains unproven. Done when a photographed drink shows the right drink card on production, on the owner's three phones.

### #351 The drink tile sizes and order were closed on a local test only

The tile sizes and order on the drink sheet were not checked on production.

Only a local test backs the closure. Done when the drink sheet shows its tiles in the right sizes and order on production, on the owner's three phones.

### #451 Every barcode scan comes back as not in the database

The owner has scanned several packs on a phone and every scan has failed: the scanner reads the code and the lookup finds no product.

The scanner read 7 622300 76136 3 from an Oreo pack and showed "Not in the database. No product for this code yet." The owner finds the same code with an ordinary web search, at barcodelookup.com/7622300761363. Done when this pack gives a product card with its name and nutrition, a second pack from the same shelf does too, and the planner has recorded which source the lookup asks and why it had no entry for this code, on the owner's three phones.

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

The photo of a Goldfish cracker pack, with the label printed in Indonesian and the table fully in the frame, gave "No nutrition label found" with "Take the photo again" and "Type it instead". Done when that photo gives a card with the numbers printed on the label, and a label in English does the same, on the owner's three phones.

### #453 The barcode prompt is printed over the live camera picture

On the Barcode screen, the line "Point at the barcode. It reads on its own." runs across the camera picture and cannot be read against a busy shelf.

With the camera pointed at a shelf of packs and price labels, the line sits on top of them and the words blend into the picture. Done when the prompt is readable over any camera picture, on the owner's three phones.

### #454 The Days page is not one continuous calendar

Days cuts the calendar into separate month blocks, which no calendar app does, so the user cannot scroll through time as one run of weeks.

On the phone, Days shows November 2026 and October 2026 as two separate blocks, each with its own heading, and the newest month sits on top. Days becomes one continuous calendar: the weeks run on from one to the next in time order with no break, the month name marks where each month starts, and Days opens with today in view. Done when scrolling Days moves through unbroken weeks from October into November, the month names mark where each month starts, and Days opens on today, on the owner's three phones.

### #455 The card you swipe to on a drink's photo shows a number and not what the drink is

Swiping right on a drink's photo opens a card with one big millilitre number, so the card does not say what the drink is or why it exists.

The swiped card for the tiki cocktail shows "220 ml" in large type, a line of text and "1,200 ml consumed today" split into drinks and food. A card for a drink leads with its kind as a picture: a coffee cup for coffee with its caffeine, a water cup for water with one cup for every 250 ml drunk, and a cocktail glass or a wine glass for those with their alcohol, and the day's drinks are drawn as the same cups. Done when a coffee, a 500 ml water (two cups), a cocktail and a glass of wine each show their own picture on the swiped card, and a card that holds only liquid reads as a drink at a glance, on the owner's three phones.

### #456 A rum cocktail is logged with 15 mg caffeine

The tiki cocktail post states caffeine that the drink does not contain.

The drink card for the lime and rum tiki cocktail reads "15 mg caffeine" next to 196 kcal, and the day's caffeine total reads 110 mg. Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine.

### #457 An alcoholic drink shows its alcohol, not its liquid

A cocktail post shows how much liquid it holds and nothing about the alcohol, so the user cannot tell how much they have drunk.

The post for a lime and rum tiki cocktail shows "220 g" on the photo and 196 kcal, 0 g protein, 17 g carbs and 0 g fat under it, with no alcohol anywhere. For a drink that holds alcohol, the post shows the grams of alcohol and the standard drinks in place of the liquid amount, the drink's liquid is not added to the water total, and Today shows the day's alcohol so far. Done when a photographed cocktail and a typed beer each show their alcohol on the post and in Today, and neither adds to the water tile, on the owner's three phones.

### #458 The text box on New post is hidden behind the keyboard

On New post on the phone, the caption box is not visible when the keyboard is open, so the user types without seeing the words.

On an iPhone with the keyboard up, the screen shows the photo and the Post button and no caption box. After a tap into the caption, the page scrolls so the box sits under the photo with the "Another photo" and "Search foods" buttons and other rows crowded around it. Done when, with the keyboard open, the caption box is fully visible above the keyboard together with the Post button, and nothing overlaps it, on the owner's three phones.

### #413 The desktop layout is rebuilt to the new frames 6a to 6f

The desktop app follows the old Round 4 frames, which the designer has replaced, so it no longer matches the design.

The designer delivered Round 6 at 1280x800 and removed the old desktop frames 4a to 4f. Frame 6a, Home: the same left sidebar on every screen, with New post as its one dark button and Profile at the bottom; the keyboard shortcut list leaves the sidebar and opens with the ? key; a Today column beside the feed shows today's totals and posts, and a dated line with each day's total separates the days. Frame 6b, a post open: the post opens in a window over the dimmed feed, with the photo on the left and the totals, items, comments and comment field on the right, in place of the narrow side panel. Frame 6c, New post: one window holds both the webcam and the photo drop area, with no Webcam and Upload switch, and the same Text, Photo and Barcode modes as the phone. Frame 6d, Days: a bigger month calendar, with the chosen day's posts in a full-height panel on the right. Frames 6e and 6f, Search and Profile: the same centred column, with "Connect an agent" as a button under the user's name. The desktop differences in the earlier visual-difference issues (#353 to #367) are superseded by these frames. The first build (PR #460, merged) still differs from the frames: on Days the ‹ › buttons sit at the right instead of beside the month title, the search field is filled grey where the frame's is white with an ink border, and the focus outline on search rows and the Profile grid is wider than its row or tile. Done when the app at 1280x800 matches frames 6a to 6f and the phone layout is unchanged.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. Run 8 merged a dormant hCaptcha widget and token path (#336). Called directly from the coder's machine, Supabase refused the hammer at sign-up 31 and sign-in 32, and the 31 throwaway accounts were deleted. The owner holds the site key and the secret. The secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT\_PUBLIC\_HCAPTCHA\_SITE\_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers sign-up and sign-in is refused.

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

† **What this backlog is.** The shared, ordered list of open work for My Food AI, shown live. GitHub issues in aibraincoach/my-food-ai are the record, and BACKLOG.md in the repository is a copy of this list that the PM supplies, so the coder and the planner read the same list. This Doc is private between the PM and the owner, and the coder cannot open it. The coder reads BACKLOG.md, which the owner copies from this Doc. This list usually runs a little ahead of the issues, because an item reaches them only after the PM has filed it. An item stays until its work is merged, its done condition is met and its issue is closed; the "Interdit (Not part of Hackathon)" section holds items that cannot be worked on and says why. Each section is for one role or one state: Backlog for Owner, In Flight (the items the running fleet builds) and Engineering backlog (open work outside it), ordered within a section by the pass that will work them together, not by issue number or date.

Every item is a title line and two paragraphs. The title line carries the GitHub issue number, assigned only once the issue exists, and the number is not one of the three parts. The three parts are: (1) a title a person can read; (2) a first paragraph that states the problem in plain language and in enough depth that a person could fix it; (3) a second paragraph with all the context that helps a person solve the problem, meaning what investigation, work or the owner's observations have established, ending in a done condition. Neither paragraph is a dump of everything known. Write short sentences in the active voice, as the Google developer documentation style guide asks. An item without all three parts is not on the backlog.
