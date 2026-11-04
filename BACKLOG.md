# My Food AI — Backlog†

Last edited: Wednesday 2026-11-04 at 16:35 WIB (UTC+07:00) by Codex, coder reconciliation from the owner-supplied 15:54 WIB copy

The only job of the PM is to maintain this backlog and keep it completely up to date. Failing to do so is immediately terminable.

## Backlog for Owner

### #452 A plainly visible nutrition label is reported as not found

A photo of a pack whose nutrition table can be read is rejected with "No nutrition label found".

The photo of a Goldfish cracker pack, with the label printed in Indonesian and the table fully in the frame, gave "No nutrition label found" with "Take the photo again" and "Type it instead". Done when that photo gives a card with the numbers printed on the label, and a label in English does the same, on the owner's three phones.

### #451 Every barcode scan comes back as not in the database

The owner has scanned several packs on a phone and every scan has failed: the scanner reads the code and the lookup finds no product.

The scanner read 7 622300 76136 3 from an Oreo pack and showed "Not in the database. No product for this code yet." The owner finds the same code with an ordinary web search, at barcodelookup.com/7622300761363. The planner reports that Fleet 13's test confirmed the cause; the phone check remains. Done when this pack gives a product card with its name and nutrition, a second pack from the same shelf does too, and the planner has recorded which source the lookup asks and why it had no entry for this code, on the owner's three phones.

### #525 The meal detail photo is cropped and does not show the whole image

The meal detail page shows the photo in a short, wide frame, so the top and bottom of the photo are cut off. The owner wants the whole image and has asked for it three times.

The owner's screenshot on desktop shows the macaroni photo as a wide strip with the outline masks drawn on the cropped part. The detail photo is drawn to fill its frame (OutlineOverlay.tsx), and the outline masks use the photo's stored width and height. Observe first: measure the frame and the photo on desktop and on phone, and record how much of the photo is cut off. Done when the detail page shows the whole photo with nothing cut off on desktop and on phone, and the outline masks still sit on the right parts of the food.

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

The submission needs the public repository, the video link and a list of everyone who worked on it. Judges stop watching at three minutes, and the video must show the feature working with live Meta model calls and say which open Meta model it uses and where it runs, Muse Spark Open on Baseten (Cerebral Valley, Nov 3). Every feature built is in the video, the not-eaten plate included. Post the video to X as soon as it exists: the Most Viral prize ($20,000) counts likes, reposts and comments on X through the end of Nov 8. Whether the post must exist before the submission deadline is unconfirmed. PRs merge as soon as each holds a counting receipt, and nothing waits on a clock before recording starts. No merges or deploys run from the start of recording until the submission is in. Done when a video under three minutes is on X and the submission is in.

### #379 Phone checks of the installed app over mobile data

Every Run 7 and Run 8 timing check ran in emulation. No physical phone has tested the feed, the photos, installation or posting.

Check on each of the owner's three phones, installed from the home screen, over mobile data: the feed and the first photo show within two seconds (#222, #305); the last feed shows at once and fresh posts appear without jumping (#304); a warm revisit reuses cached photos and the photos look acceptable (#305); the camera, the keyboard and a post from the phone work, with the right photo kept (#6); a post completes through the worker (#322); the capture sheet closes within one second of the tap (#370). Done when each check passes on each of the three phones and each failure is reported to the coder with its number.

### #60 A judge-facing pass makes the public repository start-here ready

The submission requires a public repository, and it still carries the default README.

After the last feature merges, one pass replaces the default README with a short start-here page (#287). All working files stay on main, including the agents' contracts, the Wall of Stupid file, the review policy and the review tools. Nothing is removed or scrubbed. Done when the README is the start-here page and a search of main for host names, account identifiers and billing detail returns only what the owner chose to keep. Fleet 10 closed the issue and Fleet 11 ran the search, so the owner's keep list is what remains.

### #455 The card you swipe to on a drink's photo shows a number and not what the drink is

Swiping right on a drink's photo opens a card with one big millilitre number, so the card does not say what the drink is or why it exists.

The swiped card for the tiki cocktail shows "220 ml" in large type, a line of text and "1,200 ml consumed today" split into drinks and food. A card for a drink leads with its kind as a picture: a coffee cup for coffee with its caffeine, a water cup for water with one cup for every 250 ml drunk, and a cocktail glass or a wine glass for those with their alcohol, and the day's drinks are drawn as the same cups. Done when a coffee, a 500 ml water (two cups), a cocktail and a glass of wine each show their own picture on the swiped card, and a card that holds only liquid reads as a drink at a glance, on the owner's three phones.

### #456 A rum cocktail is logged with 15 mg caffeine

The tiki cocktail post states caffeine that the drink does not contain.

The drink card for the lime and rum tiki cocktail reads "15 mg caffeine" next to 196 kcal, and the day's caffeine total reads 110 mg. Done when a cocktail or any drink with no caffeine source logs no caffeine, the card shows none, and the day's total leaves it out, checked on the tiki cocktail and a glass of wine.

### #457 An alcoholic drink shows its alcohol, not its liquid

A cocktail post shows how much liquid it holds and nothing about the alcohol, so the user cannot tell how much they have drunk.

The post for a lime and rum tiki cocktail shows "220 g" on the photo and 196 kcal, 0 g protein, 17 g carbs and 0 g fat under it, with no alcohol anywhere. For a drink that holds alcohol, the post shows the grams of alcohol and the standard drinks in place of the liquid amount, the drink's liquid is not added to the water total, and Today shows the day's alcohol so far. Done when a photographed cocktail and a typed beer each show their alcohol on the post and in Today, and neither adds to the water tile, on the owner's three phones.

## In Flight

### #579 Photos are captured at 480 × 640 and look blurry on high-density phones

The app stores each photo at 480 × 640 pixels, the size the browser chose for the live camera, and the feed shows a smaller 384 × 512 copy. On a phone with a three-times screen a full-width card needs about 1,170 pixels, so every photo looks soft. The owner finds the blur painful.

The coder measured the owner's Beef noodle post on production at a24587a. The live camera path asks for the rear camera with no width or height and draws one video frame, and the stored originals are 480 × 640, 0.31 megapixels (126,407 bytes), so the meal detail cannot show detail that never reached the upload. The phone's feed copy is byte for byte the same file, so it saves nothing. The feed route then shrinks it to a 384 × 512 WebP of 22,118 bytes. Feed copies are cached for a year with the immutable flag, so a sharper derivative needs a new path or a cache bust. The phone detail upgrades only the first meal photo, not the leftovers original. Photos already captured stay at 480 × 640. The owner reported the blur on Nov 4 at about 15:46 WIB. A sharper photo costs more Storage egress, which #375 names as the largest egress source. The owner unblocked this work at 15:56 WIB on Nov 4 and assigned it for implementation; the former polish hold no longer applies. Observe first: find what resolution the camera can deliver on the owner's three phones, and the bytes of a photo at each size. Done when a photo captured on the owner's three phones is stored at a sharper resolution, the feed and the meal detail show it sharp on a three-times phone, the first photo still shows within two seconds on mobile data, and the bytes per photo before and after are in docs.

### #550 The desktop feed fills the whole window and the Today column is missing

On desktop the feed runs edge to edge and the photo touches the window edge. The Today column does not appear.

The Round 6 design (6a) and the code on main both centre a 500 px feed column beside a 280 px Today column. Production deploys from main. An OpenClaw check on Nov 4 found the Today column present at 1024 to 1366 px wide, so the owner's screenshot may predate a deploy. The feed's own width was not measured. Measure the feed column on the live page at 1280x800. Done when production shows the centred 500 px feed with the Today column as 6a draws it, checked on the live page at 1280x800.

### #512 The phone calendar can show the wrong month summary and jump when older months load

On the phone Days screen, the sticky month summary can stay on the wrong month, and the scroll position can jump when an older month loads.

Reviewer findings on merged PR #482, both reproduced by the coder in isolated component checks with synthetic months, not on the owner's device. The sticky summary can stay on the previous month while November scrolls in (src/components/PhoneCalendar.tsx lines 27 to 38). The anchoring that keeps the view still when an older month loads restores a stale scroll position if the user scrolls while the request is pending (lines 18 to 22 and 40 to 46). The review reported a third issue, but its text was cut off. Observe first: scroll Days across the October and November boundary, and scroll while an older month loads. Done when the summary names the month nearest the top and the view stays still while an older month loads.

### #552 The buttons under each post are 24 px tall and show no pressed or turned-off state

The buttons under a post are too small to hit and look the same at rest, while saving and when turned off.

Design 7a (Round 7) gives 44 px tap areas and every state: rest, pressed, saving, turned off and failed. Done when each button matches 7a on production at 390x844.

### #553 Thumbs up and down look the same when turned off and thumbs down waits for the server

The thumbs turn themselves off while a vote saves and before the analysis exists, with no visible difference. Thumbs down opens nothing until the vote has saved.

This is the first case the owner found for #217. Done when a thumb shows its pressed state at once, looks different when turned off, and thumbs down opens at once, checked on production at 390x844 with the processor slowed.

### #554 Tapping a meal shows nothing until the server answers

Comment, Details, tapping the photo, "more" and Post in the capture sheet wait for the server before anything changes on screen.

Design 7b (Round 7) shows the screen at once, using the photo already on screen while the details load. Done when each of these taps shows a visible change at once, with no layout jump when the details arrive.

### #494 Opening a meal's detail takes 14 seconds

The owner reports 14 seconds from tapping a meal to its detail page opening. He calls it not acceptable.

The owner reported it on Nov 4 at about 07:38 WIB. He measured on an iPhone with the app installed from the home screen, on XL Axiata Prioritas 5G in Indonesia. He gave no meal URL because the installed app shows none. The coder's Chromium audit on production (docs/detail-open-audit.md in PR #475) found useful content at 0.9 to 3.4 seconds, the original photo decoded at 1.2 to 3.7 seconds, 24 to 25 requests with eight repeated, and a 142 KB original downloaded although the feed copy was on screen. It did not measure the iPhone on XL Axiata, so the 14 seconds is unexplained. The audit items below name three suspects: no loading screen on the tap, the same meal read twice, and the full original photo downloaded again. Nobody has timed the detail on current main. Observe first: time the tap to a usable detail on a phone over mobile data and on desktop, and record where the seconds go (server render, database reads, photo download). Done when the detail opens within two seconds on the owner's phone over mobile data, and the report states where the 14 seconds went.

### #323 Every protected page checks sign-in twice (part of #222)

The middleware calls Supabase to verify the user. The home page then calls Supabase to verify the user again. That is two round trips on every page open, on top of the cold function boot.

Run 8 merged one sign-in check per page: the server makes one Auth call, and a forged header is refused. Recorded browser windows still contained 10 and six /auth/v1/user requests, so the whole opening is not yet attributed. API authentication stays intact. Fleet 11 could not close it: minute totals from the logs cannot isolate one opening. Measure with spans tied to one navigation, and count the middleware call, the server helper call and the browser call. Done when a page open makes one sign-in call across the server and the browser together, and an unsigned request still cannot reach a protected page.

### #324 Home computes the day totals twice on every open (part of #222)

The server renders the row of day bubbles with totals for the last 5 days. The browser feed then computes totals again for the feed's days. Today's totals are queried twice on every home open.

Run 8 merged one shared server read of today's totals. Final browser windows still made one or two day-total reads, so a single read across the server and the browser together is unproved. Fleet 11 could not close it for the same reason. Measure with spans tied to one navigation, and count every read that returns today's totals, batch reads included. Done when a home open queries today's totals once across the server and the browser together.

### #520 Every Home open reads the first feed page twice

Home reads the first page of the feed in the server render and again from the browser, so every open pays for both reads.

Planner finding from reading main on Nov 4, not yet measured. The client component always calls its load function after the server render (src/components/Feed.tsx). Related: #373 and #498. Observe first: count the first-page reads of one Home open on current main. Done when one Home open reads the first feed page once, and the request count before and after is in docs.

### #322 The tick function loads the whole worker before it answers (part of #222)

Every app open, tab focus and once-a-minute database wake calls the tick route. It answers three numbers: queued, running and traffic. A cold tick function must first load the whole food-analysis pipeline, so every cold open waits for that.

Run 8 merged lazy loading of the job modules in the tick route. Rapid tick calls passed, but they hit a warm function, so a cold start is unmeasured (docs/tick-cold.md), and a post from a real phone through the worker is untested. Fleet 11 timed one first request per deployment, which does not establish a cold start, and reopened the issue. PR #536 adds an x-tick-cold header and a tick cold log line, and no value has been read yet. Lazy loading is delivered by #334. Done when a cold start of the tick route is timed on production, before and after, with the times in docs, and a post from a real phone completes through the worker.

### #373 The app reads more from the production database than it needs

The app's reads drove egress to 8.66 GB and log ingestion to 1.10 GB in one billing cycle, against 5 GB and 1 GB on Supabase's free plan, and the project was depleting its Disk IO budget. The organization is now on Pro, which includes 250 GB of egress per cycle, but the same reads still cost bandwidth and database load while judges use the app.

Run 8 cut the feed's Supabase traffic per opening from 5.06 MB to 0.523 MB, 89.7%, by reading day totals once. The app and the worker use Supabase's HTTPS APIs, not SQL connections, so the pooler setting does not apply. Managed services (PostgREST, Storage, Realtime) account for many of the connections the Infrastructure page counts, and the historical 31 of 60 is unexplained, as is the 70% RAM on the Micro instance. Log-ingestion bytes are unattributed, since only row counts exist. Done when the billed log-ingestion bytes are attributed to their sources on the usage page and the RAM use on the Micro instance is explained.

### #375 Storage egress is the largest source and was not cut

In the 24 hours before Run 8, Supabase Storage served 2.99 GB across 35,048 requests, almost all to browsers. The Run 8 cut measured the feed's posts reads, not Storage.

docs/egress.md attributes the bytes to browser-class agents but not to which files (feed JPEGs, card PNGs or originals) or which clients. Much of it may be the coder's own 100-opening measurement runs. Log-ingestion bytes were never measured; only row counts were. Done when Storage egress is broken down by file kind and by client (test automation or real users), log-ingestion bytes are measured, and the largest real-user source is cut or shown to be small.

### #471 The recording account can hit the hourly model cap on camera

A recording with several photos on one account can run into the model's hourly limit while the video runs.

Photo drink identification adds one model call per staged photo, counted against the account's hourly cap, and the last audit on production got "You have made a lot of requests this hour." Done when a recording-length session of several photos on one account runs with no cap message, or the account's cap is raised before recording.

### #217 A smoothness audit of every screen

Some controls feel dead or clunky, and nobody has measured how the app responds to touch.

The thumbs above are the first case the owner found. List every tappable control on each screen at 390x844, and for each record the time from the tap to a visible change, whether it shows a pressed state at once, whether it jumps or flickers while it loads, and whether it can be tapped twice. The coder measures in Chrome device emulation with the processor slowed and needs the production sign-in of #196. Done when the table lists every control with those four findings, the slow or dead ones are fixed or filed as items.

### #555 The controls on Days, Search, Profile and the capture modes have not been audited

The Round 7 control table covers the feed, the post and the capture sheet. Days, Search, Profile and the Text, Photo and Barcode modes are not in it.

The designer has not read their controls yet. Add them to the table with the four findings of #217: time to a visible change, pressed state, jump or flicker, and double tap. Done when every control on those screens is in the table and the dead ones are fixed or filed as items.

### #348 A photographed drink's card was not proven on production

The card for a photographed drink was closed without the production check its done condition asked for.

The Fleet 10 report says the selected drink card on screen remains unproven. Done when a photographed drink shows the right drink card on production, on the owner's three phones.

### #351 The drink tile sizes and order were closed on a local test only

The tile sizes and order on the drink sheet were not checked on production.

Only a local test backs the closure. Done when the drink sheet shows its tiles in the right sizes and order on production, on the owner's three phones.

### #449 The food names do not show before the numbers on a new upload

A new upload shows no food names while its numbers are still being worked out.

On a new upload, the card's reader drops the pending food names, so #307 fails there. Done when a new upload shows the foods the app has found while the numbers are still being worked out, on the owner's three phones.

### #453 The barcode prompt is printed over the live camera picture

On the Barcode screen, the line "Point at the barcode. It reads on its own." runs across the camera picture and cannot be read against a busy shelf.

With the camera pointed at a shelf of packs and price labels, the line sits on top of them and the words blend into the picture. Done when the prompt is readable over any camera picture, on the owner's three phones.

### #454 The Days page is not one continuous calendar

Days cuts the calendar into separate month blocks, which no calendar app does, so the user cannot scroll through time as one run of weeks.

On the phone, Days shows November 2026 and October 2026 as two separate blocks, each with its own heading, and the newest month sits on top. Days becomes one continuous calendar: the weeks run on from one to the next in time order with no break, the month name marks where each month starts, and Days opens with today in view. Done when scrolling Days moves through unbroken weeks from October into November, the month names mark where each month starts, and Days opens on today, on the owner's three phones.

### #377 Existing photographed drink posts show no caffeine

A photographed cola posted before Fleet 9 shows no caffeine on its card or in the day's total.

The cola records hold 29.7 mg of USDA caffeine, but they have null beverage categories and no linked item-intake rows. #346 fixes new and re-analysed posts only, and no historical backfill ran. Done when existing photographed drink posts show their stored caffeine on the card and in the day's total.

### #368 Sign-ins through the app may share one rate limit across every user

Supabase limits sign-up and sign-in requests per IP address. If it counts the app's requests against Vercel's address, one script hammering the app's forms could lock every judge out.

Unverified planner finding. The app's sign-up and sign-in run as server actions on Vercel, and the middleware refreshes sessions from Vercel. The Run 8 hammer was refused at request 31, but it called Supabase directly from the coder's machine, so it did not test the app's path (docs/auth-protection.md). A browser agent reported that on Nov 4 between 13:12 and 13:27 WIB it signed up 35 accounts through the production form, one about every 22 seconds. It saw no rate-limit message, no 429 and no CAPTCHA, and it skipped the second-network sign-in because it had no second network. The question is still open, since the earlier direct hammer was refused at request 31 at a faster pace. A second browser run between 14:57 and 15:06 WIB sent 40 more sign-ups about 10 seconds apart, and none was refused. A browser cannot sign up fast enough to reach the earlier limit. The coder deleted all 75 probe accounts and verified them absent. The coder read the Auth logs for all 75 sign-ups: each recorded one of seven app-server addresses, one of them for 36 sign-ups, and never the caller's address, because the sign-up server action does not forward the browser's address. So Supabase counts the app server's addresses. Why no sign-up was refused is unexplained. Observe first: send sign-ups through the form faster than a browser can, then sign in from the owner's phone on mobile data. Use throwaway @example.com accounts only. Done when the report states which IP address Supabase counts for app sign-ins, and a refusal triggered from one machine does not block sign-in from another.

### #523 A meal shows every nutrition value as unavailable

A meal analysed on Nov 4 at 9:53 AM, "Spicy Indonesian macaroni", shows its calories, protein, carbs and fat as unavailable. The owner says the app's food estimates are broken now.

The owner's screenshot of the post (86634d46-b0e3-421a-9b67-1a4e8f5e8e78 on production) shows a comment that reads "Nutrition unavailable: spicy Indonesian fried macaroni snack", and a model line that reads "Identified by Muse Spark 1.3". Judging runs from Nov 4, so a general fault would hit every judge's meal. The coder found on Nov 4 that the matcher rejected every retrieved reference after three searches (the full name, "fried +macaroni" and "fried +pasta") and never tried the bare name "macaroni". No lookup failed, nothing hit a rate limit, and nothing points to a Fleet 11 regression. Fresh USDA requests for "macaroni" and "macaroni cooked" returned records (357 kcal per 100 g, and Pasta, cooked, 157 kcal per 100 g), which are not confirmed equivalents of a fried snack. Of 15 posts in the last 24 hours, five had at least one unavailable field, and only this one had every value unavailable; the others were composite dishes the matcher rejected. Fleet 14 merged strict USDA, closest generic USDA and then a labelled model estimate when no record qualifies; the Open Food Facts fallback covers barcode scans. The original macaroni post and the owner's phone acceptance have not been re-proven by those source changes. The owner asked for a fallback. The candidate is to search USDA for the closest generic food before saying unavailable. The owner has ruled: when no USDA record is available, the model makes the estimate. In the owner's words, a zero value, an unavailable value or a no-op is death in this business, and it is worse than a bad estimate. Done when, after the matcher's strict searches fail, it tries the bare food name, and a re-analysed post of this food shows nutrition from the closest USDA record, labelled with that record's name, or, when no record qualifies, from a model estimate. No value is left unavailable, zero or blank.

### #370 The camera view stays open for a long time after a photo is taken

After a photo is taken, the camera view stays on screen for a long time before the post shows in the feed. People will not wait that long.

The capture sheet sends its post-created event and closes only after a successful post, so it waits on the upload and the server. The owner reports the wait on his phone. Observe first: time the tap to the sheet closing and to the new post showing, on a phone over mobile data, and record the size in bytes of each photo the phone uploads. Then close the sheet at the tap and show the new post at the top of the feed in its processing state while the upload finishes. Done when the sheet closes within one second of the tap on a throttled connection, the post appears at the top of the feed in its processing state, and a failed upload is shown on that post.

### #222 The feed fails to open, and photos and cards take too long to appear

On a large account the feed sometimes shows an error or never appears. When it opens, photos and cards take a long time to show, so the app feels broken and slow.

Run 8 merged the cold-open fixes (#322, #323, #324, #326). In emulation, 100 of 100 browser openings passed and the five final cold photos took 1.48 to 1.83 seconds. The original failures (3 server errors and 15 blank feeds in 100 openings on the largest test account, 146 posts) never reproduced on Run 7's baseline, so their cause is not isolated; the worker's empty-claim loop is a suspect (separate item). The runtime logs return 403 for the coder, so the stack for digest 3642131196 exists only in the Vercel console. Done when the feed and the first photo show within two seconds on the owner's phone over mobile data.

### #281 A Meta open-weight model identifies the food (hackathon bonus)

The hackathon pays a $10,000 bonus for a build on a Meta open-weight model, and the app calls only the hosted Meta API.

Use Muse Spark Open (meta-models/muse-spark-open-1026) through Baseten's OpenAI-compatible endpoint, https://inference.baseten.co/v1, for the identify-and-portions call. The key works only with that model and never goes in the repository, an issue or this backlog. Confirm the coder can sign in to Baseten with the key before the trial. The model always reasons, so check output caps that include reasoning. The Meta client hardcodes model names, and the ten-photo harness cannot choose a model host. Trial first in a throwaway clone that swaps only that call, and spend at most 5 US dollars. SAM and transcription stay on the Meta API, and the USDA lookup is unchanged. Compare the ten meal photos and one caption, "I ate half the rice", against the current path. A qualifying step must be a real, switchable path on main that a judge can reproduce, with the model ID logged. Cerebral Valley answered on Nov 3 that Muse Spark Open counts however it runs, including through Baseten. Done when a real, switchable path on main runs the identify-and-portions step on Muse Spark Open through Baseten, the model ID is logged, the results against the ten photos are in docs, and the owner has switched it on in Profile, logged a meal, and seen the Muse Spark Open line in that meal's post detail on production.

### #372 Feed photos are too large for a phone on mobile data

A feed photo downloads at a size far larger than a phone card shows, so the first photo arrives late and every revisit pays for it again.

The sampled feed image is 152,193 bytes and its response carries no Cache-Control header (docs/media-loading.md). Several cards cost megabytes on mobile data, and the cold first photo measured 2.10 s against the 2 s target. The feed photo route (src/app/api/media/feed/\[owner\]/\[post\]/\[media\]/v1.webp/route.ts) reads the original from Storage on every request. Find the largest size a feed card needs on a phone and serve that instead of the original. Keep the original where post detail needs it. Done when the bytes per feed photo before and after are in docs, the first photo of the feed shows within two seconds on mobile data, and the photos look the same on a phone.

## Engineering backlog

### #580 Nine controls have touch targets smaller than 44 pixels

Nine measured controls are smaller than the required 44 by 44 pixel touch area, so a tap near the visible control can miss it.

Production measurements found: the bottom-bar plus is 34 by 34; Search and Drink description inputs are 21 pixels high; the Photo, Text and Barcode mode tabs are 36 pixels high; the caption field is 42 pixels high; the caption more button is about 37 by 20; and Saved meals Log now is 34 pixels high. The controls showed pressed feedback promptly, which does not make their hit areas large enough. Done when each actual touch area is at least 44 by 44 pixels and physical taps at its edges activate it without activating a neighbour.

### #578 The leftovers photo and the regular photo post through different code

The app has at least two code paths that post a photo, and the leftovers one is slower and blocks the camera. Other jobs may be done twice in different ways, and nobody has listed them.

The owner asked for a DRY audit and a service-level architecture audit at 15:42 WIB on Nov 4, aimed at making the app faster. The first known case is the leftovers photo: the coder reported that it waits for image encoding, two uploads and the attachment steps before it closes the camera, while a regular post hands the work to the upload manager at once. The coder delivered the audit of main at a24587a with 26 ranked findings and changed no code. Fix sizes describe scope, not time. The top ranks are two photo-upload workflows (large), several components that each refresh on one meal completion (large), the meal detail waiting for optional services (medium), the same photo delivered under several identities (medium to large) and nutrition read twice by feed hydration (large). The smallest fixes are the profile handle read by separate readers (rank 26, small), serial drink nutrition lookups (rank 16, small to medium), a photo reloaded in prior matching (rank 14, small to medium), repeated queue counts (rank 25, small to medium) and a repeated search interpretation (rank 24, small to medium). Done when the owner has ruled on each of the 26 findings and each one he accepts is filed as its own item.

### #567 The admin dashboard shows no counts of users and posts

The admin dashboard at /admin shows queue depth, the oldest waiting job, failures, throughput, recent errors and links to per-post model traces. It does not show how many people signed up or how many meals were posted.

The owner asked for a surface for himself at 15:26 WIB on Nov 4. The owner opened /admin on production at 15:27 WIB and saw Not found. The coder reported on Nov 4 that production has one admin account, the owner's meal account has the role user, and /admin refuses every non-admin with that Not found by design, so it is not a missing page. Observe first: find where the dashboard reads its figures and what read gives user and post totals without exposing any one user's content. Done when the admin account signs in and sees app-wide counts of users, posts, model calls and failures, no other user's photos, captions or email addresses appear on it, and a non-admin account that opens it is refused.

### #568 Judges have no page that shows how the app works

A judge who signs up starts with an empty account and nothing that says what the app does or which models it runs. A judge must never see another user's data.

The owner asked for a surface for the judges at 15:26 WIB on Nov 4 and has not said what it shows. The default here is the models the app runs plus the judge's own meals. The coder tested two fresh production accounts on Nov 4. The second account could not read the first one's posts, profile, comments, intake, saved meals or photos through any route tried, and no dedicated judge page exists. One exception: a signed photo URL issued to the first account works for anyone who holds it until it expires, and the second account could not obtain one. Observe first: find where a judge account would reach the page, such as Profile. Done when a judge account sees a page showing the models in use and the meals he logged himself, and a second test account cannot read the first account's posts, photos or profile.

### #569 The row of day circles at the top of Home is cut off at the right edge

On the phone, the row of day circles above the feed shows four whole circles and a fifth cut off by the screen edge. The owner wants the row either to scroll or never to show a partly drawn circle.

The owner's phone screenshot at 2:34 PM on Wed Nov 4 shows Today, Tue 3, Mon 2 and Sun 1 whole, and Sat 31 cut off at the right edge. The designer reported the cause: the rings use five 66 px columns with 14 px gaps, which need 386 px, and the phone leaves 358 px after the side padding, while DayRings.tsx clips the row instead of scrolling it. The owner ruled that the row scrolls sideways back in time. The designer redrew it as Round 7 frames 7c and 7d and updated the Round 3 and Round 5 phone frames. Today comes first with five whole rings and the edge of a sixth showing, and each swipe stops on a ring. The feed stays on today while the row scrolls. Tapping a ring with posts opens that day, and rings without posts are grey and cannot be tapped. The row starts with 30 days, loads 30 more near the end and stops at the first post, so the last ring is whole. Tapping Home while on Home returns the row to Today. The designer's spec for DayRings.tsx is in the Round 7 hit list. Done when the row matches 7c and 7d at 390x844 and on the owner's three phones.

### #570 A leftovers photo takes several seconds to post while a regular photo is fast

Posting a photo of leftovers takes several seconds to show, while a regular meal photo shows at once. The owner says the leftovers photo is not snappy and that this is not acceptable.

The owner reported it on Nov 4 at about 14:46 WIB from his phone. The owner timed adding a leftover at about 11 seconds on his phone at about 14:52 WIB. The coder read production records for that post. The leftovers path waits for image encoding, upload signing, two uploads one after the other (about 1.3 s and 1.2 s), the attachment reservation and the attachment completion before it closes the camera, while a regular post hands the work to the upload manager and closes at once. The owner wants the leftovers photo to post in the background the same way, and believes the two paths are separate functions. The logged time from staging to attachment was about 4.9 seconds, so most of the 11 seconds is unaccounted for without a device trace. The queue wait before processing (24.9 s) and the processing (12.5 s, of which a 9.9 s model call) delay the updated result, not the camera. The coder's audit of main at a24587a names two causes: two photo-upload workflows (rank 1, a large fix) and one worker lane shared by analysis and maintenance (rank 11, a large fix), which explains the queue wait. Observe first: on a phone over mobile data, time a regular photo and a leftovers photo from the tap to the post showing in the feed, and record where the extra seconds go. Done when a leftovers photo shows in the feed as quickly as a regular photo, on the owner's three phones.

### #571 A post started while another is going up breaks the other post with "The meal could not be saved"

Starting a second post while an earlier post is still going up can end with "The meal could not be saved.", and the owner has to press Post again to get the meal saved.

The owner's phone screenshot at 2:19 PM on Wed Nov 4 shows the toast "The meal could not be saved." with a Dismiss button over the feed. The first post in the feed, "Beef noodle", shows a grey placeholder bar under its caption where the analysis would be. The owner reports posting one photo, then taking a photo of another food while the first post was going up. When the first post completed, the interface stopped working for one of the two posts. The owner pressed Post again and the meal then appeared in the feed. The owner has not said which of the two posts stopped working, and the screenshot does not show which raised the error, and whether the two overlap in the capture sheet, the upload or the save is not confirmed. Observe first: on a phone, start a second post while the first is still going up, and record which request raises the error and why. Done when one post finishing never stops the screen of the other, and both meals save on the first press of Post, on the owner's phone.

### #572 The closest-food fallback never runs when the model stops after one search

Some foods still show nutrition as unavailable because the new closest-food fallback never runs for them. Pickled ginger is one example.

The planner measured in production that 12 of 119 unavailable results in 14 days stopped after one search, about 10%. The fallback (PR #549) fires only when the model's first decision names a base food, and in these cases it names none. Done when a food whose first decision names no base food gets its own bare name searched, and a regression test covers that case.

### #573 The closest-record label is stored on every nutrient entry

The note that a food's numbers come from a similar USDA record is saved inside every nutrient entry of the food's micronutrients JSON, not once per food. This adds bytes to every row that uses the fallback.

The planner flagged it against the egress concern in #373. Done when the label is stored once per food, the meal's first comment still names the record, existing readers and tests pass, and rows already written are migrated or confirmed harmless.

### #557 An incomplete saved label can hide a barcode provider outage

A barcode lookup can report that a product is missing when a provider is down and the account holds an incomplete saved label correction.

Fleet 13's review found that the resolver suppresses provider errors for corrections that may lack the name or serving unit needed to produce a card. No production failure is claimed. Done when incomplete corrections preserve the provider error, complete corrections still work during outages, and regression tests cover both.

### #574 The Days calendar and the day summary count a different number of posts

For October 31 on a test account, the Days calendar says 5 posts and the day summary says 4 posts. Both show 1,842 kcal.

An OpenClaw production check on Nov 4 read the calendar's accessibility label as "2026-10-31, 5 posts, 1,842 kcal" and the day summary as "Consumed: 1,842 kcal · 4 posts". The cause is unknown. One of the two may count a post the other leaves out, such as a drink, a leftovers post or a superseded one. Done when both places count the same posts for that day, or the screen says why they differ, checked on production against the account's October 31 posts.

### #575 A meal with unavailable nutrition does not say why

When a food shows nutrition as unavailable, an ordinary user cannot find out why. The owner could not learn why the macaroni failed without an agent reading the database traces.

The reason exists only in the model call log. For the macaroni post it read that no compatible generic fried-pasta record was present, and the plain name "macaroni" was never searched (#523). Nothing shows the user this. The Fleet 13 fix for #523 adds a label only when a close USDA record is found, so a food with no close record still says nothing. Done when a meal with an unavailable value tells the user, in plain words and without database access, which food failed and why, checked on production with a meal known to be unavailable.

### #279 Sign-up and sign-in resist being hammered

Anyone can send sign-up and sign-in requests as fast as a script can, to guess passwords, create accounts in bulk or run up the email and model bills, and nobody has shown what stops them.

CAPTCHA stays off until the app goes public. Run 8 merged a dormant hCaptcha widget and token path (#336). Called directly from the coder's machine, Supabase refused the hammer at sign-up 31 and sign-in 32, and the 31 throwaway accounts were deleted. The owner holds the site key and the secret. The secret lives only in Supabase Auth and never goes into the repository, an issue, an order or this backlog. To turn CAPTCHA on, set NEXT\_PUBLIC\_HCAPTCHA\_SITE\_KEY in Vercel production and redeploy, then enable CAPTCHA in Supabase Auth, never the reverse. Done when CAPTCHA is on for sign-up and sign-in on production and a script that hammers sign-up and sign-in is refused.

## Engineering backlog - design

### #576 The desktop New post window scrolls by 18 px at 1366x650

At 1366x650 the New post window holds 668 px of content in a 650 px window, so it scrolls 18 px.

An OpenClaw production check on Nov 4 measured the overflow. The shutter itself sits fully in view, and the bounds of the footer row were not captured. Done when the window shows no vertical scroll at 1366x650 and 1024x700, checked on production.

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
